import React, { useState, useEffect } from 'react';
import { Boxes, Building2, Package, Search, DollarSign, Layers } from 'lucide-react';
import { assetsAPI, basesAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    baseId: user?.base_id ? String(user.base_id) : 'all',
    equipmentTypeId: 'all'
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [filters, user]);

  const fetchMetadata = async () => {
    try {
      const [basesRes, typesRes] = await Promise.all([
        basesAPI.getBases(),
        assetsAPI.getEquipmentTypes()
      ]);
      setBases(basesRes.data);
      setEquipmentTypes(typesRes.data);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await assetsAPI.getInventory(filters);
      setInventory(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalStockCount = inventory.reduce((sum, item) => sum + (item.current_stock || 0), 0);
  const totalValuation = inventory.reduce((sum, item) => sum + ((item.current_stock || 0) * (item.unit_cost || 0)), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-400" /> Military Base Inventory & Armory Balances
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time armory stock inspection, baseline opening balances, and asset valuation breakdown per station.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Base Stock</span>
            <p className="text-base font-bold font-mono text-emerald-400">{totalStockCount.toLocaleString()} Units</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Stock Valuation</span>
            <p className="text-base font-bold font-mono text-blue-400">${totalValuation.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs">
          <Building2 className="w-4 h-4 text-emerald-400" /> Filter Armory Stock:
        </div>

        <div className="flex items-center gap-3 flex-1">
          <select
            value={filters.baseId}
            disabled={user?.role !== 'Admin' && user?.base_id}
            onChange={(e) => setFilters(prev => ({ ...prev, baseId: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
          >
            <option value="all">All Military Bases</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>

          <select
            value={filters.equipmentTypeId}
            onChange={(e) => setFilters(prev => ({ ...prev, equipmentTypeId: e.target.value }))}
            className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Equipment Categories</option>
            {equipmentTypes.map((et) => (
              <option key={et.id} value={et.id}>{et.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4">Base Station</th>
                <th className="py-3 px-4">Asset Equipment Name</th>
                <th className="py-3 px-4">Model Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Opening Balance Baseline</th>
                <th className="py-3 px-4 text-right">Current Available Stock</th>
                <th className="py-3 px-4 text-right">Unit Value ($)</th>
                <th className="py-3 px-4 text-right">Total Valuation ($)</th>
                <th className="py-3 px-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading armory stock levels...</td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No inventory records found.</td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const itemValuation = (item.current_stock || 0) * (item.unit_cost || 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-slate-100">{item.base_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">{item.asset_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{item.model_code}</td>
                      <td className="py-3 px-4 text-slate-400">{item.equipment_type_name}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{item.opening_balance}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{item.current_stock} {item.unit_of_measure}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">${item.unit_cost ? item.unit_cost.toLocaleString() : '0'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">${item.unit_cost ? itemValuation.toLocaleString() : '0'}</td>
                      <td className="py-3 px-4 text-slate-400">{item.updated_at.split(' ')[0]}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
