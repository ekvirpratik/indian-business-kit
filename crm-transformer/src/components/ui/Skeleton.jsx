import React from 'react';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex border-b border-slate-100 px-6 py-4 bg-slate-50/50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-slate-200 rounded-sm mr-4 last:mr-0" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex border-b border-slate-100 px-6 py-5 last:border-b-0 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex-1 h-3.5 bg-slate-100 rounded-sm mr-4 last:mr-0" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded-sm w-1/3" />
          <div className="h-3 bg-slate-100 rounded-sm w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded-sm w-3/4" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 bg-slate-200 rounded-md w-1/4" />
        <div className="h-8 bg-slate-200 rounded-xl w-1/3" />
      </div>
    </div>
  );
}
