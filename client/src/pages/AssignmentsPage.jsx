import React, { useState, useEffect } from 'react';
import { UserCheck, Flame, Plus, Search, CheckCircle2, Shield, Lock, RotateCcw } from 'lucide-react';
import { assignmentsAPI, expendituresAPI, basesAPI, assetsAPI } from '../api';
import AssignmentModal from '../components/AssignmentModal';
import ExpenditureModal from '../components/ExpenditureModal';
import { useAuth } from '../context/AuthContext';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('assignments'); // 'assignments' | 'expenditures'

  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);

  const [search, setSearch] = useState('');

  // RBAC permissions check
  const isLogisticsOfficer = user?.role === 'Logistics Officer';

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'assignments') {
      fetchAssignments();
    } else {
      fetchExpenditures();
    }
  }, [activeSubTab, user, search]);

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

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await assignmentsAPI.getAssignments({ search });
      setAssignments(res.data);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenditures = async () => {
    setLoading(true);
    try {
      const res = await expendituresAPI.getExpenditures({ search });
      setExpenditures(res.data);
    } catch (err) {
      console.error('Failed to fetch expenditures:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAssignment = async (id) => {
    try {
      await assignmentsAPI.returnAssignment(id);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return asset.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" /> Personnel Assignments & Expended Assets Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Assign assets to military personnel/units and track expended ammunition and operational consumables across bases.
          </p>
        </div>

        {/* Action Buttons with RBAC Tooltips */}
        <div className="flex items-center space-x-2">
          {activeSubTab === 'assignments' ? (
            <button
              onClick={() => !isLogisticsOfficer && setIsAssignModalOpen(true)}
              disabled={isLogisticsOfficer}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center gap-2 shadow-lg ${
                isLogisticsOfficer
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-slate-100'
              }`}
              title={isLogisticsOfficer ? "RBAC Restriction: Logistics Officers cannot assign assets to personnel." : "Issue asset assignment"}
            >
              {isLogisticsOfficer ? <Lock className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4" />}
              Assign Asset to Personnel
            </button>
          ) : (
            <button
              onClick={() => !isLogisticsOfficer && setIsExpModalOpen(true)}
              disabled={isLogisticsOfficer}
              className={`text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center gap-2 shadow-lg ${
                isLogisticsOfficer
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-rose-600 hover:bg-rose-500 text-slate-100'
              }`}
              title={isLogisticsOfficer ? "RBAC Restriction: Logistics Officers cannot log asset expenditures." : "Log asset expenditure"}
            >
              {isLogisticsOfficer ? <Lock className="w-4 h-4 text-amber-400" /> : <Flame className="w-4 h-4" />}
              Log Expended Asset
            </button>
          )}
        </div>
      </div>

      {/* RBAC Notice for Logistics Officer */}
      {isLogisticsOfficer && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs font-medium flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>RBAC Security Notice:</strong> You are currently logged in as a <strong>Logistics Officer</strong>. Your access is view-only for assignments & expenditures. Only <strong>Admins</strong> and <strong>Base Commanders</strong> can issue assignments or log expenditures.
          </span>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('assignments')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'assignments'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Personnel Assignments</span>
          </button>

          <button
            onClick={() => setActiveSubTab('expenditures')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'expenditures'
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Expended Asset Records</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'assignments' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="py-3 px-4">Assignment Ref</th>
                  <th className="py-3 px-4">Military Base</th>
                  <th className="py-3 px-4">Assignee Officer / Soldier</th>
                  <th className="py-3 px-4">Service ID</th>
                  <th className="py-3 px-4">Unit Squad</th>
                  <th className="py-3 px-4">Asset Details</th>
                  <th className="py-3 px-4 text-right">Qty Issued</th>
                  <th className="py-3 px-4">Assigned Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">Loading active assignments...</td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">No personnel assignments found.</td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-400">{a.assignment_ref}</td>
                      <td className="py-3 px-4 font-medium text-slate-300">{a.base_name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{a.assigned_to_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{a.assigned_to_service_id}</td>
                      <td className="py-3 px-4 text-slate-300">{a.unit_squad}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{a.asset_name}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-400">{a.quantity}</td>
                      <td className="py-3 px-4 text-slate-400">{a.assigned_date.split(' ')[0]}</td>
                      <td className="py-3 px-4">
                        {a.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                            <Shield className="w-3 h-3" /> Active Issued
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Returned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {a.status === 'Active' && !isLogisticsOfficer && (
                          <button
                            onClick={() => handleReturnAssignment(a.id)}
                            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-1 rounded transition flex items-center gap-1 mx-auto"
                          >
                            <RotateCcw className="w-3 h-3" /> Mark Returned
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="py-3 px-4">Expenditure Ref</th>
                  <th className="py-3 px-4">Military Base</th>
                  <th className="py-3 px-4">Expended Date</th>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity Expended</th>
                  <th className="py-3 px-4">Operational Reason</th>
                  <th className="py-3 px-4">Reported By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Loading expenditure records...</td>
                  </tr>
                ) : expenditures.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No asset expenditures logged.</td>
                  </tr>
                ) : (
                  expenditures.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-rose-400">{e.expenditure_ref}</td>
                      <td className="py-3 px-4 font-medium text-slate-300">{e.base_name}</td>
                      <td className="py-3 px-4 text-slate-400">{e.expended_date.split(' ')[0]}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{e.asset_name}</td>
                      <td className="py-3 px-4 text-slate-400">{e.equipment_type_name}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">-{e.quantity}</td>
                      <td className="py-3 px-4 text-slate-300">{e.reason}</td>
                      <td className="py-3 px-4 text-slate-400">{e.reported_by_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        bases={bases}
        assets={assets}
        onSuccess={fetchAssignments}
      />

      <ExpenditureModal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        bases={bases}
        assets={assets}
        onSuccess={fetchExpenditures}
      />

    </div>
  );
}
