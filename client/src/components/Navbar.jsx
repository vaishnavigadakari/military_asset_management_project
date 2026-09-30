import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ShoppingCart, 
  ArrowLeftRight, 
  UserCheck, 
  Boxes, 
  ScrollText,
  User,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, systemUsers, switchRoleUser } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
    { id: 'assignments', label: 'Assignments & Expended', icon: UserCheck },
    { id: 'inventory', label: 'Base Inventory', icon: Boxes },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText }
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Base Commander': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Logistics Officer': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & System Identifier */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wider text-slate-100 uppercase">MAMS</span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-700">v2.4 SECURE</span>
              </div>
              <p className="text-xs text-slate-400 tracking-wide font-medium">Military Asset Management System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Role Switcher & User Info */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">{user?.full_name}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {user?.base_name ? `Station: ${user.base_name}` : 'Command HQ (All Bases)'}
              </span>
            </div>

            {/* Quick RBAC Role Switcher Selector */}
            <div className="relative">
              <select
                value={user?.username || 'admin'}
                onChange={(e) => switchRoleUser(e.target.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm ${getRoleBadgeColor(user?.role)}`}
                title="Switch User Role to test Role-Based Access Control (RBAC)"
              >
                {systemUsers.map((u) => (
                  <option key={u.id} value={u.username} className="bg-slate-900 text-slate-200 py-1">
                    {u.rank_title} {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex overflow-x-auto space-x-2 py-2 border-t border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium ${
                  isActive ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
