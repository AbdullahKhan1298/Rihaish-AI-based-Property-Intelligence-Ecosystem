import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Info,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PriceTrendChart({ 
  priceHistory = [], 
  propertyTitle = 'Property', 
  recommendation = 'STRONG BUY',
  confidencePct = 94,
  forecast3YrYield = '+34.6%'
}) {
  const { isAuthenticated, role } = useAuth();
  const [previewUnlocked, setPreviewUnlocked] = useState(false);
  const [horizon, setHorizon] = useState('3yr'); // '1yr' | '3yr' | '5yr'

  const isInvestorOrAdmin = (isAuthenticated && (role === 'investor' || role === 'admin' || role === 'society_admin')) || previewUnlocked;

  const formatPKRTooltip = (val) => {
    if (!val) return 'PKR 0';
    if (val >= 10000000) {
      return `PKR ${(val / 10000000).toFixed(2)} Crore`;
    }
    return `PKR ${(val / 100000).toFixed(1)} Lacs`;
  };

  const chartData = priceHistory.map(item => ({
    ...item,
    formattedPrice: item.price ? (item.price / 100000).toFixed(1) : null,
    lowerFormatted: item.lower ? (item.lower / 100000).toFixed(1) : null,
    upperFormatted: item.upper ? (item.upper / 100000).toFixed(1) : null,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs relative overflow-hidden">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Price Trend & Growth Forecast
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical valuations + ML time-series projection with {confidencePct}% statistical confidence
          </p>
        </div>

        {/* Action Recommendation Pill */}
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-500 animate-pulse" />
            <span>AI Signal: {recommendation}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
            Projected 3-Yr ROI: {forecast3YrYield}
          </div>
        </div>
      </div>

      {/* Horizon Switcher */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Forecast Projection Model:
        </span>
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setHorizon('1yr')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              horizon === '1yr'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1-Year Horizon
          </button>
          <button
            type="button"
            onClick={() => setHorizon('3yr')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              horizon === '3yr'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            3-Year Horizon (Optimal)
          </button>
          <button
            type="button"
            onClick={() => setHorizon('5yr')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              horizon === '5yr'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            5-Year Macro
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="relative w-full h-72 sm:h-80">
        
        {/* Recharts Area Plot */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceTealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={{ stroke: '#475569', opacity: 0.3 }}
            />
            
            <YAxis 
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickFormatter={(v) => `PKR ${v}L`}
              axisLine={{ stroke: '#475569', opacity: 0.3 }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
                      <p className="font-bold text-teal-400 mb-1">{label}</p>
                      <p className="font-semibold text-white">
                        Value: {formatPKRTooltip(data.price)}
                      </p>
                      {data.lower && (
                        <p className="text-[11px] text-amber-400 mt-1">
                          Confidence Range: {formatPKRTooltip(data.lower)} — {formatPKRTooltip(data.upper)}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Price line & Area */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#0D9488"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#priceTealGradient)"
            />

            {/* Upper bound line */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="#F59E0B"
              strokeWidth={1}
              strokeDasharray="4 4"
              fillOpacity={0.5}
              fill="url(#confidenceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Premium Blur Overlay (Non-cutting, edge-to-edge frosted glass) */}
        {!isInvestorOrAdmin && (
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-md rounded-xl flex items-center justify-center p-4 z-20 transition-all">
            <div className="max-w-md w-full text-center bg-white/95 dark:bg-slate-900/95 p-6 rounded-2xl border border-teal-500/30 shadow-2xl space-y-4">
              
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Unlock Full AI Price Trajectories & 5-Year Forecasts
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Access deep time-series forecasts, regression confidence bands, and comparative society growth velocity.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                <Link
                  to="/auth?role=investor&mode=register"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center"
                >
                  <span>Sign Up as Investor (Free)</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setPreviewUnlocked(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
                >
                  Instant Preview
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Join 4,200+ active investors using Rihaish Intelligence
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Footer Info Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className="w-3 h-1 bg-teal-600 rounded mr-1.5"></span>
            Historical & Model Valuation
          </span>
          <span className="flex items-center">
            <span className="w-3 h-1 bg-amber-500 rounded mr-1.5"></span>
            Upper / Lower Confidence Range
          </span>
        </div>

        <span className="text-[11px] italic">
          Data Model: Multi-Variate ARIMA + Proximity Regression
        </span>
      </div>

    </div>
  );
}
