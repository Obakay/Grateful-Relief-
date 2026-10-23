import React, { useState } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  Store,
  Calendar,
  Clock,
  PlusCircle,
  FileCheck2,
  X,
  CheckCircle,
  User,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Loan, CollectionFollowUp } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface OverdueLoansViewProps {
  onCollectPayment: (loan: Loan) => void;
}

export const OverdueLoansView: React.FC<OverdueLoansViewProps> = ({ onCollectPayment }) => {
  const loans = dbService.getLoans().filter(l => l.status === 'overdue' || l.daysOverdue > 0);
  const followUps = dbService.getFollowUps();
  const currentUser = dbService.getCurrentUser();

  const [activeBucket, setActiveBucket] = useState<'all' | '1-7' | '8-14' | '15-30' | '30+'>('all');
  const [selectedLoanForFollowUp, setSelectedLoanForFollowUp] = useState<Loan | null>(null);

  // Follow-up form
  const [followUpType, setFollowUpType] = useState<CollectionFollowUp['followUpType']>('Market Stall Visit');
  const [outcome, setOutcome] = useState<CollectionFollowUp['outcome']>('Promise to Pay');
  const [promiseDate, setPromiseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [promisedAmount, setPromisedAmount] = useState<number>(4000);
  const [notes, setNotes] = useState<string>('');

  const bucket1To7 = loans.filter(l => l.daysOverdue >= 1 && l.daysOverdue <= 7);
  const bucket8To14 = loans.filter(l => l.daysOverdue >= 8 && l.daysOverdue <= 14);
  const bucket15To30 = loans.filter(l => l.daysOverdue >= 15 && l.daysOverdue <= 30);
  const bucket30Plus = loans.filter(l => l.daysOverdue > 30);

  const displayedLoans = activeBucket === 'all'
    ? loans
    : activeBucket === '1-7'
    ? bucket1To7
    : activeBucket === '8-14'
    ? bucket8To14
    : activeBucket === '15-30'
    ? bucket15To30
    : bucket30Plus;

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForFollowUp) return;

    dbService.addFollowUp({
      loanId: selectedLoanForFollowUp.id,
      borrowerId: selectedLoanForFollowUp.borrowerId,
      borrowerName: selectedLoanForFollowUp.borrowerName,
      officerId: currentUser.id,
      officerName: currentUser.fullName,
      followUpDate: new Date().toISOString().split('T')[0],
      followUpType,
      outcome,
      promiseToPayDate: promiseDate,
      promisedAmount,
      notes,
    });

    setSelectedLoanForFollowUp(null);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Overdue Management & PAR Delinquency</h1>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {loans.length} Delinquent Loans
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track missed daily collections, aging delinquency buckets, field stall visits, and promise-to-pay pledges.
          </p>
        </div>
      </div>

      {/* Aging Buckets Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveBucket('all')}
          className={`p-3 rounded-xl border text-left transition ${
            activeBucket === 'all'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">All Overdue</span>
          <span className="text-lg font-bold">{loans.length} Loans</span>
        </button>

        <button
          onClick={() => setActiveBucket('1-7')}
          className={`p-3 rounded-xl border text-left transition ${
            activeBucket === '1-7'
              ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">1–7 Days (Early)</span>
          <span className="text-lg font-bold">{bucket1To7.length}</span>
        </button>

        <button
          onClick={() => setActiveBucket('8-14')}
          className={`p-3 rounded-xl border text-left transition ${
            activeBucket === '8-14'
              ? 'bg-orange-800 text-white border-orange-800 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">8–14 Days (Stall Visit)</span>
          <span className="text-lg font-bold">{bucket8To14.length}</span>
        </button>

        <button
          onClick={() => setActiveBucket('15-30')}
          className={`p-3 rounded-xl border text-left transition ${
            activeBucket === '15-30'
              ? 'bg-rose-800 text-white border-rose-800 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">15–30 Days (Guarantor)</span>
          <span className="text-lg font-bold">{bucket15To30.length}</span>
        </button>

        <button
          onClick={() => setActiveBucket('30+')}
          className={`p-3 rounded-xl border text-left transition ${
            activeBucket === '30+'
              ? 'bg-rose-950 text-white border-rose-950 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">&gt; 30 Days (PAR 30)</span>
          <span className="text-lg font-bold">{bucket30Plus.length}</span>
        </button>
      </div>

      {/* Overdue Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Delinquent Accounts Requiring Recovery Action
          </h2>
          <span className="text-[11px] text-slate-500">
            Total Overdue Sum: {formatNaira(displayedLoans.reduce((sum, l) => sum + l.overdueAmount, 0))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">Borrower & Phone</th>
                <th className="py-3 px-4">Business / Stall</th>
                <th className="py-3 px-4">Loan Code</th>
                <th className="py-3 px-4 text-right">Overdue Amount</th>
                <th className="py-3 px-4 text-right">Outstanding Bal.</th>
                <th className="py-3 px-4 text-center">Days Overdue</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4 text-center">Follow-Up Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No delinquent loans in this aging bucket.
                  </td>
                </tr>
              ) : (
                displayedLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{loan.borrowerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{loan.borrowerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{loan.borrowerBusiness}</div>
                      <div className="text-[10px] text-slate-400">{loan.branch}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{loan.loanCode}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatNaira(loan.overdueAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {formatNaira(loan.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block bg-rose-100 text-rose-900 font-bold px-2.5 py-0.5 rounded-full text-xs">
                        {loan.daysOverdue} Days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{loan.assignedOfficerName}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedLoanForFollowUp(loan)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                          title="Log stall visit or phone call"
                        >
                          Log Visit
                        </button>
                        <button
                          onClick={() => onCollectPayment(loan)}
                          className="bg-emerald-800 hover:bg-emerald-900 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition"
                        >
                          Collect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Notes & Promises to Pay */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-800" />
          <span>Recent Field Recovery Attempts & Promises to Pay</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followUps.map(f => (
            <div key={f.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-slate-900">{f.borrowerName}</span>
                  <p className="text-[11px] text-slate-500">
                    Logged by {f.officerName} on {formatDateNG(f.followUpDate)}
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold text-[10px]">
                  {f.outcome}
                </span>
              </div>
              <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                "{f.notes}"
              </p>
              {f.promiseToPayDate && (
                <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                  <span>Pledged Settlement Date: <strong>{formatDateNG(f.promiseToPayDate)}</strong></span>
                  <span>Amount: <strong>{formatNaira(f.promisedAmount)}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Log Follow Up Modal */}
      {selectedLoanForFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-900/20 my-8">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Record Recovery Follow-Up</h3>
              <button
                onClick={() => setSelectedLoanForFollowUp(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4 text-xs font-sans">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{selectedLoanForFollowUp.borrowerName}</div>
                <div className="text-slate-500 font-mono text-[10px]">{selectedLoanForFollowUp.loanCode}</div>
                <div className="text-rose-700 font-bold mt-1">
                  Overdue Amount: {formatNaira(selectedLoanForFollowUp.overdueAmount)} ({selectedLoanForFollowUp.daysOverdue} days overdue)
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Follow-Up Action Method</label>
                <select
                  value={followUpType}
                  onChange={e => setFollowUpType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                >
                  <option value="Market Stall Visit">Market Stall Visit</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Guarantor Contact">Guarantor Contact</option>
                  <option value="Formal Letter">Formal Warning Letter</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Outcome</label>
                <select
                  value={outcome}
                  onChange={e => setOutcome(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                >
                  <option value="Promise to Pay">Promise to Pay</option>
                  <option value="Partial Paid">Partial Paid</option>
                  <option value="Stall Closed">Stall Closed / Locked</option>
                  <option value="Unreachable">Unreachable</option>
                  <option value="Refused">Refused</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Promise Settlement Date</label>
                  <input
                    type="date"
                    value={promiseDate}
                    onChange={e => setPromiseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Promised Amount (₦)</label>
                  <input
                    type="number"
                    value={promisedAmount}
                    onChange={e => setPromisedAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Field Observations & Trader Explanation</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Trader attended goods delivery in Alaba market; pledged full clearance Monday morning."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForFollowUp(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
