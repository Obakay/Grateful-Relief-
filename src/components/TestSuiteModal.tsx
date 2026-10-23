import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { runAllTests, TestResult } from '../services/testSuite';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const executeTests = async () => {
    setIsRunning(true);
    setResults([]);
    try {
      const res = await runAllTests();
      setResults(res);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && results.length === 0) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const filteredResults = filter === 'all'
    ? results
    : filter === 'failed'
    ? results.filter(r => r.status === 'failed')
    : results.filter(r => r.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-emerald-900/20 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">System Integrity & Financial Workflow Verification Suite</h3>
              <p className="text-xs text-emerald-300">Automated evaluation of Section 24 criteria (22 test specifications)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">Test Execution Status:</span>
            {isRunning ? (
              <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running 22 Test Cases...
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> {passedCount} Passed
                </span>
                {failedCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-100 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> {failedCount} Failed
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories ({results.length})</option>
              <option value="Maker-Checker">Maker-Checker ({results.filter(r => r.category === 'Maker-Checker').length})</option>
              <option value="Collections">Collections & Schedule ({results.filter(r => r.category === 'Collections & Schedule').length})</option>
              <option value="Security">Security & Auth ({results.filter(r => r.category === 'Security').length})</option>
              <option value="Accounting">Accounting & Reports ({results.filter(r => r.category === 'Accounting').length})</option>
            </select>
            <button
              onClick={executeTests}
              disabled={isRunning}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Play className="w-3.5 h-3.5" />
              Re-run Suite
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y divide-slate-100">
          {filteredResults.map(test => (
            <div key={test.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {test.status === 'passed' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">#{test.id}</span>
                    <h4 className="font-semibold text-slate-900 text-sm">{test.name}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {test.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{test.assertion}</p>
                  {test.details && (
                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 font-mono text-[11px]">
                      {test.details}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap mt-1">
                <Clock className="w-3 h-3" />
                <span>{test.durationMs}ms</span>
              </div>
            </div>
          ))}

          {results.length === 0 && isRunning && (
            <div className="text-center py-12 text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-700 mb-2" />
              Executing test fixtures against transactional engine...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Target Platform: Grateful Relief Program Limited - Africa/Lagos (NGN ₦)</span>
          <button
            onClick={onClose}
            className="bg-emerald-900 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-800 transition font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
