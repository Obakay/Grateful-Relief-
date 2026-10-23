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
} from 'lucide-react';
import { dbService } from '../services/db';
import { formatNaira, formatDateNG } from '../services/loanCalculator';
import { Loan, Repayment } from '../types';

interface DashboardViewProps {
  onNavigateToTab: (tab: any) => void;
  onViewReceipt: (repayment: Repayment) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTab, onViewReceipt }) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const metrics = dbService.getDashboardMetrics();
  const allLoans = dbService.getLoans();
  const allRepayments = dbService.getRepayments().filter(r => !r.isReversed);

  const filteredLoans = selectedBranch === 'all'
    ? allLoans
    : allLoans.filter(l => l.branch.includes(selectedBranch));

  const branches = [
    { id: 'all', name: 'All Branches (Company-Wide)' },
    { id: 'Balogun', name: 'Lagos Island (Balogun Market Branch)' },
    { id: 'Tejuosho', name: 'Yaba (Tejuosho Market Branch)' },
    { id: 'Arena', name: 'Oshodi (Arena Market Branch)' },
  ];

  return (
    <div className="space-y-6">
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

        <div className="flex items-center gap-3">
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

        {/* Card 3: Realized Interest Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Realized Interest Income</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-800" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-900 tracking-tight">
              {formatNaira(metrics.totalInterestCollected)}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              <span>Contractual: {formatNaira(metrics.totalContractualInterest)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Realized Lending Income */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-2xl shadow-md border border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Net Realized Lending Income</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {formatNaira(metrics.netRealizedLendingIncome)}
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">
              <span>Interest ({formatNaira(metrics.totalInterestCollected)}) - Expenses ({formatNaira(metrics.totalExpenses)})</span>
            </div>
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
