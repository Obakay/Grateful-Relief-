import React, { useState } from 'react';
import {
  Shield,
  Bell,
  RefreshCw,
  Database,
  Building2,
  CheckCircle2,
  User,
  AlertCircle,
  FileCheck2,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { UserProfile, SystemNotification } from '../types';
import { dbService } from '../services/db';
import { ThemeMode } from '../services/theme';

interface HeaderProps {
  currentUser: UserProfile;
  users: UserProfile[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSwitchUser: (userId: string) => void;
  onOpenTests: () => void;
  onOpenDocs: () => void;
  onResetData: () => void;
  onSignOut: () => void;
  notifications: SystemNotification[];
  onNotificationClick: (notif: SystemNotification) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  theme,
  onToggleTheme,
  onSwitchUser,
  onOpenTests,
  onOpenDocs,
  onResetData,
  onSignOut,
  notifications,
  onNotificationClick,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'loan_officer':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'branch_manager':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'supervisor':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'accountant':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'auditor':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-40 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Company Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white overflow-hidden p-0.5 shadow-md border border-emerald-300/40 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/logo_ff978855.jpg"
                alt="Grateful Relief Program Limited Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white uppercase">
                  Grateful Relief
                </span>
                <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded font-mono font-medium border border-emerald-700">
                  Lagos, NG (₦)
                </span>
              </div>
              <p className="text-[11px] text-emerald-300 hidden sm:block">
                Grateful Relief Program Limited • Loan Manager
              </p>
            </div>
          </div>

          {/* Action buttons & User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Run Tests Button */}
            <button
              onClick={onOpenTests}
              className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold py-1.5 px-3 rounded-lg border border-emerald-700/60 shadow-xs transition"
              title="Run 22 Automated System Verification Tests"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">22 Integrity Tests</span>
            </button>

            {/* SQL & Architecture Docs */}
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-medium py-1.5 px-2.5 rounded-lg border border-emerald-800 transition"
              title="Supabase PostgreSQL Schema & Security SOP"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">SQL SOP</span>
            </button>

            {/* Global Dark Mode / Light Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-emerald-700/60 shadow-xs transition"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme (Reduce Eye Strain)'}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-emerald-200 hover:text-white hover:bg-emerald-900 rounded-lg transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Notifications ({unreadNotifs.length} new)</span>
                    <span className="text-[10px] text-slate-500">Live system alerts</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-400 text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 6).map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onNotificationClick(n);
                            setShowNotifMenu(false);
                          }}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition ${
                            !n.read ? 'bg-emerald-50/40 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                            <span className="font-semibold text-slate-800">{n.title}</span>
                            {!n.read && <span className="w-2 h-2 bg-emerald-600 rounded-full" />}
                          </div>
                          <p className="text-slate-600 text-[11px] line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-850 border border-emerald-700/80 px-2.5 py-1.5 rounded-xl transition text-left"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold leading-tight text-white">{currentUser.fullName}</div>
                  <div className="text-[10px] text-emerald-300 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
              </button>

              {/* User Switch Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Switch Role for Testing & Maker-Checker
                    </p>
                  </div>
                  <div className="p-1 space-y-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                          u.id === currentUser.id
                            ? 'bg-emerald-50 text-emerald-950 font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500">{u.branch}</div>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 p-2 mt-1 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-slate-700 hover:bg-slate-100 font-semibold transition"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
                      Sign Out to Login Page
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Reset application state to initial demonstration fixtures?')) {
                          onResetData();
                          setShowUserMenu(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-rose-700 hover:bg-rose-50 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset to Official Demo Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
