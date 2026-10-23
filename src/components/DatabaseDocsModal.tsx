import React, { useState } from 'react';
import { X, Database, Shield, Copy, Check, BookOpen, Terminal, HardDrive } from 'lucide-react';

interface DatabaseDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseDocsModal: React.FC<DatabaseDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'rls' | 'backup' | 'guides'>('schema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const schemaSQL = `-- GRATEFUL RELIEF PROGRAM LIMITED - SCHEMA HIGHLIGHTS
-- PostgreSQL 15+ / Supabase PostgreSQL
CREATE TYPE user_role AS ENUM ('administrator', 'loan_officer', 'auditor');
CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'cancelled');
CREATE TYPE loan_status AS ENUM ('active', 'fully_paid', 'overdue', 'defaulted', 'written_off');

-- 1. Profiles & Roles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'loan_officer',
    phone TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'Lagos Island (Balogun Market)',
    approval_limit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

-- 2. Loans & Maker-Checker Constraint
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_code VARCHAR(32) NOT NULL UNIQUE,
    borrower_id UUID NOT NULL REFERENCES borrowers(id),
    requested_principal NUMERIC(14, 2) NOT NULL CHECK (requested_principal > 0),
    status application_status NOT NULL DEFAULT 'submitted',
    submitted_by UUID NOT NULL REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    -- STRICT MAKER-CHECKER ENFORCEMENT AT DATABASE LEVEL:
    CONSTRAINT chk_maker_checker CHECK (submitted_by <> approved_by)
);

-- Complete full schema located at /supabase/schema.sql`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-emerald-900/20 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Database Architecture & Technical Manual</h3>
              <p className="text-xs text-emerald-300">Supabase PostgreSQL Schema, RLS, Backup & Disaster Recovery Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'schema' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> PostgreSQL Schema & Types
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'rls' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Row Level Security (RLS)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> Backup & Recovery SOP
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'guides' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Staff Operations SOP
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 font-sans text-xs text-slate-700 leading-relaxed">
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900 text-slate-200 p-3 rounded-lg">
                <span className="font-mono text-xs">/supabase/schema.sql (PostgreSQL 15+ & Supabase)</span>
                <button
                  onClick={() => copyToClipboard(schemaSQL)}
                  className="flex items-center gap-1 text-xs bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded text-white font-medium"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy DDL'}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[350px]">
                {schemaSQL}
              </pre>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 space-y-1">
                <h4 className="font-bold">Key Architectural Guarantees:</h4>
                <ul className="list-disc pl-4 space-y-0.5 text-xs">
                  <li><strong>Exact Monetary Representation:</strong> Uses <code>NUMERIC(14,2)</code> to avoid IEEE-754 floating point imprecision.</li>
                  <li><strong>Idempotency Keys:</strong> <code>idempotency_key UNIQUE</code> prevents duplicate clicks from billing twice.</li>
                  <li><strong>Maker-Checker Integrity:</strong> Database check constraint <code>CHECK (submitted_by &lt;&gt; approved_by)</code> guarantees loan creators cannot approve their own loans.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">PostgreSQL Row-Level Security Matrix</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Table</th>
                      <th className="p-3">Administrator</th>
                      <th className="p-3">Loan Officer</th>
                      <th className="p-3">Auditor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-mono font-semibold">borrowers</td>
                      <td className="p-3 text-emerald-700 font-bold">ALL (Full CRUD)</td>
                      <td className="p-3 text-emerald-700">SELECT (Assigned), INSERT</td>
                      <td className="p-3 text-slate-600">SELECT (Read-Only)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold">loan_applications</td>
                      <td className="p-3 text-emerald-700 font-bold">ALL (Review & Approve)</td>
                      <td className="p-3 text-emerald-700">INSERT, SELECT (Self)</td>
                      <td className="p-3 text-slate-600">SELECT (Read-Only)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold">loans</td>
                      <td className="p-3 text-emerald-700 font-bold">ALL (Disburse & Manage)</td>
                      <td className="p-3 text-emerald-700">SELECT (Assigned Branch)</td>
                      <td className="p-3 text-slate-600">SELECT (Read-Only)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold">repayments</td>
                      <td className="p-3 text-emerald-700 font-bold">SELECT, INSERT, REVERSE</td>
                      <td className="p-3 text-emerald-700">INSERT (Collect), SELECT</td>
                      <td className="p-3 text-slate-600">SELECT (Read-Only)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-semibold">audit_events</td>
                      <td className="p-3 text-emerald-700">SELECT (No DELETE)</td>
                      <td className="p-3 text-rose-700 font-bold">DENIED</td>
                      <td className="p-3 text-emerald-700 font-bold">SELECT (Audit trail)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Database Backup & Disaster Recovery Standard Operating Procedure (SOP)</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">1. Automated Daily Backups:</h4>
                <p>Run via Supabase Scheduled Backup or Linux Cron daily at 02:00 AM Lagos time (UTC+1):</p>
                <code className="block bg-slate-900 text-emerald-400 p-2 rounded text-[11px] font-mono">
                  pg_dump -h $PGHOST -U postgres -d grateful_relief -F c -b -v -f /backups/grp_$(date +%Y%m%d_%H%M%S).dump
                </code>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">2. Point-in-Time Recovery (PITR):</h4>
                <p>PostgreSQL WAL archiving preserves continuous transaction logs enabling restoration to any specified second prior to an operational anomaly.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">3. Retention & Encryption:</h4>
                <p>Backups are AES-256 encrypted at rest and replicated across multi-region cloud buckets with 30-day daily and 12-month month-end retention.</p>
              </div>
            </div>
          )}

          {activeTab === 'guides' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Staff Operations User Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-emerald-950">Loan Officer / Field Collector:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
                    <li>Register borrowers with valid Nigerian phone and stall location.</li>
                    <li>Submit loan applications with verified business cashflow.</li>
                    <li>Execute daily collections in the market and issue immediate printed or WhatsApp receipts.</li>
                    <li>End day by handing over cash at branch and completing reconciliation session.</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900">Administrator / Branch Manager:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
                    <li>Review loan pipeline under Maker-Checker governance.</li>
                    <li>Authorize disbursements after checking terms & borrower identity.</li>
                    <li>Sign off daily reconciliation variances with collection officers.</li>
                    <li>Review Net Realized Income (keeping principal separate from revenue).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-900 text-white px-5 py-1.5 rounded-lg hover:bg-emerald-800 transition font-medium text-xs"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
