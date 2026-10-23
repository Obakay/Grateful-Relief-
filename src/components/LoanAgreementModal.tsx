import React from 'react';
import { X, Printer, ShieldCheck, FileText } from 'lucide-react';
import { Loan, Borrower } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface LoanAgreementModalProps {
  loan: Loan;
  borrower?: Borrower;
  onClose: () => void;
}

export const LoanAgreementModal: React.FC<LoanAgreementModalProps> = ({ loan, borrower, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-emerald-900/20 my-8">
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">Official Micro-Lending Agreement & Disbursement Voucher</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 text-slate-800 font-sans text-xs space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white p-0.5 border border-emerald-900/20 shadow-xs">
                <img
                  src="/assets/aistudio/logo_ff978855.jpg"
                  alt="Grateful Relief Program Limited"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
            <h1 className="text-xl font-bold text-emerald-950 uppercase">Grateful Relief Program Limited</h1>
            <p className="text-slate-500 text-xs">RC NO: 1894220 | Microfinance & Small Business Credit Enterprise</p>
            <p className="text-slate-500 text-xs">Head Office: 24 Broad Street, Lagos Island, Lagos State, Nigeria</p>
            <div className="mt-3 inline-block bg-emerald-100 text-emerald-900 px-3 py-1 font-bold text-xs rounded-full">
              CREDIT FACILITY AGREEMENT & DISBURSEMENT VOUCHER
            </div>
            <p className="text-slate-500 mt-1 font-mono">Contract Ref: {loan.loanCode}</p>
          </div>

          {/* Parties */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px]">The Lender</p>
              <p className="font-bold text-slate-900">Grateful Relief Program Limited</p>
              <p className="text-slate-600">Branch: {loan.branch}</p>
              <p className="text-slate-600">Approving Officer: {loan.approvedByName}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px]">The Borrower</p>
              <p className="font-bold text-slate-900">{loan.borrowerName}</p>
              <p className="text-slate-600">Business: {loan.borrowerBusiness}</p>
              <p className="text-slate-600">Phone: {loan.borrowerPhone}</p>
              {borrower?.residentialAddress && (
                <p className="text-slate-600 truncate">Address: {borrower.residentialAddress}</p>
              )}
            </div>
          </div>

          {/* Terms Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-emerald-950 text-white px-4 py-2 font-bold flex justify-between items-center text-xs">
              <span>FACILITY TERMS & SCHEDULE SUMMARY</span>
              <span>20% FLAT INTEREST ASSUMPTION</span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white text-xs">
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-500 block text-[10px]">Principal Facility</span>
                <span className="font-bold text-slate-900 text-sm">{formatNaira(loan.principalAmount)}</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-500 block text-[10px]">Contractual Interest (20%)</span>
                <span className="font-bold text-emerald-800 text-sm">{formatNaira(loan.contractualInterest)}</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-500 block text-[10px]">Total Repayment Sum</span>
                <span className="font-bold text-slate-900 text-sm">{formatNaira(loan.totalScheduledRepayment)}</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-500 block text-[10px]">Tenor & Frequency</span>
                <span className="font-bold text-slate-900">{loan.durationUnits} Weekdays (Daily)</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-500 block text-[10px]">Daily Expected Installment</span>
                <span className="font-bold text-emerald-900 text-sm">{formatNaira(loan.dailyScheduledRepayment)}</span>
              </div>
              <div className="p-2 rounded bg-slate-50">
                <span className="text-slate-500 block text-[10px]">Disbursement Mode</span>
                <span className="font-bold text-slate-900 uppercase">{loan.disbursementMethod} ({loan.disbursementReference})</span>
              </div>
            </div>
          </div>

          {/* Legal Covenants */}
          <div className="space-y-2 text-slate-600 text-[11px] leading-relaxed border-t pt-3">
            <h4 className="font-bold text-slate-800">TERMS AND CONDITIONS:</h4>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                <strong>Repayment Calendar:</strong> The Borrower agrees to repay the daily sum of {formatNaira(loan.dailyScheduledRepayment)} on each working weekday excluding Saturdays, Sundays, and Nigerian official public holidays.
              </li>
              <li>
                <strong>Allocation of Payments:</strong> Collections shall be credited first towards contractual interest and outstanding principal according to the statutory amortization policy.
              </li>
              <li>
                <strong>Default & Delinquency:</strong> Any missed daily collection must be settled immediately on the following business day. Uncured delinquency exceeding 7 days will activate collection officer visits and guarantor notifications.
              </li>
              <li>
                <strong>Disbursement Confirmation:</strong> The Borrower confirms full receipt of the net principal sum of {formatNaira(loan.principalAmount)} via {loan.disbursementMethod.toUpperCase()} (Ref: {loan.disbursementReference}) on {formatDateNG(loan.disbursementDate)}.
              </li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-4">
              <div className="border-b border-slate-400 h-10 flex items-end justify-center font-cursive text-emerald-900 italic font-bold">
                {loan.borrowerName}
              </div>
              <div>
                <p className="font-bold text-slate-800">Borrower's Signature / Thumbprint</p>
                <p className="text-[10px] text-slate-500">Date: {formatDateNG(loan.disbursementDate)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-b border-slate-400 h-10 flex items-end justify-center font-serif text-slate-700">
                {loan.disbursedByName}
              </div>
              <div>
                <p className="font-bold text-slate-800">For: Grateful Relief Program Limited</p>
                <p className="text-[10px] text-slate-500">Authorized Signatory (MD / Branch Manager)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 px-6 rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            Print Agreement & Voucher
          </button>
          <button
            onClick={onClose}
            className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-5 rounded-xl border border-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
