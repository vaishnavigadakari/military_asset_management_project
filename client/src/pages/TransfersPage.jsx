import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Search, CheckCircle2, Clock, Truck, ShieldAlert } from 'lucide-react';
import { transfersAPI, basesAPI, assetsAPI } from '../api';
import TransferModal from '../components/TransferModal';
import { useAuth } from '../context/AuthContext';

export default function TransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    baseId: user?.base_id ? String(user.base_id) : 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [filters, user]);

  const fetchMetadata = async () => {
    try {
      const [basesRes, assetsRes] = await Promise.all([
        basesAPI.getBases(),
        assetsAPI.getAssets()
      ]);
      setBases(basesRes.data);
      setAssets(assetsRes.data);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await transfersAPI.getTransfers(filters);
      setTransfers(res.data);
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await transfersAPI.updateStatus(id, status);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update transfer status.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'In Transit':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Truck className="w-3 h-3" /> In Transit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-400" /> Inter-Base Asset Transfer Logistics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Facilitate asset transfers between military bases with clear movement history, dispatch timestamps, and status verification.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Initiate Asset Transfer
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search Ref, Base, Asset..."
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Transit">In Transit</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Base */}
          <select
            value={filters.baseId}
            disabled={user?.role !== 'Admin' && user?.base_id}
            onChange={(e) => setFilters(prev => ({ ...prev, baseId: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
          >
            <option value="all">All Bases</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-emerald-500"
          />

        </div>
      </div>

      {/* Transfer History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4">Transfer Ref</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Origin Base</th>
                <th className="py-3 px-4">Destination Base</th>
                <th className="py-3 px-4">Asset Details</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading transfer history...</td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No transfer records found.</td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-emerald-400">{t.transfer_ref}</td>
                    <td className="py-3 px-4 text-slate-400">{t.transfer_date}</td>
                    <td className="py-3 px-4 font-medium text-rose-300">{t.from_base_name}</td>
                    <td className="py-3 px-4 font-medium text-emerald-300">{t.to_base_name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {t.asset_name} <span className="text-slate-400 text-[10px]">({t.equipment_type_name})</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">{t.quantity}</td>
                    <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{t.notes || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      {t.status === 'In Transit' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'Completed')}
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-1 rounded transition"
                        >
                          Mark Completed
                        </button>
                      )}
                      {t.status === 'Completed' && (
                        <span className="text-slate-400 text-[11px]">Finalized</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bases={bases}
        assets={assets}
        onSuccess={fetchTransfers}
      />

    </div>
  );
}
