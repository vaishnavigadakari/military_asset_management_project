import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ShoppingCart, Layers, CheckCircle2, Clock } from 'lucide-react';
import { dashboardAPI } from '../api';

export default function NetMovementModal({ isOpen, onClose, filters, metrics }) {
  const [activeTab, setActiveTab] = useState('purchases');
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState({
    purchasesList: [],
    transfersInList: [],
    transfersOutList: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchBreakdownData();
    }
  }, [isOpen, filters]);

  const fetchBreakdownData = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getBreakdown(filters);
      setBreakdown(res.data);
    } catch (err) {
      console.error('Failed to fetch breakdown details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Net Movement Detailed Breakdown
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                  BONUS FEATURE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Formula: Net Movement = Purchases ({metrics?.purchases || 0}) + Transfers In ({metrics?.transfersIn || 0}) - Transfers Out ({metrics?.transfersOut || 0}) = <span className="text-emerald-400 font-bold font-mono">{metrics?.netMovement || 0} Units</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Movement Summary Bar */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-3 grid grid-cols-4 gap-4 text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Purchases</span>
            <p className="text-base font-bold text-amber-400 font-mono">+{metrics?.purchases || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Transfers In</span>
            <p className="text-base font-bold text-emerald-400 font-mono">+{metrics?.transfersIn || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Transfers Out</span>
            <p className="text-base font-bold text-rose-400 font-mono">-{metrics?.transfersOut || 0}</p>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-2">
            <span className="text-[10px] text-emerald-300 uppercase font-semibold">Net Movement</span>
            <p className="text-base font-bold text-emerald-400 font-mono">={metrics?.netMovement || 0}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-6 space-x-4">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'purchases'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Purchases ({breakdown.purchasesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('transfersIn')}
            className={`py-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'transfersIn'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Transfers In ({breakdown.transfersInList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('transfersOut')}
            className={`py-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'transfersOut'
                ? 'border-rose-400 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Transfers Out ({breakdown.transfersOutList.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              <Clock className="w-5 h-5 animate-spin mr-2 text-emerald-400" /> Loading movement records...
            </div>
          ) : (
            <>
              {/* Purchases Tab Content */}
              {activeTab === 'purchases' && (
                <div className="overflow-x-auto">
                  {breakdown.purchasesList.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">No asset purchases recorded for this filter criteria.</p>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Ref ID</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Base</th>
                          <th className="py-2.5 px-3">Asset</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Total Cost</th>
                          <th className="py-2.5 px-3">Supplier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {breakdown.purchasesList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono text-amber-400 font-medium">{item.purchase_ref}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.purchase_date.split(' ')[0]}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-200">{item.base_name}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-100">{item.asset_name}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.equipment_type}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">+{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-200">${item.total_cost.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.supplier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Transfers In Tab Content */}
              {activeTab === 'transfersIn' && (
                <div className="overflow-x-auto">
                  {breakdown.transfersInList.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">No incoming transfers recorded for this filter criteria.</p>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Transfer Ref</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Origin Base</th>
                          <th className="py-2.5 px-3">Destination Base</th>
                          <th className="py-2.5 px-3">Asset</th>
                          <th className="py-2.5 px-3 text-right">Qty Received</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {breakdown.transfersInList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono text-emerald-400 font-medium">{item.transfer_ref}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.transfer_date.split(' ')[0]}</td>
                            <td className="py-2.5 px-3 text-slate-300">{item.from_base}</td>
                            <td className="py-2.5 px-3 font-medium text-emerald-400">{item.to_base}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-100">{item.asset_name}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">+{item.quantity}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Transfers Out Tab Content */}
              {activeTab === 'transfersOut' && (
                <div className="overflow-x-auto">
                  {breakdown.transfersOutList.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">No outgoing transfers recorded for this filter criteria.</p>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Transfer Ref</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Dispatching Base</th>
                          <th className="py-2.5 px-3">Receiving Base</th>
                          <th className="py-2.5 px-3">Asset</th>
                          <th className="py-2.5 px-3 text-right">Qty Dispatched</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {breakdown.transfersOutList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono text-rose-400 font-medium">{item.transfer_ref}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.transfer_date.split(' ')[0]}</td>
                            <td className="py-2.5 px-3 font-medium text-rose-400">{item.from_base}</td>
                            <td className="py-2.5 px-3 text-slate-300">{item.to_base}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-100">{item.asset_name}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">-{item.quantity}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <CheckCircle2 className="w-3 h-3" /> {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Close Breakdown
          </button>
        </div>

      </div>
    </div>
  );
}
