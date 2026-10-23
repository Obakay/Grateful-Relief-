import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';
import { dbService } from '../services/db';
import { AuditEvent } from '../types';
import { formatDateNG } from '../services/loanCalculator';

export const AuditTrailView: React.FC = () => {
  const events = dbService.getAuditEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [activeEvent, setActiveEvent] = useState<AuditEvent | null>(null);

  const filteredEvents = events.filter(e => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      e.performedByName.toLowerCase().includes(q) ||
      e.entityId.toLowerCase().includes(q);
    const matchesType = selectedEventType === 'all' || e.eventType === selectedEventType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Immutable Security & Financial Audit Trail</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Append-Only WORM Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-resistant audit registry recording every transaction, Maker-Checker decision, and disbursement.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search description, staff, transaction ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedEventType}
            onChange={e => setSelectedEventType(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Event Types</option>
            <option value="REPAYMENT_RECORDED">Repayments Recorded</option>
            <option value="LOAN_DISBURSED">Loan Disbursements</option>
            <option value="APPLICATION_APPROVED">Approvals (Maker-Checker)</option>
            <option value="REPAYMENT_REVERSED">Transaction Reversals</option>
            <option value="BORROWER_CREATED">Borrower KYC Creations</option>
            <option value="RECONCILIATION_COMPLETED">Reconciliation Sign-offs</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">Timestamp (Lagos)</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Staff Member & Role</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4 text-center">Entity Ref</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {e.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{e.performedByName}</div>
                    <div className="text-[10px] text-emerald-800 uppercase font-bold">{e.userRole.replace('_', ' ')}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{e.description}</td>
                  <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500">{e.entityId}</td>
                  <td className="py-3 px-4 text-right">
                    {e.details ? (
                      <button
                        onClick={() => setActiveEvent(e)}
                        className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline"
                      >
                        Inspect Payload
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-900/20 my-8">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Audit Event Details</h3>
              <button onClick={() => setActiveEvent(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-3 text-xs font-mono">
              <div className="text-slate-600 font-sans">{activeEvent.description}</div>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px]">
                {JSON.stringify(activeEvent.details, null, 2)}
              </pre>
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveEvent(null)}
                className="bg-emerald-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
