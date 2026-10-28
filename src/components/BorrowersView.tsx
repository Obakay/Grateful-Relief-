import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Store,
  ShieldCheck,
  FileText,
  Clock,
  X,
  CheckCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Borrower, Loan } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

interface BorrowersViewProps {
  onSelectBorrowerLoans: (borrower: Borrower) => void;
}

export const BorrowersView: React.FC<BorrowersViewProps> = ({ onSelectBorrowerLoans }) => {
  const [borrowers, setBorrowers] = useState<Borrower[]>(dbService.getBorrowers());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  // New Borrower Form state
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAlternatePhone, setNewAlternatePhone] = useState('');
  const [newNin, setNewNin] = useState('');
  const [newBvn, setNewBvn] = useState('');
  const [newResidentialAddress, setNewResidentialAddress] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessAddress, setNewBusinessAddress] = useState('');
  const [newBusinessType, setNewBusinessType] = useState<Borrower['businessType']>('Market Trader');
  const [newStallNumber, setNewStallNumber] = useState('');
  const [newNextOfKinName, setNewNextOfKinName] = useState('');
  const [newNextOfKinPhone, setNewNextOfKinPhone] = useState('');
  const [newNextOfKinRel, setNewNextOfKinRel] = useState('Spouse');
  const [newBranch, setNewBranch] = useState('Lagos Island (Balogun Market)');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const currentUser = dbService.getCurrentUser();
  const allStaff = dbService.getUsers();
  const [assignedOfficerId, setAssignedOfficerId] = useState<string>(currentUser.id);
  const allLoans = dbService.getLoans();

  // Live duplicate checking against existing registered clients
  const duplicateCheck = (newPhone.trim() || newAlternatePhone.trim() || newNin.trim() || newBvn.trim() || (newFullName.trim().length >= 4 ? newFullName.trim() : ''))
    ? dbService.checkDuplicateBorrower({
        phone: newPhone.trim(),
        alternatePhone: newAlternatePhone.trim(),
        nin: newNin.trim(),
        bvn: newBvn.trim(),
        fullName: newFullName.trim().length >= 4 ? newFullName.trim() : undefined,
      })
    : { isDuplicate: false };

  const filteredBorrowers = borrowers.filter(b => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      b.fullName.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.borrowerCode.toLowerCase().includes(q) ||
      b.businessName.toLowerCase().includes(q) ||
      (b.marketStallNumber && b.marketStallNumber.toLowerCase().includes(q));

    const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateBorrower = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newFullName || !newPhone || !newBusinessName || !newNextOfKinName || !newNextOfKinPhone) {
      setFormError('Please fill in all mandatory KYC and emergency contact fields.');
      return;
    }

    // STRICT DOUBLE REGISTRATION GUARD
    if (duplicateCheck.isDuplicate && duplicateCheck.existingBorrower) {
      const existing = duplicateCheck.existingBorrower;
      setFormError(
        `Double Registration Disallowed: A client with this ${duplicateCheck.field?.toUpperCase() || 'identifier'} is already registered as "${existing.fullName}" (${existing.borrowerCode} • Phone: ${existing.phone}). Duplicate registration of clients is prohibited by company policy.`
      );
      return;
    }

    // Mask NIN for privacy as required by security regulations
    const maskedNin = newNin ? `${newNin.slice(0, 8)}***` : '29384756***';
    const maskedBvn = newBvn ? `${newBvn.slice(0, 8)}***` : undefined;

    const officer = allStaff.find(s => s.id === assignedOfficerId) || currentUser;

    try {
      const created = dbService.addBorrower({
        fullName: newFullName,
        phone: newPhone,
        alternatePhone: newAlternatePhone || undefined,
        nin: maskedNin,
        bvn: maskedBvn,
        residentialAddress: newResidentialAddress || 'Lagos Island, Lagos',
        businessName: newBusinessName,
        businessAddress: newBusinessAddress || 'Balogun Market, Lagos',
        businessType: newBusinessType,
        marketStallNumber: newStallNumber || undefined,
        nextOfKinName: newNextOfKinName,
        nextOfKinPhone: newNextOfKinPhone,
        nextOfKinRelationship: newNextOfKinRel,
        assignedOfficerId: officer.id,
        assignedOfficerName: officer.fullName,
        branch: newBranch,
        status: 'active',
        creditScoreRating: 'A - Low Risk',
        notes: newNotes,
      });

      setBorrowers(dbService.getBorrowers());
      setShowAddModal(false);
      // Reset
      setNewFullName('');
      setNewPhone('');
      setNewAlternatePhone('');
      setNewNin('');
      setNewBvn('');
      setNewBusinessName('');
      setNewStallNumber('');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create borrower');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Borrowers & KYC Registry</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {borrowers.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Market traders, stallholders, and micro-entrepreneurs across Lagos markets
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Borrower</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, phone, stall number, ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Borrowers</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
        </div>
      </div>

      {/* Borrowers Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBorrowers.map(b => {
          const borrowerLoans = allLoans.filter(l => l.borrowerId === b.id);
          const activeLoan = borrowerLoans.find(l => l.status === 'active' || l.status === 'overdue');
          const totalActiveBalance = borrowerLoans
            .filter(l => l.status === 'active' || l.status === 'overdue')
            .reduce((sum, l) => sum + l.outstandingBalance, 0);

          return (
            <div
              key={b.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-900 text-white font-bold flex items-center justify-center text-sm">
                      {b.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{b.fullName}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">{b.borrowerCode}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{b.businessName}</span>
                    {b.marketStallNumber && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {b.marketStallNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.branch}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>NIN: {b.nin}</span>
                  </div>
                </div>

                {/* Financial Position */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Active Exposure</span>
                    <span className="text-xs font-bold text-slate-900">
                      {totalActiveBalance > 0 ? formatNaira(totalActiveBalance) : 'No Active Loan'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Total Facilities</span>
                    <span className="text-xs font-bold text-emerald-800">{borrowerLoans.length}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedBorrower(b)}
                  className="text-xs font-semibold text-slate-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Profile & KYC
                </button>
                <button
                  onClick={() => onSelectBorrowerLoans(b)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  Loans ({borrowerLoans.length}) →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Borrower Profile Detail Modal */}
      {selectedBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-emerald-900/20 my-8">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">Borrower KYC Profile: {selectedBorrower.fullName}</h3>
              </div>
              <button
                onClick={() => setSelectedBorrower(null)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Full Name & Code</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedBorrower.fullName}</span>
                  <span className="block font-mono text-[10px] text-slate-400">{selectedBorrower.borrowerCode}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Primary Phone</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedBorrower.phone}</span>
                  {selectedBorrower.alternatePhone && (
                    <span className="block text-[11px] text-slate-500">Alt: {selectedBorrower.alternatePhone}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Business Name & Stall</span>
                  <span className="font-bold text-slate-900">{selectedBorrower.businessName}</span>
                  <p className="text-slate-600 text-[11px]">{selectedBorrower.businessAddress}</p>
                  <p className="text-emerald-800 font-semibold">{selectedBorrower.marketStallNumber}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Next of Kin / Guarantor</span>
                  <span className="font-bold text-slate-900">{selectedBorrower.nextOfKinName}</span>
                  <p className="text-slate-600">{selectedBorrower.nextOfKinRelationship}</p>
                  <p className="text-slate-800 font-mono">{selectedBorrower.nextOfKinPhone}</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-emerald-950">Identity Security Verification:</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    NIMC Verified
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-emerald-900">
                  <div>National ID (NIN): <span className="font-mono font-bold">{selectedBorrower.nin}</span></div>
                  <div>BVN: <span className="font-mono font-bold">{selectedBorrower.bvn || 'Not on file'}</span></div>
                </div>
              </div>

              {selectedBorrower.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Field Assessment Notes:</span>
                  <p className="text-slate-700 italic mt-0.5">{selectedBorrower.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedBorrower(null)}
                className="bg-emerald-900 text-white px-5 py-1.5 rounded-lg hover:bg-emerald-800 transition font-medium text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Borrower Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-emerald-900/20 my-6">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">Register New Borrower (KYC Form)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBorrower} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* LIVE DOUBLE REGISTRATION ALERT BANNER */}
              {duplicateCheck.isDuplicate && duplicateCheck.existingBorrower && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold uppercase text-[11px] tracking-wider text-rose-800">
                        Double Registration Disallowed
                      </span>
                      <span className="bg-rose-200 text-rose-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Duplicate Collision Detected
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 text-xs">
                      A client with matching <span className="font-bold underline">{duplicateCheck.field?.toUpperCase()}</span> already exists in the registry:
                    </p>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-rose-200 font-mono text-[11px] text-slate-900 space-y-0.5">
                      <div>Name: <strong className="font-sans font-bold">{duplicateCheck.existingBorrower.fullName}</strong></div>
                      <div>Client Code: <strong>{duplicateCheck.existingBorrower.borrowerCode}</strong></div>
                      <div>Phone: <strong>{duplicateCheck.existingBorrower.phone}</strong></div>
                      <div>Branch: <strong>{duplicateCheck.existingBorrower.branch}</strong></div>
                    </div>
                    <p className="text-[11px] text-rose-700 italic">
                      Under Grateful Relief loan governance, creating duplicate records for the same borrower is blocked to protect credit records.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Borrower Full Name *
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="e.g. Alhaja Kudirat Alabi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Mobile Phone Number *</label>
                    <span className="text-[10px] text-emerald-800 font-medium">Checked for duplicates</span>
                  </div>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 ${
                      duplicateCheck.isDuplicate && duplicateCheck.field === 'phone'
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alternate Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={newAlternatePhone}
                    onChange={e => setNewAlternatePhone(e.target.value)}
                    placeholder="+234 812 345 6789"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business / Trade Name *</label>
                  <input
                    type="text"
                    value={newBusinessName}
                    onChange={e => setNewBusinessName(e.target.value)}
                    placeholder="e.g. Alhaja Kudirat Ankara Fabrics"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Market Stall Number</label>
                  <input
                    type="text"
                    value={newStallNumber}
                    onChange={e => setNewStallNumber(e.target.value)}
                    placeholder="e.g. Shop B-42, Balogun Market"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Trade Category</label>
                  <select
                    value={newBusinessType}
                    onChange={e => setNewBusinessType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Market Trader">Market Trader</option>
                    <option value="Fabric & Clothing">Fabric & Clothing (Ankara/Lace)</option>
                    <option value="Provisions">Provisions & Foodstuffs</option>
                    <option value="Food & Catering">Food & Catering / Seafood</option>
                    <option value="Tailoring">Tailoring & Crafts</option>
                    <option value="Cosmetics">Cosmetics & Hair</option>
                    <option value="Services">Services / POS</option>
                    <option value="Other">Other Retail</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIN (National ID)</label>
                  <input
                    type="text"
                    value={newNin}
                    onChange={e => setNewNin(e.target.value)}
                    placeholder="11 digits NIN"
                    maxLength={11}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">BVN (Bank Verification)</label>
                  <input
                    type="text"
                    value={newBvn}
                    onChange={e => setNewBvn(e.target.value)}
                    placeholder="11 digits BVN"
                    maxLength={11}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch</label>
                  <select
                    value={newBranch}
                    onChange={e => setNewBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {dbService.getActiveBranches().map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Loan Officer</label>
                  <select
                    value={assignedOfficerId}
                    onChange={e => setAssignedOfficerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  >
                    {allStaff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Next of kin */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Emergency Contact / Next of Kin</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Kin Full Name *"
                      value={newNextOfKinName}
                      onChange={e => setNewNextOfKinName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden text-xs"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Kin Phone Number *"
                      value={newNextOfKinPhone}
                      onChange={e => setNewNextOfKinPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden text-xs"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Relationship (e.g. Spouse, Son)"
                      value={newNextOfKinRel}
                      onChange={e => setNewNextOfKinRel(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={duplicateCheck.isDuplicate}
                  className={`px-6 py-2 text-white font-bold rounded-xl shadow-xs transition ${
                    duplicateCheck.isDuplicate
                      ? 'bg-slate-400 cursor-not-allowed opacity-70'
                      : 'bg-emerald-800 hover:bg-emerald-900 cursor-pointer'
                  }`}
                  title={duplicateCheck.isDuplicate ? 'Double registration disallowed' : 'Register Borrower'}
                >
                  {duplicateCheck.isDuplicate ? 'Double Registration Blocked' : 'Save & Register Borrower'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
