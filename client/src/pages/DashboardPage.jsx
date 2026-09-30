import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShoppingCart, 
  ArrowDownRight, 
  ArrowUpRight, 
  Layers, 
  ShieldCheck, 
  UserCheck, 
  Flame,
  Plus,
  ArrowLeftRight,
  TrendingUp
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { dashboardAPI, basesAPI, assetsAPI } from '../api';
import FilterBar from '../components/FilterBar';
import MetricCard from '../components/MetricCard';
import NetMovementModal from '../components/NetMovementModal';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage({ setActiveTab }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    baseId: user?.base_id ? String(user.base_id) : 'all',
    equipmentTypeId: 'all'
  });

  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [metrics, setMetrics] = useState({
    openingBalance: 0,
    purchases: 0,
    purchasesValue: 0,
    transfersIn: 0,
    transfersOut: 0,
    netMovement: 0,
    expended: 0,
    closingBalance: 0,
    assigned: 0
  });

  const [loading, setLoading] = useState(true);
  const [isNetMovementOpen, setIsNetMovementOpen] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchMetrics();
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
      console.error('Failed to load filter metadata:', err);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const effectiveBaseId = (user?.role !== 'Admin' && user?.base_id) ? String(user.base_id) : filters.baseId;
      const res = await dashboardAPI.getMetrics({
        ...filters,
        baseId: effectiveBaseId
      });
      setMetrics(res.data.metrics);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chart data setup
  const chartData = [
    { name: 'Opening Stock', count: metrics.openingBalance },
    { name: 'Purchases', count: metrics.purchases },
    { name: 'Transfers In', count: metrics.transfersIn },
    { name: 'Transfers Out', count: metrics.transfersOut },
    { name: 'Net Movement', count: metrics.netMovement },
    { name: 'Expended', count: metrics.expended },
    { name: 'Closing Stock', count: metrics.closingBalance },
    { name: 'Assigned', count: metrics.assigned }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">Logistics Command Center Dashboard</h1>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              LIVE AUDIT ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring of opening balances, net asset movements, inter-base dispatches, active personnel assignments and expenditures.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('purchases')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1 shadow"
          >
            <Plus className="w-4 h-4" /> New Purchase
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1 shadow"
          >
            <ArrowLeftRight className="w-4 h-4" /> Dispatch Transfer
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        bases={bases}
        equipmentTypes={equipmentTypes}
        onRefresh={fetchMetrics}
      />

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Opening Balance */}
        <MetricCard
          title="Opening Balance"
          value={metrics.openingBalance}
          subtext="Initial stock count prior to date range"
          icon={Building2}
          color="blue"
        />

        {/* Net Movement Card (Bonus Feature Click Handler) */}
        <MetricCard
          title="Net Movement"
          value={metrics.netMovement}
          subtext={`Purchases (${metrics.purchases}) + Trf In (${metrics.transfersIn}) - Trf Out (${metrics.transfersOut})`}
          icon={Layers}
          color="emerald"
          clickable={true}
          onClick={() => setIsNetMovementOpen(true)}
        />

        {/* Closing Balance */}
        <MetricCard
          title="Closing Balance"
          value={metrics.closingBalance}
          subtext="Opening + Net Movement - Expended"
          icon={ShieldCheck}
          color="cyan"
        />

        {/* Assigned Assets */}
        <MetricCard
          title="Assigned Assets"
          value={metrics.assigned}
          subtext="Issued to personnel in service"
          icon={UserCheck}
          color="indigo"
        />

      </div>

      {/* Secondary Metrics Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Purchases */}
        <MetricCard
          title="Purchases"
          value={metrics.purchases}
          subtext={`Total Value: $${metrics.purchasesValue ? metrics.purchasesValue.toLocaleString() : '0'}`}
          icon={ShoppingCart}
          color="amber"
        />

        {/* Transfers In */}
        <MetricCard
          title="Transfers In"
          value={metrics.transfersIn}
          subtext="Incoming assets from other bases"
          icon={ArrowDownRight}
          color="emerald"
        />

        {/* Transfers Out */}
        <MetricCard
          title="Transfers Out"
          value={metrics.transfersOut}
          subtext="Dispatched assets to other bases"
          icon={ArrowUpRight}
          color="rose"
        />

        {/* Expended Assets */}
        <MetricCard
          title="Expended Assets"
          value={metrics.expended}
          subtext="Ammunition & consumables spent"
          icon={Flame}
          color="rose"
        />

      </div>

      {/* Visual Analytics Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Asset Movement & Inventory Balance Distribution</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Aggregated Units</span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pop-up Display Modal for Net Movement [Bonus] */}
      <NetMovementModal
        isOpen={isNetMovementOpen}
        onClose={() => setIsNetMovementOpen(false)}
        filters={filters}
        metrics={metrics}
      />

    </div>
  );
}
