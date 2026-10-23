import React, { useState } from 'react';
import {
  Receipt,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingDown,
  Building,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

export const ExpenseManagerView: React.FC = () => {
  const currentUser = dbService.getCurrentUser();
  const [expenses, setExpenses] = useState<Expense[]>(dbService.getExpenses());
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Expense form
  const [category, setCategory] = useState<ExpenseCategory>('Transportation & Fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [vendor, setVendor] = useState('');
  const [reference, setReference] = useState(`EXP-REF-${Date.now().toString().slice(-6)}`);
  const [branch, setBranch] = useState(currentUser.branch);

  const categories: ExpenseCategory[] = [
    'Staff Salaries',
    'Office Rent',
    'Transportation & Fuel',
    'Collection Expenses',
    'Administrative',
    'Communication & Airtime',
    'Utilities',
    'Marketing',
    'Software & Technology',
    'Bank Charges',
    'Other Operations',
  ];

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0 || !description || !vendor) {
      setErrorMsg('Please complete all expense details.');
      return;
    }

    try {
      dbService.addExpense({
        category,
        description,
        amount,
        paymentMethod,
        recipientVendor: vendor,
        referenceNumber: reference,
        branch,
      });

      setExpenses(dbService.getExpenses());
      setShowAddModal(false);
      setDescription('');
      setVendor('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record expense');
    }
  };

  const handleApproveExpense = (expenseId: string) => {
    setErrorMsg(null);
    try {
      dbService.approveExpense(expenseId);
      setExpenses(dbService.getExpenses());
    } catch (err: any) {
      setErrorMsg(err?.message || 'Approval failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Operational Expense Management</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Maker-Checker Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track branch operating costs, transport stipends, thermal paper rolls, utilities, and staff salaries.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Expenses Recorded</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{formatNaira(totalExpenses)}</div>
          <span className="text-[11px] text-slate-500">{expenses.length} vouchers filed</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Pending Sign-off</span>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {expenses.filter(e => e.status === 'pending').length} vouchers
          </div>
          <span className="text-[11px] text-slate-500">Awaiting Maker-Checker Approval</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Paid & Reconciled</span>
          <div className="text-2xl font-black text-emerald-900 mt-2">
            {formatNaira(expenses.filter(e => e.status === 'paid' || e.status === 'approved').reduce((s, e) => s + e.amount, 0))}
          </div>
          <span className="text-[11px] text-slate-500">Debited from ledger</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">Expense Code</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description & Vendor</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(exp => {
                const isPending = exp.status === 'pending';
                const canApprove = currentUser.role === 'administrator';

                return (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{exp.expenseCode}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDateNG(exp.submittedDate)}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{exp.description}</div>
                      <div className="text-[10px] text-slate-500">{exp.recipientVendor} ({exp.referenceNumber})</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatNaira(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{exp.submittedByName}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          exp.status === 'approved' || exp.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isPending && canApprove ? (
                        <button
                          onClick={() => handleApproveExpense(exp.id)}
                          className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {exp.approvedByName ? `Approved by ${exp.approvedByName}` : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-900/20 my-6">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Record Operational Expense</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Description *</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Fuel subsidy for Balogun market collections"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  >
                    <option value="cash">Cash (Petty Cash Vault)</option>
                    <option value="bank_transfer">Bank Transfer (NIP)</option>
                    <option value="pos">POS Terminal Debit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient / Vendor *</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={e => setVendor(e.target.value)}
                    placeholder="e.g. TotalEnergies Marina"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice / Receipt Ref</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Expense Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
