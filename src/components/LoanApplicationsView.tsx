import React, { useState } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { dbService } from '../services/db';
import { LoanApplication, Borrower, LoanProduct } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface LoanApplicationsViewProps {
  onApplicationApproved: (app: LoanApplication) => void;
}

export const LoanApplicationsView: React.FC<LoanApplicationsViewProps> = ({ onApplicationApproved }) => {
  const currentUser = dbService.getCurrentUser();
  const [applications, setApplications] = useState<LoanApplication[]>(dbService.getApplications());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<number>(20000);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Application Form
  const borrowers = dbService.getBorrowers();
  const products = dbService.getProducts();

  const [formBorrowerId, setFormBorrowerId] = useState(borrowers[0]?.id || '');
  const [formProductId, setFormProductId] = useState(products[0]?.id || '');
  const [formPrincipal, setFormPrincipal] = useState<number>(20000);
  const [formPurpose, setFormPurpose] = useState('');
  const [formDisbDate, setFormDisbDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredApps = applications.filter(app => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      app.borrowerName.toLowerCase().includes(q) ||
      app.applicationCode.toLowerCase().includes(q) ||
      app.borrowerPhone.includes(q);

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAction = (app: LoanApplication, type: 'approve' | 'reject') => {
    setSelectedApp(app);
    setActionType(type);
    setApprovedAmount(app.requestedPrincipal);
    setRejectionReason('');
    setActionError(null);
  };

  const handleConfirmAction = () => {
    if (!selectedApp || !actionType) return;
    setActionError(null);

    try {
      if (actionType === 'approve') {
        const approved = dbService.approveApplication(selectedApp.id, approvedAmount);
        setApplications(dbService.getApplications());
        onApplicationApproved(approved);
        setSelectedApp(null);
        setActionType(null);
      } else {
        if (!rejectionReason.trim()) {
          setActionError('Please specify the official credit rejection reason.');
          return;
        }
        dbService.rejectApplication(selectedApp.id, rejectionReason);
        setApplications(dbService.getApplications());
        setSelectedApp(null);
        setActionType(null);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Operation failed');
    }
  };

  const handleCreateApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formBorrowerId || !formProductId || formPrincipal <= 0) {
      setFormError('Please select valid borrower, product, and principal.');
      return;
    }

    try {
      dbService.submitApplication({
        borrowerId: formBorrowerId,
        productId: formProductId,
        requestedPrincipal: formPrincipal,
        purpose: formPurpose || 'Small business working capital',
        proposedDisbursementDate: formDisbDate,
        repaymentStartDate: formStartDate,
      });

      setApplications(dbService.getApplications());
      setShowNewModal(false);
      setFormPurpose('');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit application');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Loan Applications & Credit Review</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Maker-Checker Enforced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Separation of duties: Field officers submit applications; Administrators independently assess and approve.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Loan Application</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search application code, borrower name, phone..."
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
            <option value="all">All Applications</option>
            <option value="submitted">Submitted (Under Review)</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">App Code</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Product / Tenor</th>
                <th className="py-3 px-4 text-right">Requested</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Maker-Checker Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No loan applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => {
                  const isSubmitted = app.status === 'submitted' || app.status === 'under_review';
                  const isSelfSubmitted = app.submittedBy === currentUser.id;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{app.applicationCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{app.borrowerName}</div>
                        <div className="text-[10px] text-slate-400">{app.borrowerPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{app.productName}</div>
                        <div className="text-[10px] text-slate-500">
                          {app.interestRatePercent}% flat • {app.durationUnits} weekdays
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatNaira(app.requestedPrincipal)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{app.submittedByName}</div>
                        <div className="text-[10px] text-slate-400">{formatDateNG(app.submittedAt)}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            app.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'disbursed'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isSubmitted ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {isSelfSubmitted ? (
                              <span
                                className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-center gap-1"
                                title="Maker-Checker: You submitted this application and cannot approve it yourself"
                              >
                                <AlertTriangle className="w-3 h-3" /> Maker (Requires 2nd Pair of Eyes)
                              </span>
                            ) : currentUser.role === 'administrator' ? (
                              <>
                                <button
                                  onClick={() => handleOpenAction(app, 'approve')}
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition font-semibold text-xs flex items-center gap-1"
                                  title="Approve loan application"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleOpenAction(app, 'reject')}
                                  className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition font-semibold text-xs flex items-center gap-1"
                                  title="Reject loan application"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400">Admin Only</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {app.status === 'approved' ? `Approved by ${app.approvedByName}` : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog (Approve / Reject) */}
      {selectedApp && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-900/20 my-8">
            <div
              className={`px-6 py-4 flex items-center justify-between text-white ${
                actionType === 'approve' ? 'bg-emerald-950' : 'bg-rose-950'
              }`}
            >
              <h3 className="font-bold text-base">
                {actionType === 'approve' ? 'Approve Loan Application' : 'Reject Loan Application'}
              </h3>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setActionType(null);
                }}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{selectedApp.borrowerName}</div>
                <div className="text-slate-500 font-mono text-[11px]">{selectedApp.applicationCode}</div>
                <div className="mt-1 text-slate-700">Requested: <strong>{formatNaira(selectedApp.requestedPrincipal)}</strong></div>
                <div className="text-slate-500 mt-1">Submitted by: {selectedApp.submittedByName}</div>
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionType === 'approve' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Approved Principal Facility (₦)</label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={e => setApprovedAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Approval limit for {currentUser.fullName}: <strong>{formatNaira(currentUser.approvalLimit)}</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rejection Reason *</label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Provide clear documented reason for audit and applicant notification..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApp(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-xs ${
                    actionType === 'approve'
                      ? 'bg-emerald-800 hover:bg-emerald-900'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Loan Application Form Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-emerald-900/20 my-6">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">Submit New Loan Application</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-emerald-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="p-6 space-y-4 text-xs font-sans">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Borrower *</label>
                <select
                  value={formBorrowerId}
                  onChange={e => setFormBorrowerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {borrowers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.fullName} ({b.borrowerCode} - {b.businessName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loan Product *</label>
                  <select
                    value={formProductId}
                    onChange={e => {
                      setFormProductId(e.target.value);
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) setFormPrincipal(prod.defaultPrincipal);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-hidden"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.interestRatePercent}% Flat)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Requested Principal (₦) *</label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    value={formPrincipal}
                    onChange={e => setFormPrincipal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Product preview terms */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                <span className="font-bold block">Terms Snapshot Preview:</span>
                <p className="text-[11px]">
                  Principal: {formatNaira(formPrincipal)} | 20% Flat Interest: {formatNaira(formPrincipal * 0.20)} | Total: {formatNaira(formPrincipal * 1.20)}
                </p>
                <p className="text-[11px] font-semibold">
                  Daily Weekday Repayment: {formatNaira((formPrincipal * 1.20) / 24)} / day (excluding Sat & Sun)
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Loan Purpose & Business Restocking Details</label>
                <textarea
                  rows={2}
                  value={formPurpose}
                  onChange={e => setFormPurpose(e.target.value)}
                  placeholder="e.g. Stocking up 20 bundles of Ankara fabrics for festive market sales"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Proposed Disbursement Date</label>
                  <input
                    type="date"
                    value={formDisbDate}
                    onChange={e => setFormDisbDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Repayment Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  />
                </div>
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
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
