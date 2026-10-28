import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : 'android'
  );

  if (!isOpen) return null;

  const appUrl = window.location.origin || 'https://ais-pre-nmgklwoi2p3old6htmtos4-401886123525.europe-west1.run.app';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white p-5 flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="GRP Credit"
              className="w-12 h-12 rounded-xl shadow-md border-2 border-emerald-400/30 object-cover bg-emerald-950"
            />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Install Grateful Relief PWA</h3>
              <p className="text-xs text-emerald-100">
                Full-screen field app with Cache-First offline operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Direct Install CTA if browser supports prompt */}
          {isInstallable && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">
                  Ready for 1-Click Installation
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Add Grateful Relief directly to your device home screen
                </p>
              </div>
              <button
                onClick={handleNativeInstall}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install Now
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
              <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>App is already running in standalone mode on this device!</span>
            </div>
          )}

          {/* App URL Share / Download Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Live App Link (Share with Field Officers)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="w-full text-xs font-mono bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2 text-xs font-semibold rounded-lg shrink-0 transition flex items-center gap-1 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-700'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Field officers can open this link directly in Chrome or Safari on their mobile phones.
            </p>
          </div>

          {/* Platform Installation Guide Tabs */}
          <div>
            <div className="flex border-b border-gray-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('android')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'android'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Android / Chrome
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'ios'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                iPhone / iPad (iOS Safari)
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'desktop'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                PC / Mac / Chrome
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 space-y-2 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
              {activeTab === 'android' && (
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Open the live app link in <strong>Google Chrome</strong> or Samsung Internet.</li>
                  <li>Look for the <strong>"Add Grateful Relief to Home screen"</strong> prompt at the bottom of the screen.</li>
                  <li>Or tap the Chrome menu (<strong>⋮</strong> in the top-right corner) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Confirm installation. The app icon will appear on your phone home screen and app drawer.</li>
                </ol>
              )}

              {activeTab === 'ios' && (
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Open the live app link in <strong>Apple Safari</strong>.</li>
                  <li>Tap the <strong>Share</strong> button at the bottom toolbar (the square icon with an upward arrow).</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong> (+ icon).</li>
                  <li>Tap <strong>"Add"</strong> in the top-right corner.</li>
                  <li>Launch <strong>GRP Credit</strong> from your iOS home screen for full standalone offline access.</li>
                </ol>
              )}

              {activeTab === 'desktop' && (
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>In Chrome or Edge, click the <strong>Install</strong> icon in the address bar (right side next to the bookmark star).</li>
                  <li>Or click Chrome menu (⋮) → <strong>"Save and share"</strong> → <strong>"Install Grateful Relief Loan Manager"</strong>.</li>
                  <li>The app will launch in its own standalone window with keyboard shortcuts and desktop notifications.</li>
                </ol>
              )}
            </div>
          </div>

          {/* Offline Capabilities Highlight */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-300">
            <div className="font-semibold flex items-center gap-1.5 mb-1 text-emerald-800 dark:text-emerald-200">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Field Officer Offline Resilience</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
              Equipped with a <strong>Cache-First Service Worker</strong>: officers working inside crowded market areas (Balogun, Idumota, Alaba, Tejuosho, Arena) can open the app, process new loan applications, record daily repayments, and calculate interest schedules even without cellular data. Everything saves to secure device storage and updates when signal is restored.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
