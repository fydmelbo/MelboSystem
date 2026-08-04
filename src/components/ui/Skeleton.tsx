import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export default function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-4 rounded"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return <div className={`skeleton ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-7 w-32 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
      <div className="skeleton h-6 w-48 rounded mb-4" />
      <div className="skeleton h-80 w-full rounded-xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="skeleton h-6 w-40 rounded" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4">
            <div className="skeleton w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
