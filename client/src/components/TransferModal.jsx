import React, { useState } from 'react';
import { X, ArrowLeftRight, Send } from 'lucide-react';
import { transfersAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function TransferModal({ isOpen, onClose, bases, assets, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    from_base_id: user?.base_id || (bases[0]?.id || ''),
    to_base_id: bases[1]?.id || '',
    asset_id: assets[0]?.id || '',
    quantity: 1,
    status: 'Completed',
    notes: '',
    transfer_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (String(formData.from_base_id) === String(formData.to_base_id)) {
      setError('Origin Base and Destination Base cannot be the same base.');
      setLoading(false);
      return;
    }

    try {
      await transfersAPI.createTransfer({
        ...formData
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to execute transfer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Initiate Inter-Base Asset Transfer</h3>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Origin Base (Dispatch)</label>
              <select
                value={formData.from_base_id}
                onChange={(e) => setFormData(prev => ({ ...prev, from_base_id: e.target.value }))}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                required
              >
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Destination Base (Receiver)</label>
              <select
                value={formData.to_base_id}
                onChange={(e) => setFormData(prev => ({ ...prev, to_base_id: e.target.value }))}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                required
              >
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Asset / Equipment</label>
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData(prev => ({ ...prev, asset_id: e.target.value }))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-emerald-500 focus:outline-none"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Completed font-bold text-emerald-400">Completed (Immediate Stock Transfer)</option>
                <option value="In Transit">In Transit (Dispatch Registered)</option>
                <option value="Pending">Pending Approval</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Date</label>
            <input
              type="date"
              value={formData.transfer_date}
              onChange={(e) => setFormData(prev => ({ ...prev, transfer_date: e.target.value }))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Operational Directive / Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="e.g. Tactical battalion re-alignment under Operation Sentinel"
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-xs font-bold rounded-lg transition flex items-center gap-1"
            >
              {loading ? 'Dispatching...' : <><Send className="w-4 h-4" /> Dispatch Transfer</>}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
