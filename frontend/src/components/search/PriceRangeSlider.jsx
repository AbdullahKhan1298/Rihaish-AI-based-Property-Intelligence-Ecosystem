import React from 'react';
import { Coins } from 'lucide-react';

export default function PriceRangeSlider({
  minPrice = 0,
  maxPrice = 200000000, // PKR 20 Crore
  currentMax,
  onChange
}) {
  const formatPKR = (amount) => {
    if (amount >= 10000000) {
      const cr = (amount / 10000000).toFixed(2);
      return `PKR ${cr} Crore`;
    }
    const lac = (amount / 100000).toFixed(1);
    return `PKR ${lac} Lacs`;
  };

  const presets = [
    { label: 'Under 50 Lacs', val: 5000000 },
    { label: 'Under 1 Crore', val: 10000000 },
    { label: 'Under 2.5 Crore', val: 25000000 },
    { label: 'Under 5 Crore', val: 50000000 },
    { label: 'All (Max)', val: 200000000 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">Max Budget:</span>
        <span className="text-sm font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-500/20">
          {formatPKR(currentMax)}
        </span>
      </div>

      {/* Interactive Range Input */}
      <input
        type="range"
        min={1000000} // PKR 10 Lacs
        max={maxPrice}
        step={500000}
        value={currentMax}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none"
      />

      <div className="flex justify-between text-[11px] text-slate-400">
        <span>PKR 10 Lacs</span>
        <span>PKR 20 Crore</span>
      </div>

      {/* Quick Budget Presets */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.val)}
            className={`px-2 py-1 text-[11px] rounded-md font-medium transition-all ${
              currentMax === p.val
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
