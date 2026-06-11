import React from 'react';
import { motion } from 'framer-motion';

export const Skeleton = ({ className = '', width = 'w-full', height = 'h-4' }) => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className={`bg-linear-to-r from-slate-200 to-slate-100 rounded-lg ${width} ${height} ${className}`}
  />
);

export const SkeletonCard = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
        <Skeleton height="h-5" width="w-3/4" />
        <Skeleton height="h-4" width="w-full" />
        <Skeleton height="h-4" width="w-5/6" />
        <div className="flex gap-2 pt-2">
          <Skeleton height="h-8" width="w-20" className="rounded-md" />
          <Skeleton height="h-8" width="w-20" className="rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} height="h-12" width={j === 0 ? "w-1/4" : "w-1/3"} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonHeader = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton height="h-8" width="w-64" />
        <Skeleton height="h-4" width="w-96" />
      </div>
      <Skeleton height="h-10" width="w-32" className="rounded-lg" />
    </div>
  </div>
);
