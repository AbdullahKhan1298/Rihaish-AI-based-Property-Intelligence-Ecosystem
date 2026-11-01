import React, { useState } from 'react';
import { Plus, Minus, Info } from 'lucide-react';

export default function AccordionFilter({ 
  title, 
  defaultOpen = true, 
  tooltipText = '', 
  children,
  badge = null 
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 py-3.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {title}
          </span>
          {badge && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full border border-teal-500/20">
              {badge}
            </span>
          )}
          {tooltipText && (
            <div className="relative group/tip cursor-pointer" title={tooltipText}>
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
            </div>
          )}
        </div>

        {/* Dynamic + / - Toggle Icon with Tooltip */}
        <div 
          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/60 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all"
          title={isOpen ? "Click to collapse filter (-)" : "Click to expand filter (+)"}
        >
          {isOpen ? (
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
        </div>
      </button>

      {/* Accordion Content Body */}
      {isOpen && (
        <div className="mt-3.5 space-y-2.5 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
