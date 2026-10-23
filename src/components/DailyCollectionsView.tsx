import React, { useState } from 'react';
import {
  Search,
  Wallet,
  Receipt,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  ArrowRight,
  Clock,
  History,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Loan, Repayment, PaymentMethod } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface DailyCollectionsViewProps {
  onRepaymentRecorded: (repayment: Repayment, loan: Loan) => void;
  onViewSchedule: (loan: Loan) => void;
}

export const DailyCollectionsView: React.FC<DailyCollectionsViewProps> = ({
  onRepaymentRecorded,
  onViewSchedule,
}) => {
  const currentUser = dbService.getCurrentUser();
  const loans = dbService.getLoans().filter(l => l.status === 'active' || l.status === 'overdue');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [transactionRef, setTransactionRef] = useState<string>(`TRX-CSH-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter loans by borrower name, phone, or loan code
  const filteredLoans = loans.filter(l => {
    const q = searchTerm.toLowerCase();
    return (
      l.borrowerName.toLowerCase().includes(q) ||
      l.borrowerPhone.includes(q) ||
      l.loanCode.toLowerCase().includes(q) ||
      l.borrowerBusiness.toLowerCase().includes(q)
    );
  });

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

  // Quick amount selections
  const handleSelectQuickAmount = (amount: number) => {
    setPaymentAmount(amount);
  };

  const handleProcessRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedLoan) {
      setErrorMsg('Please select an active loan to record collection.');
      return;
    }

    if (currentUser.role === 'auditor') {
      setErrorMsg('Auditor accounts are read-only and cannot process financial collections.');
      return;
    }

    if (paymentAmount <= 0) {
      setErrorMsg('Collection amount must be greater than ₦0.00');
      return;
    }

    if (!transactionRef.trim()) {
      setErrorMsg('Please provide a valid transaction reference or voucher number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = `idemp-${selectedLoan.id}-${transactionRef}-${paymentAmount}-${Date.now()}`;
      const result = dbService.recordRepayment({
        loanId: selectedLoan.id,
        amount: paymentAmount,
        paymentMethod,
        transactionReference: transactionRef,
        idempotencyKey,
        notes: notes || 'Market field collection',
      });

      setSuccessMsg(`Repayment of ${formatNaira(paymentAmount)} recorded successfully! Receipt: ${result.repayment.receiptNumber}`);
      onRepaymentRecorded(result.repayment, result.updatedLoan);

      // Reset form
      setTransactionRef(`TRX-${paymentMethod === 'cash' ? 'CSH' : 'BNK'}-${Date.now().toString().slice(-6)}`);
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record repayment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Daily Field Repayment Collection</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Mobile Touch Optimized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Collecting Officer: <span className="font-semibold text-slate-800">{currentUser.fullName}</span> ({currentUser.branch})
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-200">
            Active Accounts: {loans.length}
          </span>
        </div>
      </div>

      {/* Main Collection Interface: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Borrower & Loan Search Selector (4 cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col max-h-[700px]">
          <div className="mb-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Select Borrower / Loan
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, phone, loan code, shop..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* List of loans */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredLoans.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No active loans match "{searchTerm}"
              </div>
            ) : (
              filteredLoans.map(l => {
                const isSelected = l.id === selectedLoanId;
                const isOverdue = l.status === 'overdue';

                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedLoanId(l.id);
                      setPaymentAmount(l.dailyScheduledRepayment);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {l.borrowerName}
                          {isOverdue && (
                            <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{l.borrowerBusiness}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {l.loanCode} • {l.borrowerPhone}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-900">
                          {formatNaira(l.dailyScheduledRepayment)}/day
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Bal: {formatNaira(l.outstandingBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Collection Entry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {selectedLoan ? (
            <form onSubmit={handleProcessRepayment} className="space-y-5">
              {/* Selected Borrower Hero Header */}
              <div className="bg-emerald-950 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                    Selected Borrower
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedLoan.borrowerName}</h3>
                  <p className="text-xs text-emerald-200">{selectedLoan.borrowerBusiness}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-300 block">Total Balance Due</span>
                  <span className="text-lg font-black text-white">{formatNaira(selectedLoan.outstandingBalance)}</span>
                </div>
              </div>

              {/* Installment Info & Quick view schedule */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Scheduled Daily</span>
                  <span className="text-sm font-bold text-emerald-900">
                    {formatNaira(selectedLoan.dailyScheduledRepayment)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Installments Paid</span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedLoan.installmentsPaidCount} of {selectedLoan.installmentsTotal}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Amortization</span>
                  <button
                    type="button"
                    onClick={() => onViewSchedule(selectedLoan)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline block mx-auto mt-0.5"
                  >
                    View Schedule →
                  </button>
                </div>
              </div>

              {/* Amount Selection & Quick Buttons */}
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Payment Amount (₦)
                </label>
                
                {/* Touch buttons for outdoor speed */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    selectedLoan.dailyScheduledRepayment,
                    selectedLoan.dailyScheduledRepayment * 2,
                    500,
                    2000,
                  ].map((amt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuickAmount(amt)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        paymentAmount === amt
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {formatNaira(amt)}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm font-bold text-slate-400 font-mono">₦</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cash', label: 'Cash In Hand', icon: Banknote },
                    { id: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
                    { id: 'pos', label: 'POS Terminal', icon: QrCode },
                  ].map(m => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id as PaymentMethod);
                          setTransactionRef(`TRX-${m.id === 'cash' ? 'CSH' : 'NIP'}-${Date.now().toString().slice(-6)}`);
                        }}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                          isSel
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction Reference & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unique Transaction Ref / Voucher #
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. NIP-20261023-991"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Collection Field Note
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Paid at stall in Balogun"
                  />
                </div>
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || currentUser.role === 'auditor'}
                className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition text-sm cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Recording & Generating Receipt...' : `Record Payment & Generate Official Receipt (${formatNaira(paymentAmount)})`}
                </span>
              </button>
            </form>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Select an active loan account from the left column to begin recording daily collections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
