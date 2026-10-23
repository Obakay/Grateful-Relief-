import React from 'react';
import {
  LayoutDashboard,
  WalletCards,
  Users,
  FileSpreadsheet,
  SendHorizontal,
  ScrollText,
  AlertTriangle,
  Receipt,
  Scale,
  LineChart,
  PieChart,
  History,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../types';

export type TabType =
  | 'dashboard'
  | 'collections'
  | 'borrowers'
  | 'applications'
  | 'disbursements'
  | 'loans'
  | 'overdue'
  | 'expenses'
  | 'reconciliation'
  | 'reports'
  | 'investors'
  | 'staff'
  | 'audit';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole: UserRole;
  pendingApprovalsCount: number;
  pendingDisbursementsCount: number;
  overdueLoansCount: number;
  pendingExpensesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  pendingApprovalsCount,
  pendingDisbursementsCount,
  overdueLoansCount,
  pendingExpensesCount,
}) => {
  const navItems: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    roles?: UserRole[];
  }[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'collections',
      label: 'Daily Field Collections',
      icon: WalletCards,
      badge: 0,
    },
    {
      id: 'borrowers',
      label: 'Borrowers & KYC',
      icon: Users,
    },
    {
      id: 'applications',
      label: 'Loan Applications',
      icon: FileSpreadsheet,
      badge: pendingApprovalsCount,
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'disbursements',
      label: 'Disbursements & Vouchers',
      icon: SendHorizontal,
      badge: pendingDisbursementsCount,
      badgeColor: 'bg-emerald-100 text-emerald-900',
    },
    {
      id: 'loans',
      label: 'Active Loans & Schedules',
      icon: ScrollText,
    },
    {
      id: 'overdue',
      label: 'Overdue & PAR Delinquency',
      icon: AlertTriangle,
      badge: overdueLoansCount,
      badgeColor: 'bg-rose-100 text-rose-900',
    },
    {
      id: 'expenses',
      label: 'Expense Manager',
      icon: Receipt,
      badge: pendingExpensesCount,
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'reconciliation',
      label: 'Daily Cash Reconciliation',
      icon: Scale,
    },
    {
      id: 'reports',
      label: 'Accounting & P&L Reports',
      icon: LineChart,
    },
    {
      id: 'investors',
      label: 'Investor Capital',
      icon: PieChart,
      roles: ['administrator', 'auditor'],
    },
    {
      id: 'staff',
      label: 'Staff & Permissions',
      icon: UserCheck,
      roles: ['administrator'],
    },
    {
      id: 'audit',
      label: 'Audit Trail Logs',
      icon: History,
      roles: ['administrator', 'auditor'],
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 no-print">
      <div className="p-4 border-b border-slate-100 hidden md:block">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white p-0.5 border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/logo_ff978855.jpg"
              alt="Grateful Relief Program"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <span className="font-extrabold text-xs text-emerald-950 uppercase block leading-tight">
              Grateful Relief
            </span>
            <span className="text-[10px] text-slate-400 font-mono">RC: 1894220</span>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </span>
      </div>

      <nav className="p-2 space-y-1 overflow-x-auto md:overflow-x-visible flex md:flex-col shrink-0">
        {navItems
          .filter(item => !item.roles || item.roles.includes(userRole))
          .map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap md:whitespace-normal ${
                  isActive
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-emerald-950' : item.badgeColor || 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Role Notice at bottom */}
      <div className="mt-auto p-4 hidden md:block border-t border-slate-100">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-900">
            <span className="font-bold block capitalize">{userRole.replace('_', ' ')} Role</span>
            <p className="text-[10px] text-emerald-700 mt-0.5 leading-snug">
              {userRole === 'loan_officer'
                ? 'Authorized for assigned borrower KYC, loan submissions & daily collections.'
                : userRole === 'administrator'
                ? 'Full governance: Maker-Checker approvals, disbursements, & reconciliation.'
                : 'Read-only financial audit, reconciliation logs, and risk tracking.'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
