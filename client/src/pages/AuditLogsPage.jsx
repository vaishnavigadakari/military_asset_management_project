import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldAlert, Filter, User, Clock, Terminal } from 'lucide-react';
import { auditAPI, basesAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    limit: 50,
    baseId: user?.base_id ? String(user.base_id) : 'all',
    action: 'all'
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters, user]);

  const fetchMetadata = async () => {
    try {
      const res = await basesAPI.getBases();
      setBases(res.data);
    } catch (err) {
      console.error('Failed to fetch bases:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditAPI.getAuditLogs(filters);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'RECORD_PURCHASE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">PURCHASE</span>;
      case 'EXECUTE_TRANSFER':
      case 'UPDATE_TRANSFER_STATUS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">TRANSFER</span>;
      case 'CREATE_ASSIGNMENT':
      case 'RETURN_ASSIGNMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">ASSIGNMENT</span>;
      case 'LOG_EXPENDITURE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">EXPENDITURE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-amber-400" /> Transaction Audit & Security Log Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident system transaction logging for complete operational transparency and military accountability.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Terminal className="w-4 h-4 text-emerald-400" /> AUDIT COMPLIANCE: ISO/IEC 27001
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs">
          <Filter className="w-4 h-4 text-amber-400" /> Filter Logs:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <select
            value={filters.baseId}
            disabled={user?.role !== 'Admin' && user?.base_id}
            onChange={(e) => setFilters(prev => ({ ...prev, baseId: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-amber-500 disabled:opacity-60"
          >
            <option value="all">All Military Bases</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Transaction Types</option>
            <option value="RECORD_PURCHASE">Purchases</option>
            <option value="EXECUTE_TRANSFER">Transfers</option>
            <option value="CREATE_ASSIGNMENT">Assignments</option>
            <option value="LOG_EXPENDITURE">Expenditures</option>
          </select>

          <select
            value={filters.limit}
            onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="25">Show 25 Logs</option>
            <option value="50">Show 50 Logs</option>
            <option value="100">Show 100 Logs</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer / User</th>
                <th className="py-3 px-4">RBAC Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Station Base</th>
                <th className="py-3 px-4">Details Payload</th>
                <th className="py-3 px-4 font-mono text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No audit logs recorded for this selection.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{log.user_name}</td>
                    <td className="py-3 px-4 text-slate-300">{log.user_role}</td>
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 font-mono text-amber-400">{log.resource_id}</td>
                    <td className="py-3 px-4 text-slate-300">{log.base_name || 'HQ / All'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">{log.details}</td>
                    <td className="py-3 px-4 font-mono text-right text-slate-400">{log.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
