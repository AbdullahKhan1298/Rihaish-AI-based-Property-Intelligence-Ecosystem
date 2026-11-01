import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';

export default function MilestoneTracker({ 
  milestones = [], 
  completionPct = 70, 
  completionStatus = 'Under Construction' 
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
      
      {/* Header with Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
            Real-Time Construction Progress Tracking
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Society-uploaded progress reports verified by on-ground Rihaish field inspectors
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
            {completionPct}% Complete
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden mb-6 p-0.5 border border-slate-200 dark:border-slate-700">
        <div 
          className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 h-full rounded-full transition-all duration-1000 shadow-sm"
          style={{ width: `${completionPct}%` }}
        />
      </div>

      {/* Milestone Timeline List */}
      <div className="space-y-4">
        {milestones.map((item, idx) => (
          <div key={idx} className="flex items-start space-x-3.5 relative">
            
            {/* Timeline Line Connector */}
            {idx !== milestones.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -ml-px z-0" />
            )}

            {/* Status Icon */}
            <div className="relative z-10 shrink-0">
              {item.status === 'Completed' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : item.status === 'In Progress' ? (
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Milestone Card Content */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {item.title}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {item.date}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                  item.status === 'Completed'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : item.status === 'In Progress'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {item.status} ({item.pct}%)
                </span>

                {item.verifiedByAdmin && (
                  <span className="flex items-center text-teal-600 dark:text-teal-400 text-[11px] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-500" />
                    Rihaish On-Ground Verified
                  </span>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
