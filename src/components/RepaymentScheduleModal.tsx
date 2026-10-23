import React from 'react';
import { X, Calendar, Printer, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Loan, RepaymentInstallment } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface RepaymentScheduleModalProps {
  loan: Loan;
  installments: RepaymentInstallment[];
  onClose: () => void;
}

export const RepaymentScheduleModal: React.FC<RepaymentScheduleModalProps> = ({
  loan,
  installments,
  onClose,
}) => {
  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-emerald-900/20 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between no-print border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Amortized Repayment Schedule</h3>
              <p className="text-xs text-emerald-300">
                Loan {loan.loanCode} - {loan.borrowerName} ({loan.durationUnits} Weekdays)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loan summary strip */}
        <div className="bg-emerald-50/70 p-5 border-b border-emerald-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div>
            <span className="text-slate-500 block">Total Principal</span>
            <span className="text-sm font-bold text-slate-900">{formatNaira(loan.principalAmount)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Contractual Interest (20%)</span>
            <span className="text-sm font-bold text-emerald-800">{formatNaira(loan.contractualInterest)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Scheduled</span>
            <span className="text-sm font-bold text-slate-900">{formatNaira(loan.totalScheduledRepayment)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Daily Installment</span>
            <span className="text-sm font-bold text-emerald-900">{formatNaira(loan.dailyScheduledRepayment)}</span>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Due Date (DD/MM/YYYY)</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3 text-right">Opening Bal.</th>
                  <th className="py-2.5 px-3 text-right">Principal</th>
                  <th className="py-2.5 px-3 text-right">Interest</th>
                  <th className="py-2.5 px-3 text-right">Total Due</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Remaining</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {installments.map(inst => (
                  <tr
                    key={inst.id}
                    className={`hover:bg-slate-50 transition ${
                      inst.status === 'paid' ? 'bg-emerald-50/20' : inst.status === 'overdue' ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-600">{inst.installmentNumber}</td>
                    <td className="py-2.5 px-3 font-mono font-medium">{formatDateNG(inst.dueDate)}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">{getDayName(inst.dueDate)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatNaira(inst.openingBalance)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatNaira(inst.scheduledPrincipal)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800">{formatNaira(inst.scheduledInterest)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatNaira(inst.scheduledTotal)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">{formatNaira(inst.actualPaid)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{formatNaira(inst.remainingDue)}</td>
                    <td className="py-2.5 px-3 text-center">
                      {inst.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : inst.status === 'partially_paid' ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Partial
                        </span>
                      ) : inst.status === 'overdue' ? (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs no-print">
          <span className="text-slate-500">
            * Note: Repayment calendar strictly excludes Saturdays and Sundays (Market collection rule).
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-1.5 px-4 rounded-xl transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Schedule
            </button>
            <button
              onClick={onClose}
              className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-1.5 px-4 rounded-xl border border-slate-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
