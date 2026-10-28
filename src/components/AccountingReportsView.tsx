import React, { useState } from 'react';
import {
  LineChart,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  PieChart,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  Lock,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { dbService } from '../services/db';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

export const AccountingReportsView: React.FC = () => {
  const currentUser = dbService.getCurrentUser();
  const isAdmin = currentUser.role === 'administrator';

  const [reportType, setReportType] = useState<'pnl' | 'portfolio' | 'collections' | 'expenses'>(
    isAdmin ? 'pnl' : 'portfolio'
  );
  const metrics = dbService.getDashboardMetrics();
  const loans = dbService.getLoans();
  const repayments = dbService.getRepayments().filter(r => !r.isReversed);
  const expenses = dbService.getExpenses().filter(e => e.status === 'approved' || e.status === 'paid');

  const handleExportCSV = () => {
    if (reportType === 'pnl' && !isAdmin) {
      alert('Access Restricted: Only Company Administrators are authorized to view and export Realized Income and P&L financial statements.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'pnl') {
      csvContent += 'Accounting Category,Amount (NGN)\n';
      csvContent += `Realized Interest Income,${metrics.totalInterestCollected}\n`;
      csvContent += `Other Company Operating Income,${metrics.totalOtherIncome}\n`;
      csvContent += `Total Company Realized Revenue,${metrics.totalCompanyRealizedRevenue}\n`;
      csvContent += `Operating Expenses,${metrics.totalExpenses}\n`;
      csvContent += `Net Realized Company Profit,${metrics.netRealizedLendingIncome}\n`;
      csvContent += `Total Principal Disbursed,${metrics.totalDisbursed}\n`;
      csvContent += `Total Principal Recovered,${metrics.totalPrincipalRecovered}\n`;
      csvContent += `Outstanding Principal Portfolio,${metrics.totalOutstandingPrincipal}\n`;
    } else if (reportType === 'portfolio') {
      csvContent += 'Loan Code,Borrower,Principal,Contractual Interest,Total Repaid,Balance Due,Status\n';
      loans.forEach(l => {
        csvContent += `"${l.loanCode}","${l.borrowerName}",${l.principalAmount},${l.contractualInterest},${l.totalPaid},${l.outstandingBalance},"${l.status}"\n`;
      });
    } else if (reportType === 'collections') {
      csvContent += 'Receipt Number,Date,Borrower,Loan Code,Amount,Principal Alloc,Interest Alloc,Method\n';
      repayments.forEach(r => {
        csvContent += `"${r.receiptNumber}","${r.collectionDate}","${r.borrowerName}","${r.loanCode}",${r.amount},${r.principalAllocated},${r.interestAllocated},"${r.paymentMethod}"\n`;
      });
    } else {
      csvContent += 'Expense Code,Date,Category,Description,Amount,Vendor,Status\n';
      expenses.forEach(e => {
        csvContent += `"${e.expenseCode}","${e.submittedDate}","${e.category}","${e.description}",${e.amount},"${e.recipientVendor}","${e.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grp_financial_report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Financial Accounting & Management Reports</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              IFRS / Nigerian GAAP Microfinance Principles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grateful Relief Program Limited • Strict segregation of capital recovery from recognized revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-3.5 rounded-xl border border-slate-300 text-xs shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex gap-2 text-xs font-semibold overflow-x-auto no-print">
        {[
          {
            id: 'pnl',
            label: isAdmin ? 'Profit & Loss Statement (Realized & Other Income)' : 'Profit & Loss Statement',
            isAdminOnly: true,
          },
          { id: 'portfolio', label: 'Loan Portfolio & Principal Exposure', isAdminOnly: false },
          { id: 'collections', label: 'Collections Ledger (Principal vs Interest)', isAdminOnly: false },
          { id: 'expenses', label: 'Operating Expenses Ledger', isAdminOnly: false },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as any)}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              reportType === t.id
                ? 'bg-emerald-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{t.label}</span>
            {t.isAdminOnly && !isAdmin && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                <Lock className="w-3 h-3" /> Admin
              </span>
            )}
          </button>
        ))}
      </div>

      {/* REPORT 1: PROFIT & LOSS STATEMENT */}
      {reportType === 'pnl' && (
        !isAdmin ? (
          /* Non-Admin Access Restricted Guard */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-amber-200">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200 inline-block">
                Confidential Financial Statement • Admin Only
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Company Income & Profit Statement Restricted
              </h2>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                Under Grateful Relief internal financial governance, <strong>Realized Interest Income</strong>, <strong>Other Operating Income (penalties & assessment fees)</strong>, and <strong>Net Company Profit</strong> statements are restricted strictly to authorized Company Administrators.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                Active Staff Account: <span className="font-bold text-slate-800">{currentUser.fullName}</span> ({currentUser.role.replace('_', ' ')})
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 text-slate-700">
              <span className="font-bold text-slate-900 block">Available Reports for your role:</span>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Loan Portfolio:</strong> Principal disbursement exposure, loan codes, customer status</li>
                <li><strong>Collections Ledger:</strong> Daily receipts, cashier logs, and repayment history</li>
                <li><strong>Operating Expenses:</strong> Field voucher auditing and fuel/logistics tracking</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setReportType('portfolio')}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                View Loan Portfolio Schedule →
              </button>
              <button
                onClick={() => setReportType('collections')}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 transition cursor-pointer"
              >
                View Collections Ledger →
              </button>
            </div>
          </div>
        ) : (
          /* Admin Authorized P&L Statement */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 print-card">
            <div className="text-center border-b pb-4">
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white p-0.5 border border-emerald-900/20 shadow-xs">
                  <img
                    src="/assets/aistudio/logo_ff978855.jpg"
                    alt="Grateful Relief Program Limited"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <h2 className="text-base font-extrabold text-emerald-950 uppercase">Grateful Relief Program Limited</h2>
              <p className="text-xs text-slate-500">Statement of Realized Lending Income & Operating Performance</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-[11px] font-mono text-slate-400">Reporting Currency: Nigerian Naira (₦)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Admin Verified
                </span>
              </div>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto text-xs">
              {/* Section 1: Realized Lending Revenue */}
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 space-y-2">
                <div className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex justify-between">
                  <span>1. OPERATING LENDING REVENUE</span>
                  <span>REALIZED CASH BASIS</span>
                </div>
                <div className="flex justify-between py-1 text-slate-700 border-b border-emerald-200/50">
                  <span>Realized Interest Collected (20% on micro-loans)</span>
                  <span className="font-mono font-bold text-emerald-900">{formatNaira(metrics.totalInterestCollected)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                  <span>Contractual Unearned Future Interest (Deferred)</span>
                  <span className="font-mono">{formatNaira(metrics.totalContractualInterest - metrics.totalInterestCollected)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-emerald-950 text-xs pt-1">
                  <span>Subtotal Realized Lending Interest:</span>
                  <span className="font-mono">{formatNaira(metrics.totalInterestCollected)}</span>
                </div>
              </div>

              {/* Section 2: Other Company Operating Income */}
              <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-100 space-y-2">
                <div className="font-bold text-teal-950 text-xs uppercase tracking-wider flex justify-between">
                  <span>2. OTHER OPERATING COMPANY INCOME</span>
                  <span>FEES & RECOVERY</span>
                </div>
                <div className="flex justify-between py-1 text-slate-700 border-b border-teal-200/50">
                  <span>Loan Registration & Credit Assessment Fees (₦1,500/loan)</span>
                  <span className="font-mono font-bold text-teal-900">{formatNaira(metrics.loanProcessingFees)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-700 border-b border-teal-200/50">
                  <span>Late Default Penalties Collected (delinquency charges)</span>
                  <span className="font-mono font-bold text-teal-900">{formatNaira(metrics.latePenaltiesCollected)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-teal-950 text-xs pt-1">
                  <span>Subtotal Other Company Income:</span>
                  <span className="font-mono">{formatNaira(metrics.totalOtherIncome)}</span>
                </div>
              </div>

              {/* Total Recognized Gross Revenue */}
              <div className="bg-emerald-100/70 p-3.5 rounded-xl border border-emerald-300 flex justify-between items-center text-sm font-bold text-emerald-950">
                <span>TOTAL REALIZED COMPANY REVENUE:</span>
                <span className="font-mono text-base">{formatNaira(metrics.totalCompanyRealizedRevenue)}</span>
              </div>

              {/* Section 3: Operating Expenses */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex justify-between">
                  <span>3. OPERATIONAL & FIELD EXPENSES</span>
                  <span>VOUCHER AUDITED</span>
                </div>
                {expenses.map(e => (
                  <div key={e.id} className="flex justify-between py-0.5 text-slate-600">
                    <span>{e.category} ({e.description.slice(0, 35)}...)</span>
                    <span className="font-mono">{formatNaira(e.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                  <span>TOTAL OPERATING EXPENSES:</span>
                  <span className="font-mono text-rose-700">({formatNaira(metrics.totalExpenses)})</span>
                </div>
              </div>

              {/* Section 4: Net Realized Lending Income / Company Profit */}
              <div className="bg-emerald-950 text-white p-5 rounded-2xl flex items-center justify-between text-sm shadow-md">
                <div>
                  <span className="text-[10px] text-emerald-300 font-bold uppercase block">Executive Audited Result</span>
                  <h3 className="text-base font-black">NET REALIZED COMPANY PROFIT</h3>
                  <span className="text-[11px] text-emerald-200">Total Realized Revenue (Interest + Other) minus verified expenses</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-emerald-300">
                    {formatNaira(metrics.netRealizedLendingIncome)}
                  </span>
                </div>
              </div>

              {/* Capital Disclosures */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1.5 text-[11px]">
                <h4 className="font-bold text-slate-800">Prudential Balance Sheet Notes:</h4>
                <div className="flex justify-between">
                  <span>Cumulative Principal Disbursed:</span>
                  <span className="font-mono font-bold text-slate-900">{formatNaira(metrics.totalDisbursed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cumulative Principal Recovered:</span>
                  <span className="font-mono font-bold text-emerald-800">{formatNaira(metrics.totalPrincipalRecovered)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Outstanding Loan Portfolio:</span>
                  <span className="font-mono font-bold text-slate-900">{formatNaira(metrics.totalOutstandingPrincipal)}</span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* REPORT 2: PORTFOLIO EXPOSURE */}
      {reportType === 'portfolio' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Active Microfinance Portfolio Schedule</h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Loan ID</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3 text-right">Principal</th>
                  <th className="py-2.5 px-3 text-right">Contractual Interest</th>
                  <th className="py-2.5 px-3 text-right">Recovered</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Bal</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{l.loanCode}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{l.borrowerName}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">{formatNaira(l.principalAmount)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800">{formatNaira(l.contractualInterest)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">{formatNaira(l.totalPaid)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-bold">{formatNaira(l.outstandingBalance)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: COLLECTIONS LEDGER */}
      {reportType === 'collections' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Verified Collections Ledger (Principal vs Interest)</h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3 text-right">Total Paid</th>
                  <th className="py-2.5 px-3 text-right">Principal Portion</th>
                  <th className="py-2.5 px-3 text-right">Interest Portion</th>
                  <th className="py-2.5 px-3 text-center">Method</th>
                  <th className="py-2.5 px-3">Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repayments.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.receiptNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatDateNG(r.collectionDate)}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{r.borrowerName}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900">{formatNaira(r.amount)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatNaira(r.principalAllocated)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800">{formatNaira(r.interestAllocated)}</td>
                    <td className="py-2.5 px-3 text-center uppercase text-[10px] font-bold text-slate-600">{r.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.collectedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: EXPENSES LEDGER */}
      {reportType === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Operating Expenses Ledger</h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Voucher Code</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{e.expenseCode}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatDateNG(e.submittedDate)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{e.category}</td>
                    <td className="py-2.5 px-3 text-slate-800">{e.description}</td>
                    <td className="py-2.5 px-3 text-slate-600">{e.recipientVendor}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatNaira(e.amount)}</td>
                    <td className="py-2.5 px-3 text-center uppercase text-[10px] font-bold text-emerald-800">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
