import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Loan } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface ActiveLoansViewProps {
  onViewSchedule: (loan: Loan) => void;
  onViewAgreement: (loan: Loan) => void;
}

export const ActiveLoansView: React.FC<ActiveLoansViewProps> = ({
  onViewSchedule,
  onViewAgreement,
}) => {
  const [loans] = useState<Loan[]>(dbService.getLoans());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLoans = loans.filter(l => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      l.borrowerName.toLowerCase().includes(q) ||
      l.loanCode.toLowerCase().includes(q) ||
      l.borrowerPhone.includes(q);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Active Facilities & Amortization Schedules</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {loans.length} Loan Contracts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            24-weekday amortization schedules excluding Saturdays & Sundays, tracking principal recovery vs interest.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by loan ID, borrower, phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Running Loans</option>
            <option value="overdue">Overdue / Delinquent</option>
            <option value="fully_paid">Fully Repaid</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">Loan Code</th>
                <th className="py-3 px-4">Borrower Details</th>
                <th className="py-3 px-4 text-right">Principal</th>
                <th className="py-3 px-4 text-right">Interest (20%)</th>
                <th className="py-3 px-4 text-right">Daily Installment</th>
                <th className="py-3 px-4 text-right">Repaid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Progress</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map(loan => {
                const percent = Math.min(100, Math.round((loan.totalPaid / loan.totalScheduledRepayment) * 100));

                return (
                  <tr key={loan.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{loan.loanCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{loan.borrowerName}</div>
                      <div className="text-[10px] text-slate-400">{loan.borrowerBusiness}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatNaira(loan.principalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-800 font-semibold">
                      {formatNaira(loan.contractualInterest)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900">
                      {formatNaira(loan.dailyScheduledRepayment)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatNaira(loan.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {formatNaira(loan.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-16 mx-auto">
                        <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-0.5">
                          <span>{percent}%</span>
                          <span>{loan.installmentsPaidCount}/{loan.installmentsTotal}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent === 100 ? 'bg-emerald-600' : 'bg-emerald-800'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          loan.status === 'fully_paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : loan.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-50 text-emerald-900'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewSchedule(loan)}
                          className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded-lg transition"
                          title="View Repayment Schedule"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewAgreement(loan)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="View Agreement & Voucher"
                        >
                          <ScrollText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
