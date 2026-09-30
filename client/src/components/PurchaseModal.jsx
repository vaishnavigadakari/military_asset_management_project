import React, { useState } from 'react';
import { X, ShoppingCart, Plus, Check } from 'lucide-react';
import { purchasesAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PurchaseModal({ isOpen, onClose, bases, assets, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    base_id: user?.base_id || (bases[0]?.id || ''),
    asset_id: assets[0]?.id || '',
    quantity: 1,
    unit_cost: '',
    supplier: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await purchasesAPI.createPurchase({
        ...formData,
        base_id: formData.base_id || user?.base_id || bases[0]?.id
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record purchase.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = assets.find(a => String(a.id) === String(formData.asset_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Record Asset Purchase</h3>
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Military Base</label>
            <select
              value={formData.base_id}
              disabled={user?.role !== 'Admin' && user?.base_id}
              onChange={(e) => setFormData(prev => ({ ...prev, base_id: e.target.value }))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-amber-500 focus:outline-none"
              required
            >
              {bases.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Asset / Equipment</label>
            <select
              value={formData.asset_id}
              onChange={(e) => {
                const aId = e.target.value;
                const ast = assets.find(a => String(a.id) === String(aId));
                setFormData(prev => ({
                  ...prev,
                  asset_id: aId,
                  unit_cost: ast ? ast.unit_cost : ''
                }));
              }}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-amber-500 focus:outline-none"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit Cost ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
                placeholder={selectedAsset ? selectedAsset.unit_cost : '0.00'}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Defense Supplier / Contractor</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              placeholder="e.g. Colt Defense Systems LLC"
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Date</label>
            <input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 px-3 py-2 focus:border-amber-500 focus:outline-none"
              required
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
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1"
            >
              {loading ? 'Recording...' : <><Plus className="w-4 h-4" /> Save Purchase</>}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
