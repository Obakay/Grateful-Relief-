import React, { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOffline, wasOffline, effectiveType } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // If user dismissed this session while still offline, reset dismiss when back online
  if (!isOffline && dismissed) {
    setDismissed(false);
  }

  if (wasOffline && !isOffline) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md transition-all animate-fadeIn">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="font-semibold">Back Online:</span>
          <span>Internet connectivity restored. Local field transactions are in sync.</span>
        </div>
      </div>
    );
  }

  if (isOffline && !dismissed) {
    return (
      <aside aria-label="Offline Mode" className="bg-amber-600 text-white px-4 py-2.5 text-xs md:text-sm font-medium shadow-md transition-all">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-amber-700/60 rounded-md">
              <svg className="w-4 h-4 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.829-6.364m0 0l2.829 2.829M3 3l18 18" />
              </svg>
            </div>
            <div>
              <span className="font-bold tracking-wide uppercase text-[11px] bg-amber-800/80 px-1.5 py-0.5 rounded mr-2">
                Field Offline Mode
              </span>
              <span>
                Poor or no cellular reception. <strong>Service Worker cache-first active</strong>: You can record collections, complete loan applications, and browse borrowers freely. Data is saved safely to local storage.
              </span>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-100 hover:text-white px-2 py-1 rounded hover:bg-amber-700/50 text-xs shrink-0 transition"
            aria-label="Dismiss offline banner"
          >
            ✕
          </button>
        </div>
      </aside>
    );
  }

  return null;
};

/**
 * Compact pill badge to display in the header
 */
export const NetworkStatusBadge: React.FC = () => {
  const { isOffline, effectiveType } = useOnlineStatus();

  if (isOffline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" title="Offline mode: cache active">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span>Offline Cache</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60" title={`Connected online ${effectiveType ? `(${effectiveType.toUpperCase()})` : ''}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
      <span className="hidden sm:inline">Online</span>
    </span>
  );
};
