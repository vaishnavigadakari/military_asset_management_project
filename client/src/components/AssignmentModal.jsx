import React, { useState } from 'react';
import { X, UserCheck, Shield } from 'lucide-react';
import { assignmentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AssignmentModal({ isOpen, onClose, bases, assets, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    base_id: user?.base_id || (bases[0]?.id || ''),
    asset_id: assets[0]?.id || '',
    assigned_to_name: '',
    assigned_to_service_id: '',
    unit_squad: '1st Recon Infantry Squad',
    quantity: 1,
    assigned_date: new Date().toISOString().split('T')[0],
    expected_return_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await assignmentsAPI.createAssignment({
        ...formData,
        base_id: formData.base_id || user?.base_id || bases[0]?.id
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign asset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Assign Asset to Military Personnel</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Station Base</label>
            <select
              value={formData.base_id}
              disabled={user?.role !== 'Admin' && user?.base_id}
              onChange={(e) => setFormData(prev => ({ ...prev, base_id: e.target.value }))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-blue-500 focus:outline-none"
              required
            >
              {bases.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Asset to Issue</label>
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData(prev => ({ ...prev, asset_id: e.target.value }))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Choose Asset --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name} [{a.equipment_type_name}]</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assignee Officer / Soldier Name</label>
              <input
                type="text"
                value={formData.assigned_to_name}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_to_name: e.target.value }))}
                placeholder="e.g. Sgt. Marcus Vance"
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Service / Military ID</label>
              <input
                type="text"
                value={formData.assigned_to_service_id}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_to_service_id: e.target.value }))}
                placeholder="e.g. MIL-884920"
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit / Platoon Squad</label>
              <input
                type="text"
                value={formData.unit_squad}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_squad: e.target.value }))}
                placeholder="e.g. 1st Recon Platoon"
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantity Issued</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assignment Date</label>
              <input
                type="date"
                value={formData.assigned_date}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_date: e.target.value }))}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Expected Return Date</label>
              <input
                type="date"
                value={formData.expected_return_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-100 text-xs font-bold rounded-lg transition flex items-center gap-1"
            >
              {loading ? 'Processing...' : <><Shield className="w-4 h-4" /> Issue Assignment</>}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
