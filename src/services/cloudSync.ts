import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { dbService, AppDatabase } from './db';
import firebaseConfig from '../../firebase-applet-config.json';

export interface CloudSyncState {
  status: 'connected' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: string | null;
  projectId: string;
  databaseId: string;
  errorMessage?: string;
  pendingSyncCount: number;
}

class CloudSyncService {
  private state: CloudSyncState = {
    status: 'syncing',
    lastSyncedAt: null,
    projectId: firebaseConfig.projectId,
    databaseId: (firebaseConfig as any).firestoreDatabaseId || '',
    pendingSyncCount: 0,
  };

  private listeners: Set<(state: CloudSyncState) => void> = new Set();
  private unsubscribeSnapshot: (() => void) | null = null;
  private isPushingToCloud: boolean = false;
  private isPullingFromCloud: boolean = false;
  private initialSyncComplete: boolean = false;

  constructor() {
    this.init();
  }

  public getState(): CloudSyncState {
    return { ...this.state };
  }

  public subscribe(listener: (state: CloudSyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach(fn => {
      try {
        fn(s);
      } catch (err) {
        console.error('CloudSync listener error', err);
      }
    });
  }

  private updateStatus(
    status: CloudSyncState['status'],
    errorMessage?: string,
    lastSyncedAt?: string
  ) {
    this.state.status = status;
    if (errorMessage !== undefined) this.state.errorMessage = errorMessage;
    if (lastSyncedAt !== undefined) this.state.lastSyncedAt = lastSyncedAt;
    this.notify();
  }

  /**
   * Initialize real-time synchronization with Firestore
   */
  public async init() {
    try {
      this.updateStatus('syncing');

      // Firestore central shared document for Grateful Relief Program
      const centralDocRef = doc(db, 'system', 'central_state');

      // 1. Initial check or push if cloud is empty
      const docPath = 'system/central_state';
      let existingSnap;
      try {
        existingSnap = await getDoc(centralDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, docPath);
      }

      if (!existingSnap?.exists()) {
        // First-time setup: push initial local database to cloud so all staff share it
        console.info('Central cloud database is new. Bootstrapping with current company data...');
        await this.pushLocalToCloud(false);
      } else {
        // Cloud data exists: hydrate local state with central cloud data
        const cloudData = existingSnap.data();
        if (cloudData && cloudData.payload) {
          try {
            const parsed = typeof cloudData.payload === 'string'
              ? JSON.parse(cloudData.payload)
              : cloudData.payload;
            dbService.replaceDatabase(parsed);
            this.updateStatus('connected', undefined, new Date().toISOString());
          } catch (e) {
            console.error('Failed to parse central cloud payload', e);
          }
        }
      }

      this.initialSyncComplete = true;

      // 2. Set up real-time onSnapshot listener so updates from other officers propagate live
      if (this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
      }

      this.unsubscribeSnapshot = onSnapshot(
        centralDocRef,
        snapshot => {
          if (!snapshot.exists()) return;
          if (this.isPushingToCloud) return; // Ignore echoes from our own write

          const data = snapshot.data();
          if (data && data.payload) {
            try {
              const parsed = typeof data.payload === 'string'
                ? JSON.parse(data.payload)
                : data.payload;

              // Only update if cloud version timestamp is different or updated by another user
              this.isPullingFromCloud = true;
              dbService.replaceDatabase(parsed);
              this.isPullingFromCloud = false;

              const syncedTime = data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString();
              this.updateStatus('connected', undefined, syncedTime);
            } catch (err) {
              console.error('Error applying cloud sync snapshot', err);
            }
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, docPath);
          this.updateStatus('error', error.message);
        }
      );

      // 3. Listen to local dbService changes and push to Firestore
      dbService.subscribe(() => {
        if (!this.isPullingFromCloud && this.initialSyncComplete) {
          this.debouncedPush();
        }
      });

      this.updateStatus('connected', undefined, new Date().toISOString());
    } catch (err: any) {
      console.warn('Could not establish real-time cloud connection, running in local offline mode:', err);
      this.updateStatus('offline', err?.message || 'Offline - using local storage');
    }
  }

  private debounceTimer: any = null;
  private debouncedPush() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.pushLocalToCloud(true);
    }, 800);
  }

  /**
   * Pushes the complete local database state to central Firestore
   */
  public async pushLocalToCloud(silent: boolean = false): Promise<boolean> {
    if (this.isPushingToCloud) return false;
    this.isPushingToCloud = true;

    try {
      if (!silent) this.updateStatus('syncing');
      const centralDocRef = doc(db, 'system', 'central_state');
      const fullDb = dbService.getFullDatabase();
      const payloadString = JSON.stringify(fullDb);

      const docPath = 'system/central_state';
      try {
        await setDoc(centralDocRef, {
          payload: payloadString,
          updatedAt: new Date().toISOString(),
          lastSyncServerTime: serverTimestamp(),
          updatedBy: dbService.getCurrentUser()?.email || 'system',
          updatedByName: dbService.getCurrentUser()?.fullName || 'Staff User',
          version: '2.0',
          recordsSummary: {
            borrowers: fullDb.borrowers.length,
            loans: fullDb.loans.length,
            repayments: fullDb.repayments.length,
            branches: fullDb.branches.length,
            staff: fullDb.users.length,
          },
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }

      const now = new Date().toISOString();
      this.updateStatus('connected', undefined, now);
      return true;
    } catch (err: any) {
      console.error('Failed to push to cloud database:', err);
      this.updateStatus('error', err?.message || 'Failed to sync with cloud');
      return false;
    } finally {
      this.isPushingToCloud = false;
    }
  }

  /**
   * Manually pull the latest state from Firestore
   */
  public async pullFromCloud(): Promise<boolean> {
    this.updateStatus('syncing');
    try {
      const centralDocRef = doc(db, 'system', 'central_state');
      const snap = await getDoc(centralDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.payload) {
          const parsed = typeof data.payload === 'string'
            ? JSON.parse(data.payload)
            : data.payload;
          this.isPullingFromCloud = true;
          dbService.replaceDatabase(parsed);
          this.isPullingFromCloud = false;
          this.updateStatus('connected', undefined, new Date().toISOString());
          return true;
        }
      }
      this.updateStatus('connected', undefined, new Date().toISOString());
      return true;
    } catch (err: any) {
      this.updateStatus('error', err?.message || 'Failed to pull cloud data');
      return false;
    }
  }
}

export const cloudSyncService = new CloudSyncService();
