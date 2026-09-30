import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Calendar, Building2, Package, RefreshCw, DollarSign } from 'lucide-react';
import { purchasesAPI, basesAPI, assetsAPI } from '../api';
import PurchaseModal from '../components/PurchaseModal';
import { useAuth } from '../context/AuthContext';

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [assets, setAssets] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    baseId: user?.base_id ? String(user.base_id) : 'all',
    equipmentTypeId: 'all',
    search: ''
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [filters, user]);

  const fetchMetadata = async () => {
    try {
      const [basesRes, assetsRes, typesRes] = await Promise.all([
        basesAPI.getBases(),
        assetsAPI.getAssets(),
        assetsAPI.getEquipmentTypes()
      ]);
      setBases(basesRes.data);
      setAssets(assetsRes.data);
      setEquipmentTypes(typesRes.data);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await purchasesAPI.getPurchases(filters);
      setPurchases(res.data);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = purchases.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const totalUnits = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-400" /> Asset Purchases & Procurement Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Record military asset purchases, track contractor acquisitions, unit costs, and historical procurement ledgers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Record New Purchase
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Purchases Recorded</span>
            <p className="text-xl font-bold font-mono text-slate-100">{purchases.length} Transactions</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Acquired Units</span>
            <p className="text-xl font-bold font-mono text-emerald-400">+{totalUnits.toLocaleString()} Units</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Procurement Valuation</span>
            <p className="text-xl font-bold font-mono text-blue-400">${totalSpent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search Ref, Asset, Supplier..."
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Base */}
          <select
            value={filters.baseId}
            disabled={user?.role !== 'Admin' && user?.base_id}
            onChange={(e) => setFilters(prev => ({ ...prev, baseId: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-amber-500 disabled:opacity-60"
          >
            <option value="all">All Bases</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Equipment Type */}
          <select
            value={filters.equipmentTypeId}
            onChange={(e) => setFilters(prev => ({ ...prev, equipmentTypeId: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Equipment Types</option>
            {equipmentTypes.map((et) => (
              <option key={et.id} value={et.id}>{et.name}</option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-amber-500"
          />

          {/* End Date */}
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-amber-500"
          />

        </div>
      </div>

      {/* Historical Purchases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4">Purchase Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Military Base</th>
                <th className="py-3 px-4">Asset / Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">Loading purchase transactions...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">No purchase records found matching filters.</td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-amber-400">{p.purchase_ref}</td>
                    <td className="py-3 px-4 text-slate-400">{p.purchase_date.split(' ')[0]}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{p.base_name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{p.asset_name}</td>
                    <td className="py-3 px-4 text-slate-400">{p.equipment_type_name}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">+{p.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">${p.unit_cost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">${p.total_cost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400">{p.supplier}</td>
                    <td className="py-3 px-4 text-slate-400">{p.created_by_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bases={bases}
        assets={assets}
        onSuccess={fetchPurchases}
      />

    </div>
  );
}
