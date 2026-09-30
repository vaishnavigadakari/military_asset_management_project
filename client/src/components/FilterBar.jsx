import React from 'react';
import { Calendar, Building2, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FilterBar({ filters, setFilters, bases, equipmentTypes, onRefresh }) {
  const { user } = useAuth();
  const isBaseRestricted = user?.role !== 'Admin' && user?.base_id;

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      startDate = past.toISOString().split('T')[0];
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = firstDay.toISOString().split('T')[0];
    } else if (preset === 'all') {
      startDate = '';
      endDate = '';
    }

    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title / Filter Identifier */}
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Operational Logistics Filters</span>
        </div>

        {/* Filter Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:flex items-center gap-3">
          
          {/* Base Selection Filter */}
          <div className="flex flex-col">
            <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-400" /> Military Base
            </label>
            <select
              value={filters.baseId}
              disabled={isBaseRestricted}
              onChange={(e) => setFilters(prev => ({ ...prev, baseId: e.target.value }))}
              className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-1.5 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            >
              <option value="all">All Military Bases</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Equipment Type Filter */}
          <div className="flex flex-col">
            <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Package className="w-3 h-3 text-emerald-400" /> Equipment Category
            </label>
            <select
              value={filters.equipmentTypeId}
              onChange={(e) => setFilters(prev => ({ ...prev, equipmentTypeId: e.target.value }))}
              className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Equipment Types</option>
              {equipmentTypes.map((et) => (
                <option key={et.id} value={et.id}>
                  {et.name} ({et.category_code})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col">
            <label className="text-[11px] font-medium text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label className="text-[11px] font-medium text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Date Presets & Refresh */}
          <div className="flex items-end space-x-2 pt-2 sm:pt-0">
            <button
              onClick={() => handleDatePreset('30days')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-md transition"
              title="Last 30 Days"
            >
              30D
            </button>
            <button
              onClick={() => handleDatePreset('all')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-md transition"
              title="Clear Date Range Filter"
            >
              All Time
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 p-1.5 rounded-md transition"
                title="Refresh Metrics Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
