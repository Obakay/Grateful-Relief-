import React, { useState } from 'react';
import {
  Scale,
  CheckCircle,
  AlertTriangle,
  Clock,
  PlusCircle,
  Building,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { dbService } from '../services/db';
import { ReconciliationSession, UserProfile } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

export const ReconciliationView: React.FC = () => {
  const currentUser = dbService.getCurrentUser();
  const users = dbService.getUsers().filter(u => u.role === 'loan_officer');
  const [sessions, setSessions] = useState<ReconciliationSession[]>(dbService.getReconciliationSessions());
  const [showNewModal, setShowNewModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New reconciliation form
  const [officerId, setOfficerId] = useState(users[0]?.id || '');
  const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashSubmitted, setCashSubmitted] = useState<number>(0);
  const [bankConfirmed, setBankConfirmed] = useState<number>(0);
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate expected collection for this officer on the selected date
  const expectedForDate = dbService
    .getRepayments()
    .filter(r => r.collectedBy === officerId && r.collectionDate === reconciliationDate && !r.isReversed)
    .reduce((sum, r) => sum + r.amount, 0);

  const variance = cashSubmitted + bankConfirmed - expectedForDate;

  const handleStartSession = () => {
    setShowNewModal(true);
    setCashSubmitted(expectedForDate); // Pre-fill with expected for officer convenience
    setBankConfirmed(0);
    setDiscrepancyReason('');
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (variance !== 0 && !discrepancyReason.trim()) {
      setErrorMsg('A discrepancy variance exists! You must document an official explanation before sign-off.');
      return;
    }

    try {
      dbService.createReconciliation({
        officerId,
        reconciliationDate,
        actualCashSubmitted: cashSubmitted,
        actualBankTransferConfirmed: bankConfirmed,
        discrepancyReason: discrepancyReason || undefined,
        notes,
      });

      setSessions(dbService.getReconciliationSessions());
      setShowNewModal(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Reconciliation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Cash Vault & Field Bag Daily Reconciliation</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              End-of-Day Audit Protocol
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile daily officer collections with physical branch cash handed over and bank deposits.
          </p>
        </div>

        <button
          onClick={handleStartSession}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-xs"
        >
          <Scale className="w-4 h-4" />
          <span>New Daily Reconciliation Session</span>
        </button>
      </div>

      {/* Reconciliation Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Completed Field Handover Sessions
          </h2>
          <span className="text-[11px] text-slate-500">{sessions.length} Sessions Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">Session Code</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Field Officer</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4 text-right">Expected Collections</th>
                <th className="py-3 px-4 text-right">Cash Handed Over</th>
                <th className="py-3 px-4 text-right">Bank Transfers</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Sign-off By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map(s => {
                const hasVariance = s.variance !== 0;

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.sessionCode}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDateNG(s.reconciliationDate)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.officerName}</td>
                    <td className="py-3 px-4 text-slate-600">{s.branch}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {formatNaira(s.expectedCollections)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                      {formatNaira(s.actualCashSubmitted)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {formatNaira(s.actualBankTransferConfirmed)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        hasVariance ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {s.variance > 0 ? `+${formatNaira(s.variance)}` : formatNaira(s.variance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'reconciled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{s.reconciledByName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Reconciliation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-900/20 my-6">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Daily Collection Reconciliation</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4 text-xs font-sans">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Collection Officer *</label>
                  <select
                    value={officerId}
                    onChange={e => setOfficerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.branch})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reconciliation Date *</label>
                  <input
                    type="date"
                    value={reconciliationDate}
                    onChange={e => setReconciliationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Expected strip */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Recorded Field Collections</span>
                  <span className="text-slate-600">Expected for selected date</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-950">{formatNaira(expectedForDate)}</span>
                </div>
              </div>

              {/* Actual Submissions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Actual Physical Cash Handed Over (₦)</label>
                  <input
                    type="number"
                    value={cashSubmitted}
                    onChange={e => setCashSubmitted(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Direct Bank Transfers Verified (₦)</label>
                  <input
                    type="number"
                    value={bankConfirmed}
                    onChange={e => setBankConfirmed(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Variance Indicator */}
              <div
                className={`p-3 rounded-xl border flex justify-between items-center font-mono ${
                  variance === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span className="font-sans font-bold text-xs">Reconciliation Variance:</span>
                <span className="font-bold text-sm">
                  {variance === 0 ? '₦0.00 (Balanced ✓)' : formatNaira(variance)}
                </span>
              </div>

              {variance !== 0 && (
                <div>
                  <label className="font-bold text-rose-800 block mb-1">Variance Discrepancy Explanation *</label>
                  <textarea
                    rows={2}
                    value={discrepancyReason}
                    onChange={e => setDiscrepancyReason(e.target.value)}
                    placeholder="Provide mandatory explanation for cash variance (e.g. counterfeit note withheld, pending transfer confirmation)..."
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-slate-800 focus:outline-hidden"
                    required
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sign-off Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Vaulted in Balogun branch strongroom"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Sign Off Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
