import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function MetricCard({ title, value, subtext, icon: Icon, color = 'emerald', onClick, clickable = false }) {
  const colorMap = {
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      hover: 'hover:border-emerald-500/60'
    },
    blue: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      hover: 'hover:border-blue-500/60'
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      hover: 'hover:border-amber-500/60'
    },
    rose: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      hover: 'hover:border-rose-500/60'
    },
    indigo: {
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      hover: 'hover:border-indigo-500/60'
    },
    cyan: {
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      hover: 'hover:border-cyan-500/60'
    }
  };

  const currentTheme = colorMap[color] || colorMap.emerald;

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`bg-slate-900/90 border ${currentTheme.border} rounded-xl p-5 shadow-lg transition-all duration-200 ${
        clickable ? `cursor-pointer ${currentTheme.hover} hover:shadow-xl hover:-translate-y-0.5 relative group` : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{title}</span>
        <div className={`p-2 rounded-lg ${currentTheme.bg} ${currentTheme.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {clickable && (
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 group-hover:underline">
            View Breakdown <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-[11px] text-slate-400 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
}
