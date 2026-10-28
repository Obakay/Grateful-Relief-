import React, { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Users,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ArrowDownRight,
  Receipt,
  FileCheck2,
  Calendar,
  Layers,
  Sparkles,
  Rocket,
  ArrowRight,
  Lock,
  Shield,
} from 'lucide-react';
import { dbService } from '../services/db';
import { formatNaira, formatDateNG } from '../services/loanCalculator';
import { Loan, Repayment } from '../types';

interface DashboardViewProps {
  onNavigateToTab: (tab: any) => void;
  onViewReceipt: (repayment: Repayment) => void;
  onOpenProductionSetup?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
  onViewReceipt,
  onOpenProductionSetup,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const metrics = dbService.getDashboardMetrics();
  const allLoans = dbService.getLoans();
  const allRepayments = dbService.getRepayments().filter(r => !r.isReversed);
  const systemMode = dbService.getSystemMode();
  const activeBranches = dbService.getActiveBranches();
  const currentUser = dbService.getCurrentUser();
  const isAdmin = currentUser.role === 'administrator';

  const filteredLoans = selectedBranch === 'all'
    ? allLoans
    : allLoans.filter(l => l.branch.includes(selectedBranch));

  const branches = [
    { id: 'all', name: 'All Branches (Company-Wide)' },
    ...activeBranches.map(b => ({ id: b.name, name: b.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Mode Callout Banner */}
      {systemMode === 'demo' && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-300 dark:border-amber-700/60 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Demonstration Mode Active
                </span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                  Sample Data Loaded
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                Ready to input real customers and staff? Launch <strong>Live Production Mode</strong> to establish a pristine ₦0.00 ledger with your Super Admin credentials.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenProductionSetup}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Live Production Mode</span>
            </button>
          </div>
        </div>
      )}

      {systemMode === 'production' && allLoans.length === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                  🟢 Live Production Mode Active
                </span>
                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                  ₦0.00 Clean Ledger
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                Your loan ledger is clean and ready. Follow these initial steps to start operations:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => onNavigateToTab('staff')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1"
                >
                  <span>1. Register Real Staff</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateToTab('borrowers')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold hover:bg-emerald-50 transition flex items-center gap-1"
                >
                  <span>2. Add Real Borrowers / KYC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onOpenProductionSetup}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1"
                >
                  <span>Backup Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Executive Financial Overview</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Live Audited Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grateful Relief Program Limited • Microfinance Portfolio Health & Daily Amortization Tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-semibold shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Realized & Other Income Confidential (Admin Only)</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Disbursed Principal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Disbursed Principal</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatNaira(metrics.totalDisbursed)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span>{allLoans.length} total loans issued</span>
            </div>
          </div>
        </div>

        {/* Card 2: Recovered Principal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Principal Recovered</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-950 tracking-tight">
              {formatNaira(metrics.totalPrincipalRecovered)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span>Outstanding: {formatNaira(metrics.totalOutstandingPrincipal)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Realized Interest & Other Income (Admin Only) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isAdmin ? 'Realized Interest & Other Income' : 'Company Income (Realized)'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-800'}`}>
              {isAdmin ? <TrendingUp className="w-4 h-4 text-emerald-800" /> : <Lock className="w-4 h-4 text-amber-700" />}
            </div>
          </div>
          <div className="mt-3">
            {isAdmin ? (
              <>
                <div className="text-2xl font-black text-emerald-900 tracking-tight">
                  {formatNaira(metrics.totalCompanyRealizedRevenue)}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1 flex flex-col sm:flex-row sm:items-center gap-1">
                  <span>Interest: {formatNaira(metrics.totalInterestCollected)}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Other Income: {formatNaira(metrics.totalOtherIncome)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-mono font-black text-slate-400 tracking-wider">
                    ₦ ••••••••
                  </div>
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" /> Admin Only
                  </span>
                </div>
                <div className="text-[11px] text-amber-700 font-medium mt-1">
                  <span>Confidential • Restricted to Administrators</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Net Realized Lending Income / Profit (Admin Only) */}
        <div className={`text-white p-5 rounded-2xl shadow-md border ${isAdmin ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 border-emerald-800' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              {isAdmin ? 'Net Realized Company Profit' : 'Net Realized Income'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-emerald-800 text-emerald-300' : 'bg-slate-700 text-amber-300'}`}>
              {isAdmin ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            {isAdmin ? (
              <>
                <div className="text-2xl font-black text-white tracking-tight">
                  {formatNaira(metrics.netRealizedLendingIncome)}
                </div>
                <div className="text-[11px] text-emerald-300 mt-1">
                  <span>Revenue ({formatNaira(metrics.totalCompanyRealizedRevenue)}) - Expenses ({formatNaira(metrics.totalExpenses)})</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-mono font-black text-slate-400 tracking-wider">
                    ₦ ••••••••
                  </div>
                  <span className="inline-flex items-center gap-1 bg-amber-900/60 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-700/50">
                    <Lock className="w-3 h-3" /> Admin Only
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  <span>Operating earnings statement restricted to Administrators</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Collected Today</span>
          <span className="text-base font-bold text-emerald-900">{formatNaira(metrics.totalCollectedToday)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Collected This Week</span>
          <span className="text-base font-bold text-emerald-900">{formatNaira(metrics.totalCollectedThisWeek)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50" onClick={() => onNavigateToTab('applications')}>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Awaiting Approval</span>
          <span className="text-base font-bold text-amber-700">{metrics.loansAwaitingApproval} apps</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50" onClick={() => onNavigateToTab('disbursements')}>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Awaiting Disbursement</span>
          <span className="text-base font-bold text-emerald-700">{metrics.loansAwaitingDisbursement} loans</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50" onClick={() => onNavigateToTab('overdue')}>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Overdue Loans</span>
          <span className="text-base font-bold text-rose-700">{metrics.overdueLoans} delinquent</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Portfolio at Risk (PAR 30)</span>
          <span className="text-base font-bold text-slate-900">{metrics.par30Ratio}%</span>
        </div>
      </div>

      {/* Main Grid: Collections Visualizer & Officer Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Collections Performance Visualizer */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">24-Day Loan Lifecycle & Amortization Progress</h2>
              <p className="text-xs text-slate-500">Benchmark: ₦20,000 principal + 20% interest (₦4,000) = ₦24,000 repaid at ₦1,000/day</p>
            </div>
            <button
              onClick={() => onNavigateToTab('collections')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              Collect Now <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SVG Visual Amortization Bar Chart */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Installment Day 1 to Day 24 (Weekdays Only)</span>
              <span className="text-emerald-800">16 of 24 Collected (66.7%)</span>
            </div>

            <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 pt-2">
              {Array.from({ length: 24 }).map((_, i) => {
                const dayNum = i + 1;
                const isPaid = dayNum <= 16;
                const isCurrent = dayNum === 17;
                return (
                  <div
                    key={dayNum}
                    className={`h-10 rounded flex flex-col items-center justify-center text-[9px] font-bold font-mono transition ${
                      isPaid
                        ? 'bg-emerald-800 text-white'
                        : isCurrent
                        ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                    title={`Day ${dayNum}: ${isPaid ? '₦1,000 Paid' : isCurrent ? 'Today Due: ₦1,000' : 'Scheduled'}`}
                  >
                    <span>D{dayNum}</span>
                    <span className="text-[7px] opacity-80">{isPaid ? '✓' : ''}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-600 mt-4 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-800 rounded" />
                <span>Recovered Principal & Interest</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-400 rounded" />
                <span>Current Scheduled Installment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-200 rounded" />
                <span>Remaining Tenor</span>
              </div>
            </div>
          </div>

          {/* Recent Collections Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-xs">Recent Field Collections</h3>
              <span className="text-[11px] text-slate-500">Auto-reconciled with tamper-evident receipt tokens</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
                  <tr>
                    <th className="py-2 px-3">Receipt #</th>
                    <th className="py-2 px-3">Borrower</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-center">Mode</th>
                    <th className="py-2 px-3">Collector</th>
                    <th className="py-2 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allRepayments.slice(0, 5).map(rep => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{rep.receiptNumber}</td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900">{rep.borrowerName}</div>
                        <div className="text-[10px] text-slate-400">{rep.loanCode}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatNaira(rep.amount)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {rep.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{rep.collectedByName}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => onViewReceipt(rep)}
                          className="p-1 hover:bg-emerald-100 text-emerald-800 rounded transition"
                          title="View Official Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Branch & Field Officer Performance */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-sm">Field Collection Officers</h2>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
                      CA
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">Chioma Adeleke</h3>
                      <p className="text-[10px] text-slate-500">Balogun & Idumota Route</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800">{formatNaira(16000)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Target: ₦24,000</span>
                  <span className="font-semibold text-emerald-700">66.7% Completion</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-emerald-700 h-full rounded-full" style={{ width: '66.7%' }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs">
                      FO
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">Femi Oladipo</h3>
                      <p className="text-[10px] text-slate-500">Tejuosho Market Route</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800">{formatNaira(8000)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Target: ₦24,000</span>
                  <span className="font-semibold text-amber-700">33.3% Completion</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '33.3%' }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => onNavigateToTab('reconciliation')}
                className="w-full text-center text-xs font-bold text-emerald-900 hover:text-emerald-950 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition"
              >
                Perform Daily Reconciliation →
              </button>
            </div>
          </div>

          {/* Quick Regulatory & Anti-Pill Governance Notice */}
          <div className="bg-emerald-950 text-emerald-100 p-5 rounded-2xl border border-emerald-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <FileCheck2 className="w-4 h-4" />
              <span>Prudential Standard Compliance</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              Accounting integrity strictly separates <strong>Recovered Principal</strong> from <strong>Realized Lending Revenue</strong>. Uncollected future interest is not recognized as income until paid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
