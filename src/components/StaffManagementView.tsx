import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Shield,
  ShieldAlert,
  Building,
  Phone,
  Mail,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Key,
  DollarSign,
  UserX,
  X,
  ArrowRight,
} from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile, UserRole } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface StaffManagementViewProps {
  onStaffUpdated: () => void;
  onSwitchUser: (userId: string) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  onStaffUpdated,
  onSwitchUser,
}) => {
  const currentUser = dbService.getCurrentUser();
  const [staffList, setStaffList] = useState<UserProfile[]>(dbService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New staff form state
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+234 ');
  const [newRole, setNewRole] = useState<UserRole>('loan_officer');
  const [newBranch, setNewBranch] = useState('Lagos Island (Balogun Market)');
  const [newApprovalLimit, setNewApprovalLimit] = useState<number>(0);

  // Edit staff form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('loan_officer');
  const [editBranch, setEditBranch] = useState('');
  const [editApprovalLimit, setEditApprovalLimit] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  const branches = dbService.getBranches().map(b => b.name);

  const roleLabels: Record<UserRole, { label: string; badge: string; desc: string }> = {
    administrator: {
      label: 'Administrator',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: 'Full company-wide financial access, loan approval, disbursements, and staff management.',
    },
    loan_officer: {
      label: 'Loan / Collection Officer',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      desc: 'Registers borrowers, submits loan applications, and collects daily field payments. Cannot self-approve loans.',
    },
    branch_manager: {
      label: 'Branch Manager',
      badge: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Supervises branch collections, approves loans within assigned branch limits, and signs off daily cash handover.',
    },
    supervisor: {
      label: 'Credit Supervisor',
      badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      desc: 'Assesses credit risk, conducts field checks, and performs Maker-Checker appraisal.',
    },
    accountant: {
      label: 'Accountant',
      badge: 'bg-teal-100 text-teal-900 border-teal-300',
      desc: 'Maintains financial ledgers, manages operating expenses, and reconciles cash vault with bank balances.',
    },
    auditor: {
      label: 'Internal Auditor',
      badge: 'bg-blue-100 text-blue-900 border-blue-300',
      desc: 'Read-only access to all loans, repayments, expenses, reconciliation sessions, and immutable audit logs.',
    },
  };

  const filteredStaff = staffList.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.branch.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesBranch = branchFilter === 'all' || s.branch.includes(branchFilter);
    return matchesSearch && matchesRole && matchesBranch;
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newFullName.trim() || !newEmail.trim() || !newPhone.trim()) {
      setErrorMessage('Please complete all mandatory staff fields.');
      return;
    }

    try {
      const created = dbService.addUser({
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        role: newRole,
        branch: newBranch,
        approvalLimit: newRole === 'administrator' || newRole === 'branch_manager' ? newApprovalLimit : 0,
        isActive: true,
      });

      setStaffList(dbService.getUsers());
      onStaffUpdated();
      setShowAddModal(false);
      setSuccessMessage(`Staff account for ${created.fullName} (${roleLabels[created.role].label}) created successfully!`);

      // Reset form
      setNewFullName('');
      setNewEmail('');
      setNewPhone('+234 ');
      setNewRole('loan_officer');
      setNewApprovalLimit(0);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create staff account');
    }
  };

  const handleStartEdit = (staff: UserProfile) => {
    setEditingStaff(staff);
    setEditFullName(staff.fullName);
    setEditPhone(staff.phone);
    setEditRole(staff.role);
    setEditBranch(staff.branch);
    setEditApprovalLimit(staff.approvalLimit);
    setEditIsActive(staff.isActive);
    setErrorMessage(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = dbService.updateUser(editingStaff.id, {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        role: editRole,
        branch: editBranch,
        approvalLimit: editRole === 'administrator' || editRole === 'branch_manager' ? editApprovalLimit : 0,
        isActive: editIsActive,
      });

      setStaffList(dbService.getUsers());
      onStaffUpdated();
      setEditingStaff(null);
      setSuccessMessage(`Updated profile and permissions for ${updated.fullName}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update staff account');
    }
  };

  const handleToggleStatus = (staff: UserProfile) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = dbService.toggleUserStatus(staff.id);
      setStaffList(dbService.getUsers());
      onStaffUpdated();
      setSuccessMessage(
        `Staff account for ${updated.fullName} has been ${updated.isActive ? 'activated' : 'deactivated'}.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to change staff status');
    }
  };

  // If user is not admin, show permission barrier
  if (currentUser.role !== 'administrator') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Staff directory management, role provisioning, and credit authorization limits are restricted exclusively to
            authorized company administrators.
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-2">
          <span className="font-bold text-slate-800 block">Switch to Administrator:</span>
          <p className="text-[11px] text-slate-500">
            Click on your profile at the top right and select <strong>Ibrahim Babalola (Administrator)</strong> to manage staff
            and assign permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Staff & Access Permissions Management</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-700" /> Admin Protected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grateful Relief Program Limited • Provision loan officers, branch supervisors, accountants, and auditors.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setErrorMessage(null);
          }}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-700" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Staff</span>
          <span className="text-2xl font-black text-slate-900">{staffList.length}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {staffList.filter(s => s.isActive).length} active accounts
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Field Loan Officers</span>
          <span className="text-2xl font-black text-emerald-900">
            {staffList.filter(s => s.role === 'loan_officer').length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Daily market collections</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Branch Governance</span>
          <span className="text-2xl font-black text-purple-900">
            {staffList.filter(s => s.role === 'administrator' || s.role === 'branch_manager' || s.role === 'supervisor').length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Maker-Checker approvals</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Audit & Finance</span>
          <span className="text-2xl font-black text-blue-900">
            {staffList.filter(s => s.role === 'auditor' || s.role === 'accountant').length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Reconciliation & compliance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search staff by name, email, phone, branch..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Roles</option>
            <option value="administrator">Administrators</option>
            <option value="loan_officer">Loan Officers</option>
            <option value="branch_manager">Branch Managers</option>
            <option value="supervisor">Supervisors</option>
            <option value="accountant">Accountants</option>
            <option value="auditor">Auditors</option>
          </select>

          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Branches</option>
            <option value="Balogun">Balogun Market</option>
            <option value="Tejuosho">Tejuosho Market</option>
            <option value="Arena">Arena Market</option>
            <option value="Head Office">Head Office</option>
          </select>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role & Permissions</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4 text-right">Approval Limit</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map(staff => {
                const roleConfig = roleLabels[staff.role] || roleLabels.loan_officer;
                const isCurrent = staff.id === currentUser.id;

                return (
                  <tr key={staff.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {staff.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {staff.fullName}
                            {isCurrent && (
                              <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{staff.email}</div>
                          <div className="text-[10px] text-slate-400">{staff.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${roleConfig.badge}`}>
                        {roleConfig.label}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs line-clamp-1">
                        {roleConfig.desc}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{staff.branch}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {staff.approvalLimit > 0 ? formatNaira(staff.approvalLimit) : <span className="text-slate-400 font-normal">₦0.00 (No Approval)</span>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          staff.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {staff.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-700" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-700" /> Inactive
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDateNG(staff.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(staff)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Edit staff details and permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            className={`p-1.5 rounded-lg transition ${
                              staff.isActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={staff.isActive ? 'Deactivate account' : 'Activate account'}
                          >
                            {staff.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        <button
                          onClick={() => onSwitchUser(staff.id)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] transition flex items-center gap-1"
                          title="Switch active user to test permissions"
                        >
                          <span>Switch</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-emerald-900/20 my-6">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Provision New Staff Account</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Babatunde Adeleke"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    placeholder="babatunde.adeleke@gratefulrelief.ng"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Mobile Phone *</label>
                  <input
                    type="tel"
                    placeholder="+234 803 000 0000"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Role & Duties *</label>
                  <select
                    value={newRole}
                    onChange={e => {
                      const r = e.target.value as UserRole;
                      setNewRole(r);
                      if (r === 'administrator') setNewApprovalLimit(5000000);
                      else if (r === 'branch_manager') setNewApprovalLimit(500000);
                      else setNewApprovalLimit(0);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="loan_officer">Loan Officer / Field Collector</option>
                    <option value="administrator">Administrator</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="supervisor">Credit Supervisor</option>
                    <option value="accountant">Accountant</option>
                    <option value="auditor">Internal Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Branch *</label>
                  <select
                    value={newBranch}
                    onChange={e => setNewBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role Explanatory Callout */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-950 block">Permissions Summary:</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {roleLabels[newRole].desc}
                </p>
              </div>

              {(newRole === 'administrator' || newRole === 'branch_manager' || newRole === 'supervisor') && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Approval Limit (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={newApprovalLimit}
                    onChange={e => setNewApprovalLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Maximum facility amount this staff member can authorize under Maker-Checker governance.
                  </p>
                </div>
              )}

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
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Provision Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-900/20 my-6">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Edit Staff Profile & Permissions</h3>
              </div>
              <button onClick={() => setEditingStaff(null)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={editingStaff.email}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden"
                  >
                    <option value="loan_officer">Loan Officer / Field Collector</option>
                    <option value="administrator">Administrator</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="supervisor">Credit Supervisor</option>
                    <option value="accountant">Accountant</option>
                    <option value="auditor">Internal Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Branch</label>
                  <select
                    value={editBranch}
                    onChange={e => setEditBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden"
                  >
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Credit Approval Limit (₦)</label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={editApprovalLimit}
                  onChange={e => setEditApprovalLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={e => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="editIsActive" className="text-slate-800 font-bold">
                  Account Active (Uncheck to suspend login and field collection authorization)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
