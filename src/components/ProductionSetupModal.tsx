import React, { useState, useRef, useEffect } from 'react';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  X,
  Building2,
  Users,
  UserPlus,
  FileText,
  Calendar,
  Lock,
  Mail,
  Phone,
  Database,
  ArrowRight,
  Sparkles,
  Smartphone,
  Wifi,
  Copy,
  Cloud,
  CloudOff,
  Server,
} from 'lucide-react';
import { dbService } from '../services/db';
import { cloudSyncService, CloudSyncState } from '../services/cloudSync';
import { UserProfile } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ProductionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSystemStateChanged: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ProductionSetupModal: React.FC<ProductionSetupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSystemStateChanged,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'go-live' | 'workflow' | 'cloud' | 'backup' | 'install'>('go-live');
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const systemMode = dbService.getSystemMode();
  const prodConfig = dbService.getProductionConfig();
  const branches = dbService.getActiveBranches();

  // Cloud Sync State
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>(cloudSyncService.getState());
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  useEffect(() => {
    return cloudSyncService.subscribe(setCloudSyncState);
  }, []);

  const handlePushToCloud = async () => {
    setIsCloudSyncing(true);
    setActionMessage(null);
    try {
      const ok = await cloudSyncService.pushLocalToCloud(false);
      if (ok) {
        setActionMessage({
          type: 'success',
          text: 'All borrower records, active loans, and repayments successfully synchronized to central Firestore cloud!',
        });
      } else {
        setActionMessage({
          type: 'error',
          text: 'Cloud sync encountered an issue. Check network connection.',
        });
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsCloudSyncing(true);
    setActionMessage(null);
    try {
      const ok = await cloudSyncService.pullFromCloud();
      if (ok) {
        setActionMessage({
          type: 'success',
          text: 'Latest company records downloaded from central cloud database successfully.',
        });
        onSystemStateChanged();
      } else {
        setActionMessage({
          type: 'error',
          text: 'Failed to pull cloud updates.',
        });
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Go Live Form State
  const [adminEmail, setAdminEmail] = useState(
    prodConfig?.superAdminEmail || 'obayomikayode56@gmail.com'
  );
  const [adminName, setAdminName] = useState(
    prodConfig?.superAdminName || 'Kayode Obayomi'
  );
  const [adminPhone, setAdminPhone] = useState(
    prodConfig?.superAdminPhone || '+234 803 555 1020'
  );
  const [selectedBranch, setSelectedBranch] = useState(
    branches[0]?.name || 'Lagos Island (Balogun Market)'
  );
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // File input ref for restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLaunchProduction = (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    if (!adminEmail || !adminEmail.includes('@')) {
      setActionMessage({ type: 'error', text: 'Please enter a valid administrator email address.' });
      return;
    }

    if (!adminName.trim()) {
      setActionMessage({ type: 'error', text: 'Please provide the Administrator full name.' });
      return;
    }

    if (!confirmWipe && systemMode === 'demo') {
      setActionMessage({
        type: 'error',
        text: 'Please check the confirmation box acknowledging that sample demo records will be cleared for a clean ledger.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      dbService.initializeLiveProduction({
        superAdminEmail: adminEmail,
        superAdminName: adminName,
        superAdminPhone: adminPhone,
        branchName: selectedBranch,
      });

      setActionMessage({
        type: 'success',
        text: '🚀 Live Production Mode successfully initialized! Fictional records cleared and ₦0.00 pristine ledger established.',
      });
      onSystemStateChanged();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to initialize live production mode.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const json = dbService.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `grateful_relief_db_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setActionMessage({
        type: 'success',
        text: 'Database backup downloaded successfully to your computer.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to download database backup.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (!text) return;

      const result = dbService.importData(text);
      if (result.success) {
        setActionMessage({
          type: 'success',
          text: `Backup restored successfully! Loaded ${result.recordCounts?.borrowers ?? 0} borrowers and ${result.recordCounts?.loans ?? 0} loans.`,
        });
        onSystemStateChanged();
      } else {
        setActionMessage({
          type: 'error',
          text: result.message,
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToDemo = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the demonstration sandbox dataset? This will load the sample market borrowers and test loans.'
      )
    ) {
      dbService.resetToDemoData();
      setActionMessage({
        type: 'success',
        text: 'Demonstration sandbox dataset restored successfully.',
      });
      onSystemStateChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 sm:p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
                Grateful Relief Program Limited • RC: 1894220
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Live Operations & Production Readiness Assistant
              </h2>
            </div>
          </div>

          <p className="text-xs text-emerald-200/80 max-w-xl">
            Transition smoothly between Demonstration Sandbox and Live Real-Time Operations. Manage Super Admin credentials, clean ledgers, and database backups.
          </p>

          {/* Mode Badge Indicator */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                systemMode === 'production'
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  systemMode === 'production' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>
                {systemMode === 'production'
                  ? '🟢 LIVE PRODUCTION SYSTEM (Clean Audited Ledger)'
                  : '🟡 DEMONSTRATION & SANDBOX MODE (Sample Data Loaded)'}
              </span>
            </div>

            {systemMode === 'production' && prodConfig?.initializedAt && (
              <span className="text-[11px] text-emerald-300/80">
                Live since: {new Date(prodConfig.initializedAt).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6">
          <button
            onClick={() => {
              setActiveTab('go-live');
              setActionMessage(null);
            }}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'go-live'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>Go Live / Clean Slate</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('workflow');
              setActionMessage(null);
            }}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'workflow'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Real-Time Workflow Guide</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('cloud');
              setActionMessage(null);
            }}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'cloud'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-500" />
            <span className="flex items-center gap-1.5">
              <span>Central Cloud Sync</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('backup');
              setActionMessage(null);
            }}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup & Restore (JSON)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('install');
              setActionMessage(null);
            }}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'install'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Install App & Offline PWA</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 max-h-[65vh] overflow-y-auto space-y-5">
          {actionMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* TAB 1: GO LIVE / CLEAN SLATE */}
          {activeTab === 'go-live' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  What happens when you Launch Live Production?
                </h3>
                <ul className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>
                    <strong className="text-slate-900 dark:text-white">Clean ₦0.00 Ledger:</strong> Fictional demonstration borrowers, test loans, and dummy repayments are removed so your real financial statements start with absolute integrity.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Super Admin Provisioned:</strong> Your real email (<strong>{adminEmail}</strong>) is established as the principal Managing Director / Super Admin with full access.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Structure Preserved:</strong> Grateful Relief Program Limited corporate details, Nigerian branches (Balogun, Tejuosho, Arena, Ikeja, Alaba), and standard microfinance products remain active.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Immediate Readiness:</strong> You can directly begin adding your real staff and entering live market customer KYC.
                  </li>
                </ul>
              </div>

              <form onSubmit={handleLaunchProduction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Super Administrator Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      placeholder="e.g. Kayode Obayomi"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Super Administrator Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="e.g. obayomikayode56@gmail.com"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Official Nigerian Phone Number
                    </label>
                    <input
                      type="text"
                      value={adminPhone}
                      onChange={e => setAdminPhone(e.target.value)}
                      placeholder="+234 803 555 1020"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Headquarters / Primary Branch
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={e => setSelectedBranch(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {systemMode === 'demo' && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="confirmWipe"
                      checked={confirmWipe}
                      onChange={e => setConfirmWipe(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="confirmWipe" className="text-xs text-amber-900 dark:text-amber-200 cursor-pointer">
                      <strong>Yes, establish my Live Production Ledger:</strong> Clear all sample demonstration customers and test loans, configure my Super Admin account, and initialize clean accounting at ₦0.00.
                    </label>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>{systemMode === 'production' ? 'Update Live Admin Profile' : '🚀 Initialize Live Production Mode'}</span>
                  </button>

                  {systemMode === 'production' && (
                    <button
                      type="button"
                      onClick={handleResetToDemo}
                      className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Switch back to Demo Sandbox</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: REAL-TIME WORKFLOW GUIDE */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-bold text-sm mb-1">Standard Operating Procedure for Grateful Relief Program Limited</p>
                <p>
                  Follow these 5 steps to smoothly onboard real market traders and field staff for live operations across your branches.
                </p>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-sm flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Register Real Staff</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Add Loan Officers (field collections), Branch Managers (branch approvals), and Cashiers with their phone numbers and assigned branch.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab?.('staff');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
                  >
                    <span>Staff Registry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Register Real Borrowers & KYC</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Input Nigerian market traders with their Market Stall Number, BVN, NIN, Next of Kin, and designated Loan Officer.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab?.('borrowers');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
                  >
                    <span>Borrowers & KYC</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-sm flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Submit Loan Applications</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Loan Officer creates application (e.g. ₦50,000 for 24 weekdays). Enforces maker-checker: officer cannot self-approve.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab?.('applications');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
                  >
                    <span>Applications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold text-sm flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Approve & Disburse</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Administrator signs off and releases funds via Cash or Bank Transfer. Generates legal Loan Agreement contract.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab?.('disbursements');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
                  >
                    <span>Disbursements</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0">
                      5
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Record Daily Field Collections & Thermal Receipts</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Record daily collections in Balogun/Tejuosho/Arena markets. Issue thermal receipts instantly and end the day with cash sign-off.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab?.('collections');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold shrink-0 flex items-center gap-1.5"
                  >
                    <span>Daily Collections</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CENTRAL CLOUD SYNC */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">
              <div className="bg-sky-50 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-sky-950 dark:text-sky-100">
                        Google Cloud Firestore Central Database
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {cloudSyncState.status === 'connected' ? 'LIVE SYNC ACTIVE' : cloudSyncState.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-sky-800 dark:text-sky-300 mt-1 leading-relaxed">
                      All field officers, accountants, and branch managers share one centralized database. Any new client registered, loan approved, or cash collected in the field immediately reflects across all staff devices in real time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cloud Parameters Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5" />
                  Cloud Infrastructure Connection
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Cloud Project ID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{cloudSyncState.projectId || 'argon-portfolio-m5v9p'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Firestore Database ID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate block" title={cloudSyncState.databaseId}>
                      {cloudSyncState.databaseId || 'ai-studio-gratefulrelieflo-b037ad62-da29-4ff6-bdff-7cc029881e38'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Sync Engine Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Automatic Bi-Directional Sync
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Last Cloud Sync</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 text-xs block mt-0.5">
                      {cloudSyncState.lastSyncedAt ? new Date(cloudSyncState.lastSyncedAt).toLocaleTimeString() + ' (' + new Date(cloudSyncState.lastSyncedAt).toLocaleDateString() + ')' : 'Connecting...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cloud Synchronization Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handlePushToCloud}
                  disabled={isCloudSyncing}
                  className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 text-left transition group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Push Local Data to Cloud</span>
                    <RefreshCw className={`w-4 h-4 text-emerald-600 ${isCloudSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                    Broadcasts your latest borrowers, loans, and branch addresses to the central database now.
                  </p>
                </button>

                <button
                  onClick={handlePullFromCloud}
                  disabled={isCloudSyncing}
                  className="p-4 rounded-2xl border border-sky-300 dark:border-sky-700/60 bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100 text-left transition group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-sky-950 dark:text-sky-200">Pull Latest Cloud Updates</span>
                    <Download className="w-4 h-4 text-sky-600 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-sky-800 dark:text-sky-400">
                    Fetches and refreshes recent loans or collections recorded by colleagues on other devices.
                  </p>
                </button>
              </div>

              {/* Multi-Device Staff Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  How Staff Members Share the Same Database
                </h5>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>Share the app link with your staff or install the PWA on their Android/iPhone.</li>
                  <li>When any staff member opens the app, it automatically connects to this central Firestore database.</li>
                  <li>When an officer registers a customer in Balogun or Tejuosho Market, that borrower instantly appears on the branch manager and admin screens.</li>
                  <li>If an officer enters a basement or dead zone with no cellular network, the app continues working locally, and automatically pushes collections as soon as signal returns.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Zero Data Loss Guarantee
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Export full database snapshots to save on your computer, external flash drives, or cloud storage. Restore your entire database anytime with 1 click.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Export Live Database (.JSON)</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Downloads a complete snapshot of all customer profiles, loan schedules, staff records, receipts, and audit trails.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Restore Database from Backup</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Upload a previously exported JSON backup file. Validates schema integrity before replacing database state.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select Backup File (.JSON)</span>
                  </button>
                </div>
              </div>

              {/* Reset to Demo Sandbox Option */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Training Sandbox</span>
                  <p className="text-[11px] text-slate-500">Need to demo the software to new staff or investors?</p>
                </div>
                <button
                  onClick={handleResetToDemo}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Demo Fixtures</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: INSTALL APP & OFFLINE PWA */}
          {activeTab === 'install' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                      Installable Field App & Cache-First Service Worker
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                      Designed for fast field operations in Nigerian trading markets (Balogun, Idumota, Tejuosho, Alaba, Arena). Install the app directly on Android and iPhone devices without going through app stores.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live App Link Share Box */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Direct Live Application Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={window.location.origin || 'https://ais-pre-nmgklwoi2p3old6htmtos4-401886123525.europe-west1.run.app'}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin || 'https://ais-pre-nmgklwoi2p3old6htmtos4-401886123525.europe-west1.run.app');
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl shrink-0 transition flex items-center gap-1.5 ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Send this link to loan officers and branch staff via WhatsApp, SMS, or email.
                </p>
              </div>

              {/* Direct Install CTA */}
              {isInstallable && (
                <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl text-white shadow-md flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">Browser Ready for One-Click Install</h4>
                    <p className="text-[11px] text-emerald-100 mt-0.5">Click to add Grateful Relief Loan Manager directly to your home screen</p>
                  </div>
                  <button
                    onClick={async () => {
                      await install();
                    }}
                    className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-xs transition shrink-0"
                  >
                    Install Now
                  </button>
                </div>
              )}

              {/* Offline Field Resilience Explainer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <Wifi className="w-4 h-4 text-emerald-600" />
                    <span>Cache-First Service Worker Strategy</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    All application code, stylesheets, company branding icons, and Google Fonts are cached locally on device first. Even inside deep market stalls with zero signal bars, the app opens instantaneously.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Safe Offline Ledger Storage</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Field officers can record borrower repayments, input new KYC profiles, and view amortization schedules completely offline. Local storage holds every record until connectivity resumes.
                  </p>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  How to Install on Mobile Devices
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Android (Chrome):</span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>Open the app link in Google Chrome</li>
                      <li>Tap the Chrome menu (<strong>⋮</strong> in top-right)</li>
                      <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                      <li>Launch from your phone home screen like a native app</li>
                    </ol>
                  </div>
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">iPhone / iPad (Safari):</span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>Open the app link in <strong>Safari</strong></li>
                      <li>Tap the <strong>Share</strong> button at bottom</li>
                      <li>Select <strong>"Add to Home Screen"</strong></li>
                      <li>Tap <strong>Add</strong> to launch in standalone mode</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Grateful Relief Program Limited • Lagos, Nigeria (₦)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
