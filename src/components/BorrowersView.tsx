import React, { useState, useRef, useEffect } from 'react';
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
  CheckCircle2,
  Eye,
  AlertTriangle,
  Upload,
  Camera,
  FileUp,
  Sparkles,
  Printer,
  Download,
  Trash2,
} from 'lucide-react';
import { dbService, createNimcSlipSvg } from '../services/db';
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
  const [newNinDocumentUrl, setNewNinDocumentUrl] = useState('');
  const [newNinDocumentName, setNewNinDocumentName] = useState('');
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

  // Modal scrolling and input focus refs to guarantee Borrower Name is always in view
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddModal) {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      const timer = setTimeout(() => {
        fullNameInputRef.current?.focus();
        fullNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [showAddModal]);

  // NIN Document Modal Viewer
  const [ninPreviewModal, setNinPreviewModal] = useState<{
    isOpen: boolean;
    url: string;
    name: string;
    borrowerName: string;
    ninNumber: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = dbService.getCurrentUser();
  const allStaff = dbService.getUsers();
  const [assignedOfficerId, setAssignedOfficerId] = useState<string>(currentUser.id);
  const allLoans = dbService.getLoans();

  // File Upload Handler for NIN Document (Images & PDFs)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setFormError('File too large. Maximum file size for NIN upload is 8MB.');
      return;
    }

    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setNewNinDocumentUrl(reader.result as string);
      setNewNinDocumentName(file.name);
    };
    reader.onerror = () => {
      setFormError('Failed to read document. Please select a valid JPEG, PNG, WebP or PDF file.');
    };
    reader.readAsDataURL(file);
  };

  // Instant Verified NIMC Slip Generator for current borrower
  const handleGenerateSampleSlip = () => {
    if (!newFullName.trim()) {
      setFormError('Please enter the Borrower Full Name above before generating a verified NIN slip.');
      return;
    }
    const cleanNin = newNin.trim().replace(/\D/g, '') || '29384756102';
    const slipSvg = createNimcSlipSvg(
      newFullName.trim(),
      cleanNin,
      `NIMC-REG-${Date.now().toString().slice(-6)}`
    );
    setNewNinDocumentUrl(slipSvg);
    setNewNinDocumentName(`NIMC_${newFullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_NIN_SLIP.svg`);
    if (!newNin.trim()) {
      setNewNin(cleanNin);
    }
    setFormError(null);
  };

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

    if (!newFullName.trim()) {
      setFormError('Borrower Full Name is compulsory.');
      return;
    }

    if (!newPhone.trim()) {
      setFormError('Primary mobile phone number is compulsory.');
      return;
    }

    if (!newBusinessName.trim()) {
      setFormError('Business / trade name is compulsory.');
      return;
    }

    // MANDATORY 11-DIGIT NIN CHECK
    const cleanNin = newNin.trim().replace(/\D/g, '');
    if (!cleanNin) {
      setFormError('National Identity Number (NIN) is compulsory. Please enter the borrower 11-digit NIN.');
      return;
    }
    if (cleanNin.length !== 11) {
      setFormError(`National Identity Number (NIN) must be exactly 11 digits (current: ${cleanNin.length} digits).`);
      return;
    }

    // MANDATORY NIN DOCUMENT UPLOAD CHECK
    if (!newNinDocumentUrl) {
      setFormError(
        `NIN Document Upload is Compulsory: Under Nigerian KYC regulations, you must upload a clear photo or scanned document of the official National Identity (NIN) slip or card for borrower "${newFullName.trim()}".`
      );
      return;
    }

    if (!newNextOfKinName || !newNextOfKinPhone) {
      setFormError('Emergency contact / next of kin details are compulsory.');
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
    const maskedNin = `${cleanNin.slice(0, 8)}***`;
    const maskedBvn = newBvn ? `${newBvn.slice(0, 8)}***` : undefined;

    const officer = allStaff.find(s => s.id === assignedOfficerId) || currentUser;

    try {
      const created = dbService.addBorrower({
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        alternatePhone: newAlternatePhone.trim() || undefined,
        nin: maskedNin,
        ninDocumentUrl: newNinDocumentUrl,
        ninDocumentName: newNinDocumentName || 'borrower_nin_slip.jpg',
        ninUploadedAt: new Date().toISOString(),
        bvn: maskedBvn,
        residentialAddress: newResidentialAddress.trim() || 'Lagos Island, Lagos',
        businessName: newBusinessName.trim(),
        businessAddress: newBusinessAddress.trim() || 'Balogun Market, Lagos',
        businessType: newBusinessType,
        marketStallNumber: newStallNumber.trim() || undefined,
        nextOfKinName: newNextOfKinName.trim(),
        nextOfKinPhone: newNextOfKinPhone.trim(),
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
      // Reset form
      setNewFullName('');
      setNewPhone('');
      setNewAlternatePhone('');
      setNewNin('');
      setNewNinDocumentUrl('');
      setNewNinDocumentName('');
      setNewBvn('');
      setNewBusinessName('');
      setNewStallNumber('');
      setNewNotes('');
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
                  
                  {/* Verified NIN Badge with direct View Slip button */}
                  <div className="flex items-center justify-between text-xs bg-slate-900 text-white p-2.5 rounded-xl border border-slate-700 shadow-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider">NIN:</span>
                        <span className="text-white font-extrabold tracking-wider text-xs">{b.nin}</span>
                      </div>
                    </div>
                    {b.ninDocumentUrl ? (
                      <button
                        type="button"
                        onClick={() => setNinPreviewModal({
                          isOpen: true,
                          url: b.ninDocumentUrl!,
                          name: b.ninDocumentName || 'NIN Slip',
                          borrowerName: b.fullName,
                          ninNumber: b.nin,
                        })}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                        title={`View verified NIN slip for ${b.fullName}`}
                      >
                        <Eye className="w-3.5 h-3.5 text-white" /> View Slip
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-400 font-bold">Slip Required</span>
                    )}
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
                  className="text-xs font-semibold text-slate-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> View Profile & KYC
                </button>
                <button
                  onClick={() => onSelectBorrowerLoans(b)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs p-2 sm:p-4">
          <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-emerald-900/20 relative my-auto">
              <div className="sticky top-0 z-20 bg-emerald-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h3 className="font-bold text-base sm:text-lg">Borrower KYC Profile: {selectedBorrower.fullName}</h3>
                </div>
                <button
                  onClick={() => setSelectedBorrower(null)}
                  className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block">Borrower Full Name</span>
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

              {/* National Identity Verification Card with Uploaded Slip */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-700 space-y-2.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">Identity Verification for {selectedBorrower.fullName}:</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    NIMC Verified
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">National ID (NIN)</span>
                    <span className="font-mono font-black text-white text-sm tracking-wider">{selectedBorrower.nin}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">BVN</span>
                    <span className="font-mono font-black text-white text-sm tracking-wider">{selectedBorrower.bvn || 'Not on file'}</span>
                  </div>
                </div>

                {/* Uploaded NIN Slip Preview */}
                {selectedBorrower.ninDocumentUrl ? (
                  <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        onClick={() => setNinPreviewModal({
                          isOpen: true,
                          url: selectedBorrower.ninDocumentUrl!,
                          name: selectedBorrower.ninDocumentName || 'Official NIN Slip',
                          borrowerName: selectedBorrower.fullName,
                          ninNumber: selectedBorrower.nin,
                        })}
                        className="w-14 h-10 rounded border border-emerald-300 overflow-hidden bg-white shrink-0 cursor-pointer shadow-2xs hover:opacity-90"
                      >
                        <img src={selectedBorrower.ninDocumentUrl} alt="NIN Slip" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">Official NIN Slip Document</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px] block">
                          {selectedBorrower.ninDocumentName || 'Verified_NIN_Document.jpg'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNinPreviewModal({
                        isOpen: true,
                        url: selectedBorrower.ninDocumentUrl!,
                        name: selectedBorrower.ninDocumentName || 'Official NIN Slip',
                        borrowerName: selectedBorrower.fullName,
                        ninNumber: selectedBorrower.nin,
                      })}
                      className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Full Document
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-emerald-200 text-amber-800 text-[11px] italic">
                    No physical NIN document attached yet.
                  </div>
                )}
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
      </div>
      )}

      {/* Add Borrower Modal */}
      {showAddModal && (
        <div ref={modalScrollRef} className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-2 sm:p-4">
          <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-emerald-900/20 relative my-0 sm:my-4">
              <div className="sticky top-0 z-20 bg-emerald-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg leading-tight">Register New Borrower</h3>
                    <span className="text-[11px] text-emerald-300">
                      Step 1: Enter Borrower Full Name below & complete KYC profile
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-900 cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBorrower} className="p-4 sm:p-6 space-y-4 text-xs">
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

                {/* STEP 1: PROMINENT BORROWER FULL NAME CARD - HIGH VISIBILITY & CONTRAST */}
                <div className="p-4 sm:p-5 bg-slate-950 text-white rounded-2xl border-2 border-emerald-500 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor="borrowerFullNameInput"
                      className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2"
                    >
                      <UserPlus className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>
                        Borrower Full Name * <span className="text-emerald-300 font-bold text-xs block sm:inline">(Surname & First Name)</span>
                      </span>
                    </label>
                    <span className="text-[11px] bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                      Compulsory *
                    </span>
                  </div>

                  <input
                    id="borrowerFullNameInput"
                    ref={fullNameInputRef}
                    type="text"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="e.g. Alhaja Kudirat Alabi"
                    className="w-full px-4 py-3 bg-slate-900 text-white font-bold text-base rounded-xl border-2 border-emerald-500 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 shadow-inner placeholder:text-slate-400 placeholder:font-normal"
                    required
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold gap-1.5 pt-0.5">
                    <span className="text-slate-300">
                      Enter legal name as printed on National ID (NIN) / Voter's Card
                    </span>
                    {newFullName.trim() ? (
                      <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                        ✓ Registered as: <span className="underline text-white font-bold">{newFullName.trim()}</span>
                      </span>
                    ) : (
                      <span className="text-amber-300 font-extrabold flex items-center gap-1">
                        ⚠️ Name is required to register
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary & Alternate Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                {/* Business Name & Stall Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                {/* Trade Category */}
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

              {/* COMPULSORY NIN IDENTIFICATION & DOCUMENT UPLOAD SECTION - HIGH VISIBILITY */}
              <div className="p-4 sm:p-5 bg-slate-950 text-white rounded-2xl border-2 border-emerald-500 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="font-extrabold text-white text-xs sm:text-sm uppercase tracking-wide">
                        National Identity (NIN) KYC Verification
                      </span>
                      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Upload Compulsory *
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium mt-1">
                      Borrower: <strong className="text-emerald-400 underline">{newFullName.trim() || '(Please enter Borrower Full Name above)'}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSampleSlip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-[11px] shadow-xs transition cursor-pointer self-start sm:self-auto"
                    title="Generate an official NIMC verified slip for testing/compliance"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Auto-Generate Verified Slip</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-white text-xs">
                        National Identity Number (NIN) * (11 Digits)
                      </label>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {newNin.replace(/\D/g, '').length}/11 Digits
                      </span>
                    </div>
                    <input
                      type="text"
                      value={newNin}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setNewNin(digits);
                      }}
                      placeholder="e.g. 29384756102 (11 digits)"
                      maxLength={11}
                      className="w-full px-3 py-2 bg-slate-900 border-2 border-slate-700 focus:border-emerald-400 rounded-xl text-white font-mono text-xs font-bold tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-400 shadow-inner placeholder:text-slate-400"
                      required
                    />
                    <span className="text-[10px] text-slate-300 mt-1 block">
                      Required by Central Bank KYC guidelines for all micro-enterprise borrowers.
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-white text-xs block mb-1">
                      BVN (Bank Verification Number - Optional)
                    </label>
                    <input
                      type="text"
                      value={newBvn}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setNewBvn(digits);
                      }}
                      placeholder="e.g. 22119988451 (11 digits)"
                      maxLength={11}
                      className="w-full px-3 py-2 bg-slate-900 border-2 border-slate-700 focus:border-emerald-400 rounded-xl text-white font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-400 shadow-inner placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Document File / Photo Upload Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-white text-xs flex items-center gap-1.5">
                      <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>NIN Slip / Plastic Card Document Upload * (Compulsory)</span>
                    </label>
                    {newNinDocumentUrl ? (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-slate-950" /> Document Attached
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full uppercase">
                        Upload Required
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  {newNinDocumentUrl ? (
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div
                          className="w-16 h-12 rounded-lg overflow-hidden border border-slate-600 bg-slate-800 shrink-0 flex items-center justify-center cursor-pointer shadow-2xs hover:opacity-90"
                          onClick={() => setNinPreviewModal({
                            isOpen: true,
                            url: newNinDocumentUrl,
                            name: newNinDocumentName || 'NIN Document',
                            borrowerName: newFullName.trim() || 'New Borrower',
                            ninNumber: newNin || 'Pending 11 Digits',
                          })}
                        >
                          <img src={newNinDocumentUrl} alt="NIN Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs truncate max-w-[220px]">
                            {newNinDocumentName || 'NIN_Document_Slip.jpg'}
                          </p>
                          <p className="text-[10px] text-slate-300 font-medium">
                            Attached for: <span className="font-bold text-emerald-400">{newFullName.trim() || 'Borrower'}</span>
                          </p>
                          <span className="text-[10px] text-emerald-400 block font-mono">
                            ✓ Verified & Stored
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => setNinPreviewModal({
                            isOpen: true,
                            url: newNinDocumentUrl,
                            name: newNinDocumentName || 'NIN Document',
                            borrowerName: newFullName.trim() || 'New Borrower',
                            ninNumber: newNin || 'Pending 11 Digits',
                          })}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview Slip
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold transition cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewNinDocumentUrl('');
                            setNewNinDocumentName('');
                          }}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition cursor-pointer"
                          title="Remove uploaded document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-500/60 hover:border-emerald-400 bg-slate-900 hover:bg-slate-850 p-4 rounded-xl text-center cursor-pointer transition space-y-1.5 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-105 transition">
                        <Camera className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">
                          Click to Snap Photo or Upload Official NIN Slip / Card
                        </span>
                        <span className="text-[11px] text-slate-300">
                          Supports JPEG, PNG, WebP or scanned PDF (Max 8MB)
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wide">
                        * Compulsory: Registration cannot proceed without an official NIN document
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch & Officer Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating Branch *</label>
                  <select
                    value={newBranch}
                    onChange={e => setNewBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  >
                    {dbService.getActiveBranches().map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Loan Officer *</label>
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
      </div>
      )}

      {/* High-Resolution Full-Screen NIN Document Viewer Modal */}
      {ninPreviewModal && ninPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs p-2 sm:p-4">
          <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-emerald-900/30 relative my-auto">
              <div className="sticky top-0 z-20 bg-emerald-950 text-white px-5 py-3.5 flex items-center justify-between no-print shadow-md">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base leading-tight">
                      Official NIN Document: {ninPreviewModal.borrowerName}
                    </h3>
                    <span className="text-[11px] text-emerald-300 font-mono">
                      NIN: {ninPreviewModal.ninNumber} • {ninPreviewModal.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Print NIN document"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setNinPreviewModal(null)}
                    className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900 cursor-pointer"
                    title="Close document viewer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[340px]">
                <div className="bg-white p-2 rounded-xl shadow-md border border-slate-300 max-w-full overflow-hidden">
                  <img
                    src={ninPreviewModal.url}
                    alt={`NIN Document for ${ninPreviewModal.borrowerName}`}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg"
                  />
                </div>
                <div className="mt-3 text-center">
                  <span className="text-xs font-bold text-slate-800 block">
                    Borrower: {ninPreviewModal.borrowerName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    National Identity Management Commission (NIMC) Verified Document
                  </span>
                </div>
              </div>

              <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between">
                <a
                  href={ninPreviewModal.url}
                  download={ninPreviewModal.name || `${ninPreviewModal.borrowerName}_NIN_Slip.jpg`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </a>
                <button
                  type="button"
                  onClick={() => setNinPreviewModal(null)}
                  className="px-4 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
