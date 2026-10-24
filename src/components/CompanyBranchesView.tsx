import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  Save,
  AlertTriangle,
  Building,
  Store,
  Users,
  Compass,
  FileText,
  X,
  Check,
} from 'lucide-react';
import { dbService } from '../services/db';
import { CompanyProfile, Branch, UserProfile } from '../types';

export const CompanyBranchesView: React.FC = () => {
  const currentUser = dbService.getCurrentUser();
  const isAdmin = currentUser.role === 'administrator';

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(dbService.getCompanyProfile());
  const [branches, setBranches] = useState<Branch[]>(dbService.getBranches());
  const [staffList] = useState<UserProfile[]>(dbService.getUsers());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Company Profile Form State
  const [profileForm, setProfileForm] = useState<CompanyProfile>({ ...companyProfile });
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Branch Modal State
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchSuccessMessage, setBranchSuccessMessage] = useState<string | null>(null);
  const [branchErrorMessage, setBranchErrorMessage] = useState<string | null>(null);

  // Add/Edit Branch Form State
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lagos Island');
  const [state, setState] = useState('Lagos State');
  const [managerId, setManagerId] = useState('');
  const [contactPhone, setContactPhone] = useState('+234 ');
  const [contactEmail, setContactEmail] = useState('');
  const [operatingDays, setOperatingDays] = useState('Monday – Friday (8:00 AM – 5:00 PM)');
  const [branchStatus, setBranchStatus] = useState<'active' | 'inactive'>('active');
  const [targetTraders, setTargetTraders] = useState<number>(200);
  const [branchNotes, setBranchNotes] = useState('');

  // Delete Branch Confirmation
  const [deleteConfirmBranch, setDeleteConfirmBranch] = useState<Branch | null>(null);

  // Handlers for Company Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setProfileErrorMessage('Unauthorized: Only administrators can modify company headquarters details.');
      return;
    }
    setProfileErrorMessage(null);
    setProfileSuccessMessage(null);
    setIsSavingProfile(true);

    try {
      const updated = dbService.updateCompanyProfile(profileForm);
      setCompanyProfile(updated);
      setProfileSuccessMessage('Company location and headquarters profile updated successfully!');
      setTimeout(() => setProfileSuccessMessage(null), 4000);
    } catch (err: any) {
      setProfileErrorMessage(err?.message || 'Failed to update company profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open Add Branch Modal
  const handleOpenAddModal = () => {
    setBranchErrorMessage(null);
    setBranchName('');
    setBranchCode(`GRP-LAG-${Math.random().toString(36).substring(2, 5).toUpperCase()}`);
    setMarketLocation('');
    setAddress('');
    setCity('Lagos Island');
    setState('Lagos State');
    setManagerId('');
    setContactPhone('+234 ');
    setContactEmail('');
    setOperatingDays('Monday – Friday (8:00 AM – 5:00 PM)');
    setBranchStatus('active');
    setTargetTraders(200);
    setBranchNotes('');
    setIsAddBranchModalOpen(true);
  };

  // Open Edit Branch Modal
  const handleOpenEditModal = (branch: Branch) => {
    setBranchErrorMessage(null);
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchCode(branch.code);
    setMarketLocation(branch.marketLocation);
    setAddress(branch.address);
    setCity(branch.city);
    setState(branch.state);
    setManagerId(branch.managerId || '');
    setContactPhone(branch.contactPhone);
    setContactEmail(branch.contactEmail || '');
    setOperatingDays(branch.operatingDays);
    setBranchStatus(branch.status);
    setTargetTraders(branch.targetTradersCount || 200);
    setBranchNotes(branch.notes || '');
    setIsAddBranchModalOpen(true);
  };

  // Save Branch (Create or Update)
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setBranchErrorMessage('Unauthorized: Only administrators can modify branch records.');
      return;
    }
    setBranchErrorMessage(null);

    if (!branchName.trim() || !address.trim() || !contactPhone.trim()) {
      setBranchErrorMessage('Please fill in all required fields (Branch Name, Address, and Contact Phone).');
      return;
    }

    const selectedManager = staffList.find(s => s.id === managerId);

    try {
      if (editingBranch) {
        // Update existing branch
        dbService.updateBranch(editingBranch.id, {
          name: branchName.trim(),
          code: branchCode.trim(),
          marketLocation: marketLocation.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          managerId: managerId || undefined,
          managerName: selectedManager ? selectedManager.fullName : undefined,
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          operatingDays: operatingDays.trim(),
          status: branchStatus,
          targetTradersCount: Number(targetTraders) || 0,
          notes: branchNotes.trim() || undefined,
        });
        setBranchSuccessMessage(`Branch "${branchName}" updated successfully!`);
      } else {
        // Create new branch
        dbService.createBranch({
          name: branchName.trim(),
          code: branchCode.trim(),
          marketLocation: marketLocation.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          managerId: managerId || undefined,
          managerName: selectedManager ? selectedManager.fullName : undefined,
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          operatingDays: operatingDays.trim(),
          status: branchStatus,
          targetTradersCount: Number(targetTraders) || 0,
          notes: branchNotes.trim() || undefined,
        });
        setBranchSuccessMessage(`New branch "${branchName}" created successfully!`);
      }

      setBranches(dbService.getBranches());
      setIsAddBranchModalOpen(false);
      setEditingBranch(null);
      setTimeout(() => setBranchSuccessMessage(null), 4000);
    } catch (err: any) {
      setBranchErrorMessage(err?.message || 'Error processing branch request.');
    }
  };

  // Toggle Branch Active Status
  const handleToggleBranchStatus = (branch: Branch) => {
    if (!isAdmin) return;
    const nextStatus = branch.status === 'active' ? 'inactive' : 'active';
    try {
      dbService.updateBranch(branch.id, { status: nextStatus });
      setBranches(dbService.getBranches());
      setBranchSuccessMessage(`Branch "${branch.name}" is now marked as ${nextStatus}.`);
      setTimeout(() => setBranchSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'Failed to update branch status.');
    }
  };

  // Delete Branch Handler
  const handleDeleteBranch = (branch: Branch) => {
    if (!isAdmin) return;
    const result = dbService.deleteBranch(branch.id);
    if (result.success) {
      setBranches(dbService.getBranches());
      setDeleteConfirmBranch(null);
      setBranchSuccessMessage(result.message);
      setTimeout(() => setBranchSuccessMessage(null), 3500);
    } else {
      alert(result.message);
      setDeleteConfirmBranch(null);
    }
  };

  // Filtering branches
  const filteredBranches = branches.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.marketLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate branch statistics
  const activeCount = branches.filter(b => b.status === 'active').length;
  const totalTradersTarget = branches.reduce((sum, b) => sum + (b.targetTradersCount || 0), 0);
  const allBorrowers = dbService.getBorrowers();
  const allLoans = dbService.getLoans();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              Company Headquarters & Branch Network
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              Administrative Control
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage Grateful Relief Program Limited corporate headquarters address, official contact channels, and market branch offices.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Branch</span>
          </button>
        )}
      </div>

      {/* Status feedback banners */}
      {branchSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{branchSuccessMessage}</span>
        </div>
      )}

      {/* Network Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151e32] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Branches</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {branches.length} <span className="text-xs font-normal text-emerald-600">({activeCount} Active)</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151e32] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-800 dark:text-blue-300">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Headquarters</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
              {companyProfile.city}, {companyProfile.state}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151e32] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-800 dark:text-purple-300">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Market Reach</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              5 Major Hubs
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151e32] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-800 dark:text-amber-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Target Traders</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {totalTradersTarget.toLocaleString()} Traders
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Company Headquarters Profile */}
      <div className="bg-white dark:bg-[#151e32] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Corporate Headquarters & Regulatory Location
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official business registration, physical premises, and compliance address
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Last Updated: {new Date(companyProfile.lastUpdated).toLocaleDateString()}
          </div>
        </div>

        {profileSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{profileSuccessMessage}</span>
          </div>
        )}

        {profileErrorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{profileErrorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={profileForm.companyName}
                onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                CAC Registration (RC Number)
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={profileForm.registrationNumber}
                onChange={e => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={profileForm.taxId || ''}
                onChange={e => setProfileForm({ ...profileForm, taxId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Headquarters Physical Address
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={profileForm.headquartersAddress}
                onChange={e => setProfileForm({ ...profileForm, headquartersAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                placeholder="Street address, building name, floor"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                City / LGA & State
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={profileForm.city}
                  onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                  placeholder="Lagos Island"
                  required
                />
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={profileForm.state}
                  onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                  placeholder="Lagos State"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Phone Contact
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={profileForm.primaryPhone}
                onChange={e => setProfileForm({ ...profileForm, primaryPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Corporate Email
              </label>
              <input
                type="email"
                disabled={!isAdmin}
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={profileForm.operatingHours}
                onChange={e => setProfileForm({ ...profileForm, operatingHours: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Google Maps Navigation
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={profileForm.googleMapsUrl || ''}
                  onChange={e => setProfileForm({ ...profileForm, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                />
                {profileForm.googleMapsUrl && (
                  <a
                    href={profileForm.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0"
                    title="Open in Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Headquarters Location Profile'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* SECTION 2: Branch Network Management */}
      <div className="bg-white dark:bg-[#151e32] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Branch Offices & Market Locations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Field operational centers, market cluster hubs, and branch manager allocations
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search branches, markets..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="all">All Statuses ({branches.length})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="inactive">Inactive Only ({branches.length - activeCount})</option>
            </select>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map(branch => {
            const branchBorrowers = allBorrowers.filter(b => b.branch === branch.name);
            const branchLoans = allLoans.filter(l => l.branch === branch.name);
            const activeLoansCount = branchLoans.filter(l => l.status === 'active').length;

            return (
              <div
                key={branch.id}
                className="bg-slate-50 dark:bg-[#1a2438] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {branch.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {branch.name}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        branch.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          branch.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span className="capitalize">{branch.status}</span>
                    </span>
                  </div>

                  {/* Market Location Tag */}
                  <div className="flex items-start gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <Store className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{branch.marketLocation}</span>
                  </div>

                  {/* Address & City */}
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{branch.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono">{branch.contactPhone}</span>
                    </div>

                    {branch.managerName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Manager: <strong>{branch.managerName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Branch Metrics & Quick Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Borrowers: <strong>{branchBorrowers.length}</strong></span>
                    <span>Active Loans: <strong>{activeLoansCount}</strong></span>
                    <span>Target: <strong>{branch.targetTradersCount || 0}</strong></span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => handleToggleBranchStatus(branch)}
                        className={`text-[11px] px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                          branch.status === 'active'
                            ? 'text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        {branch.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(branch)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                          title="Edit Branch"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmBranch(branch)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredBranches.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Building className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No branches match your current search.</p>
            <p className="text-xs">Try clearing filters or add a new branch above.</p>
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Branch */}
      {isAddBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151e32] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingBranch ? 'Edit Branch Location' : 'Register New Branch'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure market branch & management details</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddBranchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {branchErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{branchErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveBranch} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={e => setBranchName(e.target.value)}
                    placeholder="e.g. Surulere (Ojuelegba Market)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    value={branchCode}
                    onChange={e => setBranchCode(e.target.value)}
                    placeholder="GRP-LAG-SRL"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Market Hub Coverage *
                </label>
                <input
                  type="text"
                  value={marketLocation}
                  onChange={e => setMarketLocation(e.target.value)}
                  placeholder="e.g. Ojuelegba Market & Lawanson Commercial Hub"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Office Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Shop number, plaza, street, landmark"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City / LGA
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Manager
                  </label>
                  <select
                    value={managerId}
                    onChange={e => setManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">-- Assign Later --</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.fullName} ({staff.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="branch@gratefulrelief.ng"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Trader Membership Target
                  </label>
                  <input
                    type="number"
                    value={targetTraders}
                    onChange={e => setTargetTraders(Number(e.target.value))}
                    min={10}
                    max={5000}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1a2438] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Operating Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={branchStatus === 'active'}
                      onChange={() => setBranchStatus('active')}
                      className="text-emerald-800 focus:ring-emerald-500"
                    />
                    <span>Active (Accepts Borrowers & Daily Collections)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={branchStatus === 'inactive'}
                      onChange={() => setBranchStatus('inactive')}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <span>Inactive (Under Renovation or Paused)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBranchModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  {editingBranch ? 'Update Branch Location' : 'Save New Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Branch Confirmation */}
      {deleteConfirmBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151e32] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete Branch Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to permanently delete <strong>{deleteConfirmBranch.name}</strong> ({deleteConfirmBranch.code})?
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 text-left">
              Note: The system prevents deletion if loans or registered borrowers are actively linked to this branch.
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmBranch(null)}
                className="flex-1 py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBranch(deleteConfirmBranch)}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
