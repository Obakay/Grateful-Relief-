import React, { useState } from 'react';
import {
  SendHorizontal,
  CheckCircle,
  FileText,
  AlertTriangle,
  Building,
  CreditCard,
  Banknote,
  Search,
} from 'lucide-react';
import { dbService } from '../services/db';
import { LoanApplication, Loan } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface DisbursementViewProps {
  onLoanDisbursed: (loan: Loan) => void;
  onViewAgreement: (loan: Loan) => void;
}

export const DisbursementView: React.FC<DisbursementViewProps> = ({
  onLoanDisbursed,
  onViewAgreement,
}) => {
  const currentUser = dbService.getCurrentUser();
  const applications = dbService.getApplications();
  const approvedQueue = applications.filter(a => a.status === 'approved');
  const disbursedLoans = dbService.getLoans();

  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [disbursementMethod, setDisbursementMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');
  const [reference, setReference] = useState<string>(`CBN-NIP-${Date.now().toString().slice(-6)}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDisburse = (app: LoanApplication) => {
    setSelectedApp(app);
    setErrorMsg(null);
    setSuccessMsg(null);
    setReference(disbursementMethod === 'cash' ? `CSH-VOUCHER-${Date.now().toString().slice(-5)}` : `CBN-NIP-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (currentUser.role !== 'administrator') {
      setErrorMsg('Permission Denied: Only administrators can authorize loan disbursements.');
      return;
    }

    if (!reference.trim()) {
      setErrorMsg('Please enter a valid disbursement reference or bank transaction number.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const loan = dbService.disburseLoan({
        applicationId: selectedApp.id,
        disbursementMethod,
        disbursementReference: reference,
      });

      setSuccessMsg(`Facility disbursed successfully for ${loan.borrowerName}! Loan Code: ${loan.loanCode}`);
      onLoanDisbursed(loan);
      setSelectedApp(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Disbursement failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Disbursement & Legal Loan Agreements</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {approvedQueue.length} Ready for Payout
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maker-Checker disbursement queue: Atomic payout recording, bank reference verification, and legal agreement generation.
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 text-xs">Dismiss</button>
        </div>
      )}

      {/* Approved Awaiting Disbursement Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <SendHorizontal className="w-4 h-4 text-emerald-700" />
          <span>Approved Applications Awaiting Capital Payout</span>
        </h2>

        {approvedQueue.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No approved loans currently waiting in disbursement queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedQueue.map(app => (
              <div
                key={app.id}
                className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {app.applicationCode}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{app.borrowerName}</h3>
                      <p className="text-xs text-slate-500">{app.borrowerPhone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Approved Amount</span>
                      <span className="text-base font-black text-slate-900">
                        {formatNaira(app.approvedPrincipal || app.requestedPrincipal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Product:</span>
                      <span className="font-semibold text-slate-900">{app.productName}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Schedule:</span>
                      <span>{app.durationUnits} Weekdays @ 20% Flat</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Approved By:</span>
                      <span className="font-medium text-emerald-900">{app.approvedByName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    Ready for fund release
                  </span>
                  <button
                    onClick={() => handleDisburse(app)}
                    className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-xs"
                  >
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>Disburse Funds Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disbursed Loans & Print Agreement Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Disbursed Facility Contracts & Agreements</span>
          </h2>
          <span className="text-xs text-slate-500">{disbursedLoans.length} Contracts Active</span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Loan ID</th>
                <th className="py-2.5 px-3">Borrower</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3">Disbursed Date</th>
                <th className="py-2.5 px-3">Mode & Ref</th>
                <th className="py-2.5 px-3">Disbursed By</th>
                <th className="py-2.5 px-3 text-center">Legal Contract</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {disbursedLoans.map(loan => (
                <tr key={loan.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{loan.loanCode}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{loan.borrowerName}</div>
                    <div className="text-[10px] text-slate-400">{loan.borrowerBusiness}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatNaira(loan.principalAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{formatDateNG(loan.disbursementDate)}</td>
                  <td className="py-2.5 px-3">
                    <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-1.5">
                      {loan.disbursementMethod}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{loan.disbursementReference}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{loan.disbursedByName}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onViewAgreement(loan)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Print Agreement</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disbursement Execution Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-900/20 my-8">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SendHorizontal className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Disburse Loan Facility</h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDisbursement} className="p-6 space-y-4 text-xs font-sans">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Facility Details</span>
                <div className="text-sm font-bold text-emerald-950">{selectedApp.borrowerName}</div>
                <div className="text-base font-black text-emerald-900">
                  Principal Amount: {formatNaira(selectedApp.approvedPrincipal || selectedApp.requestedPrincipal)}
                </div>
                <p className="text-[11px] text-emerald-700">
                  Approved By: {selectedApp.approvedByName} • {selectedApp.durationUnits} weekday installments
                </p>
              </div>

              {/* Disbursement method */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Disbursement Payout Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDisbursementMethod('bank_transfer');
                      setReference(`CBN-NIP-${Date.now().toString().slice(-6)}`);
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                      disbursementMethod === 'bank_transfer'
                        ? 'bg-emerald-900 text-white border-emerald-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>NIBSS / Bank Transfer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisbursementMethod('cash');
                      setReference(`CSH-VOUCHER-${Date.now().toString().slice(-5)}`);
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                      disbursementMethod === 'cash'
                        ? 'bg-emerald-900 text-white border-emerald-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash Vault Payout</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Bank Transfer Reference / Cash Voucher Reference *
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Disbursing Staff:</span>
                  <span className="font-semibold text-slate-800">{currentUser.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Branch:</span>
                  <span>{currentUser.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span>Repayment Start:</span>
                  <span className="font-semibold text-emerald-800">{formatDateNG(selectedApp.repaymentStartDate)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {isProcessing ? 'Processing Disbursement...' : 'Confirm & Disburse Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
