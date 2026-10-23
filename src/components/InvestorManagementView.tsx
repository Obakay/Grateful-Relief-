import React, { useState } from 'react';
import {
  PieChart,
  PlusCircle,
  DollarSign,
  TrendingUp,
  FileCheck2,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Investor, InvestorDistribution } from '../types';
import { formatNaira, formatDateNG } from '../services/loanCalculator';

export const InvestorManagementView: React.FC = () => {
  const currentUser = dbService.getCurrentUser();
  const [investors, setInvestors] = useState<Investor[]>(dbService.getInvestors());
  const [distributions, setDistributions] = useState<InvestorDistribution[]>(dbService.getDistributions());
  const metrics = dbService.getDashboardMetrics();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

  // New investor form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [capital, setCapital] = useState<number>(2000000);
  const [profitShare, setProfitShare] = useState<number>(15);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState('2027-10-24');

  // Distribution form
  const [distPeriod, setDistPeriod] = useState('October 2026');
  const [distRef, setDistRef] = useState(`NIP-DIV-${Date.now().toString().slice(-6)}`);

  const totalCapital = investors.reduce((sum, i) => sum + i.totalCapitalInvested, 0);

  const handleAddInvestor = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'administrator') return;

    dbService.addInvestor({
      fullName,
      phone,
      email,
      totalCapitalInvested: capital,
      currentCapitalBalance: capital,
      profitSharePercentage: profitShare,
      agreementStartDate: startDate,
      maturityDate,
      withdrawalNoticeDays: 60,
      status: 'active',
    });

    setInvestors(dbService.getInvestors());
    setShowAddModal(false);
  };

  const handleCreateDistribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor) return;

    dbService.recordDistribution({
      investorId: selectedInvestor.id,
      periodLabel: distPeriod,
      netProfitBasis: Math.max(0, metrics.netRealizedLendingIncome),
      paymentReference: distRef,
    });

    setInvestors(dbService.getInvestors());
    setDistributions(dbService.getDistributions());
    setShowDistModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Investor Capital & Profit Sharing</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Capital Segregation Enforced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track private capital contributions, agreed net profit sharing terms, and dividend distributions.
          </p>
        </div>

        {currentUser.role === 'administrator' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Onboard New Investor</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Investor Capital</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{formatNaira(totalCapital)}</div>
          <span className="text-[11px] text-slate-500">Separated from company revenue</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Net Realized Profit Pool</span>
          <div className="text-2xl font-black text-emerald-900 mt-2">
            {formatNaira(metrics.netRealizedLendingIncome)}
          </div>
          <span className="text-[11px] text-slate-500">Distribution calculation basis</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Active Capital Partners</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{investors.length} Investors</div>
          <span className="text-[11px] text-slate-500">Agreements in good standing</span>
        </div>
      </div>

      {/* Investors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investors.map(inv => (
          <div
            key={inv.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    {inv.investorCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{inv.fullName}</h3>
                  <p className="text-xs text-slate-500">{inv.email} • {inv.phone}</p>
                </div>
                <span className="bg-emerald-50 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                  {inv.status}
                </span>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Principal Capital:</span>
                  <span className="font-bold font-mono text-slate-900">{formatNaira(inv.totalCapitalInvested)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Agreed Net Profit Share:</span>
                  <span className="font-bold text-emerald-800">{inv.profitSharePercentage}% of Net Lending Profit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tenor:</span>
                  <span>{formatDateNG(inv.agreementStartDate)} to {formatDateNG(inv.maturityDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Distributions Paid:</span>
                  <span className="font-bold font-mono text-emerald-900">{formatNaira(inv.totalDistributionsPaid)}</span>
                </div>
              </div>
            </div>

            {currentUser.role === 'administrator' && (
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedInvestor(inv);
                    setShowDistModal(true);
                  }}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs"
                >
                  Calculate & Payout Distribution
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Distributions History */}
      {distributions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Profit Share Distribution Payout History</h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Distribution Ref</th>
                  <th className="py-2.5 px-3">Investor</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3 text-right">Net Profit Pool</th>
                  <th className="py-2.5 px-3 text-center">Share %</th>
                  <th className="py-2.5 px-3 text-right">Payout Sum</th>
                  <th className="py-2.5 px-3">Bank Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {distributions.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.distributionCode}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{d.investorName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{d.periodLabel}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatNaira(d.netProfitBasis)}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-800">{d.sharePercentage}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900">{formatNaira(d.distributionAmount)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{d.paymentReference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribution Modal */}
      {showDistModal && selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-900/20 my-8">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Calculate Profit Distribution</h3>
              <button onClick={() => setShowDistModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDistribution} className="p-6 space-y-4 text-xs font-sans">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-950 block">{selectedInvestor.fullName}</span>
                <p className="text-emerald-800">
                  Agreed Rate: {selectedInvestor.profitSharePercentage}% of verified Net Realized Lending Income
                </p>
                <div className="mt-2 text-slate-700">
                  Current Net Realized Profit Pool: <strong>{formatNaira(metrics.netRealizedLendingIncome)}</strong>
                </div>
                <div className="mt-1 text-base font-black text-emerald-950">
                  Calculated Payout: {formatNaira(metrics.netRealizedLendingIncome * (selectedInvestor.profitSharePercentage / 100))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Period Label</label>
                <input
                  type="text"
                  value={distPeriod}
                  onChange={e => setDistPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Reference (NIBSS / NIP)</label>
                <input
                  type="text"
                  value={distRef}
                  onChange={e => setDistRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDistModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Authorize Distribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Investor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-900/20 my-6">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Onboard Capital Partner / Investor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddInvestor} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Investor Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Alhaji Mustapha Bello"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+234 803 700 8899"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="investor@example.ng"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Capital Invested (₦) *</label>
                  <input
                    type="number"
                    min="100000"
                    step="50000"
                    value={capital}
                    onChange={e => setCapital(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Agreed Profit Share (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={profitShare}
                    onChange={e => setProfitShare(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Agreement Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Maturity Date</label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={e => setMaturityDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-hidden"
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
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
