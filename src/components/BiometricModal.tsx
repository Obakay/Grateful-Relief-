import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  ScanFace,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';
import { biometricService, EnrolledBiometricCredential } from '../services/biometrics';
import { UserProfile } from '../types';

interface BiometricModalProps {
  isOpen: boolean;
  mode: 'authenticate' | 'enroll';
  targetUser?: UserProfile | null;
  onSuccess: (user?: UserProfile) => void;
  onClose: () => void;
  staffList: UserProfile[];
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  mode,
  targetUser,
  onSuccess,
  onClose,
  staffList,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<UserProfile>(
    targetUser || staffList[0]
  );
  const [scanStatus, setScanStatus] = useState<
    'idle' | 'scanning' | 'verifying' | 'success' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [enrolledCreds, setEnrolledCreds] = useState<EnrolledBiometricCredential[]>(
    biometricService.getEnrolledCredentials()
  );
  const deviceName = biometricService.detectDeviceName();

  useEffect(() => {
    if (isOpen) {
      setEnrolledCreds(biometricService.getEnrolledCredentials());
      if (mode === 'authenticate') {
        const enrolled = biometricService.getEnrolledCredentials();
        if (targetUser) {
          setSelectedStaff(targetUser);
        } else if (enrolled.length > 0) {
          const match = staffList.find(s => s.id === enrolled[0].userId);
          if (match) setSelectedStaff(match);
        }
        // Auto trigger scanning prompt on open
        startScan();
      } else {
        if (targetUser) setSelectedStaff(targetUser);
        setScanStatus('idle');
        setStatusMessage('Ready to register biometric credential on this device.');
      }
    }
  }, [isOpen, mode, targetUser]);

  if (!isOpen) return null;

  const startScan = async () => {
    setScanStatus('scanning');
    setStatusMessage('Place finger on biometric scanner or align Face ID...');

    // Simulate scanning delay with high fidelity
    setTimeout(async () => {
      setScanStatus('verifying');
      setStatusMessage('Verifying cryptographic key via Credential Management API...');

      setTimeout(async () => {
        try {
          if (mode === 'enroll') {
            const res = await biometricService.enrollBiometricCredential(selectedStaff);
            setScanStatus('success');
            setStatusMessage(`Enrolled successfully! Linked to ${selectedStaff.fullName}.`);
            setTimeout(() => {
              onSuccess(selectedStaff);
            }, 1200);
          } else {
            const res = await biometricService.authenticate(selectedStaff.id);
            if (res.success) {
              setScanStatus('success');
              setStatusMessage(`Biometric match verified. Welcome, ${selectedStaff.fullName}!`);
              setTimeout(() => {
                onSuccess(selectedStaff);
              }, 1000);
            } else {
              setScanStatus('error');
              setStatusMessage(res.error || 'Biometric authentication failed.');
            }
          }
        } catch (err: any) {
          setScanStatus('error');
          setStatusMessage(err?.message || 'Biometric sensor error. Please use corporate password.');
        }
      }, 900);
    }, 1100);
  };

  const isEnrolled = biometricService.isUserEnrolled(selectedStaff.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151e32] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-5 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>WebAuthn Credential Security</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {mode === 'enroll' ? 'Register Biometric Access' : 'Biometric Staff Sign-In'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>{deviceName}</span>
          </p>
        </div>

        {/* Selected Staff Badge */}
        <div className="bg-slate-50 dark:bg-[#1a2438] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-left flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
            {selectedStaff.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {selectedStaff.fullName}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
              {selectedStaff.email}
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold capitalize">
              {selectedStaff.role.replace('_', ' ')} • {selectedStaff.branch}
            </div>
          </div>
        </div>

        {/* Interactive Biometric Sensor Scanner Animation */}
        <div className="py-4 flex flex-col items-center justify-center relative">
          <div
            onClick={() => {
              if (scanStatus === 'idle' || scanStatus === 'error') {
                startScan();
              }
            }}
            className={`w-28 h-28 rounded-full flex items-center justify-center relative cursor-pointer transition-all duration-300 ${
              scanStatus === 'scanning'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 ring-8 ring-emerald-400/30 ring-offset-4 ring-offset-white dark:ring-offset-[#151e32] scale-105'
                : scanStatus === 'verifying'
                ? 'bg-blue-50 dark:bg-blue-950/50 ring-8 ring-blue-400/30 ring-offset-4 ring-offset-white dark:ring-offset-[#151e32] animate-pulse'
                : scanStatus === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-900/60 ring-8 ring-emerald-500/40 text-emerald-600 scale-105'
                : scanStatus === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/50 ring-8 ring-rose-400/30 text-rose-600'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700'
            }`}
          >
            {/* Animated Laser Grid / Radar Wave when scanning */}
            {scanStatus === 'scanning' && (
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div className="w-full h-1 bg-emerald-500/80 shadow-[0_0_12px_#10b981] animate-bounce" />
              </div>
            )}

            {scanStatus === 'success' ? (
              <CheckCircle2 className="w-14 h-14 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-300" />
            ) : scanStatus === 'error' ? (
              <AlertCircle className="w-14 h-14 text-rose-600 dark:text-rose-400 animate-in zoom-in-75 duration-300" />
            ) : (
              <Fingerprint
                className={`w-14 h-14 transition-colors ${
                  scanStatus === 'scanning'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : scanStatus === 'verifying'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              />
            )}
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200 min-h-[32px] flex items-center justify-center px-4">
            {statusMessage}
          </p>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {scanStatus === 'idle' && (
            <button
              type="button"
              onClick={startScan}
              className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{mode === 'enroll' ? 'Capture Fingerprint / Face ID' : 'Scan to Sign In'}</span>
            </button>
          )}

          {scanStatus === 'error' && (
            <button
              type="button"
              onClick={startScan}
              className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Retry Biometric Scan</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
          >
            Cancel & Return to Standard Login
          </button>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          Complies with FIDO2 / WebAuthn & Nigerian NDPR standards
        </div>
      </div>
    </div>
  );
};
