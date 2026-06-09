import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 bg-white/40 rounded-2xl gap-4 min-h-[300px]">
      {Icon && (
        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 shadow-xs">
          <Icon className="w-8 h-8" />
        </div>
      )}
      
      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95 cursor-pointer mt-2"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
