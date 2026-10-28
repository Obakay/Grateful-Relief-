import React from 'react';
import { X, Printer, Share2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Repayment, Loan } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface ReceiptModalProps {
  repayment: Repayment | null;
  loan?: Loan | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ repayment, loan, onClose }) => {
  if (!repayment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*GRATEFUL RELIEF PROGRAM LIMITED*\n*OFFICIAL REPAYMENT RECEIPT*\n` +
      `Receipt No: ${repayment.receiptNumber}\n` +
      `Date: ${formatDateNG(repayment.collectionDate)} ${repayment.collectionTime}\n` +
      `Borrower: ${repayment.borrowerName}\n` +
      `Loan ID: ${repayment.loanCode}\n` +
      `Amount Paid: ${formatNaira(repayment.amount)}\n` +
      `Principal: ${formatNaira(repayment.principalAllocated)} | Interest: ${formatNaira(repayment.interestAllocated)}\n` +
      (loan ? `Remaining Balance: ${formatNaira(loan.outstandingBalance)}\n` : '') +
      `Officer: ${repayment.collectedByName}\n` +
      `Status: VERIFIED & RECORDED\n` +
      `Thank you for keeping your micro-enterprise credit in good standing!`;
    
    navigator.clipboard.writeText(text);
    alert('Receipt summary copied to clipboard! You can now paste into WhatsApp or SMS.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-900/20 my-8">
        {/* Header bar with prominent Back button */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white text-xs font-bold transition border border-emerald-700/60 shadow-xs cursor-pointer"
              title="Return to Collections"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm sm:text-base">Transaction Receipt</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition cursor-pointer"
            title="Close Receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content - styled like a thermal POS microfinance receipt */}
        <div className="p-6 bg-white print-card text-slate-800 font-mono text-sm">
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white p-0.5 border border-emerald-800/30 shadow-xs">
                <img
                  src="/assets/aistudio/logo_ff978855.jpg"
                  alt="Grateful Relief Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
            <div className="inline-block bg-emerald-900 text-white font-bold px-3 py-1 text-xs rounded mb-1">
              GRATEFUL RELIEF PROGRAM LTD
            </div>
            <p className="text-xs text-slate-500 font-sans">Microfinance & Small Business Lending</p>
            <p className="text-xs text-slate-500 font-sans">RC: 1894220 | Broad St, Lagos Island</p>
            <p className="text-xs text-slate-500 font-sans">Tel: +234 1 290 8820 | Lagos, Nigeria</p>
            <div className="mt-2 text-xs font-bold text-emerald-800 tracking-wider">
              *** OFFICIAL COLLECTION RECEIPT ***
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No:</span>
              <span className="font-bold text-slate-900">{repayment.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{formatDateNG(repayment.collectionDate)} {repayment.collectionTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Loan Code:</span>
              <span className="font-semibold">{repayment.loanCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Ref:</span>
              <span className="truncate max-w-[180px]">{repayment.transactionReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="uppercase font-semibold text-emerald-800">{repayment.paymentMethod}</span>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2 my-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Borrower:</span>
                <span className="font-bold text-slate-900">{repayment.borrowerName}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Phone:</span>
                <span>{repayment.borrowerPhone}</span>
              </div>
            </div>

            {/* Financial allocation */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between text-base font-bold text-emerald-950 font-sans">
                <span>AMOUNT PAID:</span>
                <span>{formatNaira(repayment.amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                <span>Principal Credited:</span>
                <span>{formatNaira(repayment.principalAllocated)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Interest Credited:</span>
                <span>{formatNaira(repayment.interestAllocated)}</span>
              </div>
              {loan && (
                <div className="flex justify-between text-xs font-semibold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Remaining Loan Balance:</span>
                  <span className="text-emerald-800">{formatNaira(loan.outstandingBalance)}</span>
                </div>
              )}
            </div>

            <div className="pt-2 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Collecting Officer:</span>
                <span className="font-medium text-slate-800">{repayment.collectedByName}</span>
              </div>
              {repayment.notes && (
                <div className="text-[11px] text-slate-500 italic">
                  Note: {repayment.notes}
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[11px] text-slate-500">
              <p>Security Idempotency: {repayment.idempotencyKey.slice(0, 18)}...</p>
              <p className="mt-1 font-sans text-emerald-800 font-semibold">Thank you for your prompt daily repayment!</p>
              <p className="text-[10px]">Retain this receipt for daily branch reconciliation</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="bg-slate-50 px-5 py-4 flex items-center gap-2.5 border-t border-slate-200 no-print">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-300 transition shadow-xs text-xs cursor-pointer"
            title="Return to Collections / Repayments"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-4 rounded-xl border border-slate-300 transition text-xs cursor-pointer"
            title="Copy for WhatsApp/SMS"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};
