import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  KeyRound,
  User,
  Sun,
  Moon,
  Fingerprint,
  ScanFace,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { dbService } from '../services/db';
import { supabase } from '../Lib/SupabaseClient';
import { UserProfile, UserRole } from '../types';
import { ThemeMode } from '../services/theme';
import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleBadges: Record<UserRole, { label: string; badge: string }> = {
    administrator: {
      label: 'Administrator',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    loan_officer: {
      label: 'Loan Officer',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    branch_manager: {
      label: 'Branch Manager',
      badge: 'bg-purple-100 text-purple-900 border-purple-300',
    },
    supervisor: {
      label: 'Supervisor',
      badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    },
    accountant: {
      label: 'Accountant',
      badge: 'bg-teal-100 text-teal-900 border-teal-300',
    },
    auditor: {
      label: 'Auditor',
      badge: 'bg-blue-100 text-blue-900 border-blue-300',
    },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error || !data.user) {
        throw new Error('Unable to sign in. Check your email and password.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, phone, branch, approval_limit, is_active, created_at')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error('Your staff profile was not found. Contact your administrator.');
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('This staff account is inactive. Contact your administrator.');
      }

      if (!['administrator', 'loan_officer', 'auditor'].includes(profile.role)) {
        await supabase.auth.signOut();
        throw new Error('This account has an unsupported role. Contact your administrator.');
      }

      const authenticatedUser: UserProfile = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role as UserRole,
        phone: profile.phone || '',
        branch: profile.branch || '',
        approvalLimit: Number(profile.approval_limit || 0),
        isActive: profile.is_active,
        createdAt: profile.created_at,
      };

      const loggedIn = dbService.setAuthenticatedUser(authenticatedUser);

      dbService.logAudit(
        'LOGIN',
        'UserProfile',
        loggedIn.id,
        `Staff member ${loggedIn.fullName} signed in through Supabase Auth.`
      );

      onLoginSuccess(loggedIn);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 flex flex-col items-center justify-center p-4 selection:bg-emerald-200 selection:text-emerald-950 relative">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />

      {/* Top Floating Controls: Offline banner & Action buttons */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <OfflineIndicator />
        <div className="flex items-center justify-end gap-2 p-4">
          <PWAInstallButton />
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle Dark/Light Mode"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 text-xs font-medium transition cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Dark</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block p-1 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 mb-1">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-white p-1 flex items-center justify-center shadow-inner">
              <img
                src="/assets/aistudio/logo_ff978855.jpg"
                alt="Grateful Relief Program Limited"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Grateful Relief
            </h1>
            <p className="text-xs text-emerald-300 font-semibold tracking-wide">
              Grateful Relief Program Limited • Loan Manager
            </p>
            <p className="text-[11px] text-emerald-200/70 font-mono mt-0.5">
              RC: 1894220 | Microfinance Enterprise • Lagos, NG (₦)
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-[#151e32] rounded-3xl shadow-2xl p-6 sm:p-7 border border-white/40 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Authorized Staff Sign In</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Access the loan management & field ledger</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gratefulrelief.ng"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 border-slate-300 focus:ring-emerald-500"
                />
                <span>Remember this workstation</span>
              </label>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold cursor-pointer hover:underline">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-xs tracking-wide cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Security & Regulatory footer */}
        <div className="text-center text-xs text-emerald-200/70 space-y-1">
          <div className="flex items-center justify-center gap-2 text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold text-[11px]">Maker-Checker, WebAuthn & PostgreSQL RLS Protection</span>
          </div>
          <p className="text-[10px]">
            © 2026 Grateful Relief Program Limited • All transactions logged to immutable audit trail
          </p>
        </div>
      </div>

    </div>
  );
};
