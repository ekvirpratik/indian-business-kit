import React from 'react';

export default function Badge({ children, variant = 'slate', className = '' }) {
  const styles = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200/50',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
  };

  const selectedStyle = styles[variant] || styles.slate;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${selectedStyle} ${className}`}>
      {children}
    </span>
  );
}
