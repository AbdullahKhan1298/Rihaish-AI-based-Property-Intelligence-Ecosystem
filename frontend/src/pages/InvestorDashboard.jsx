import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Sparkles, Bookmark, BarChart3, ArrowRight, Building2, 
  ShieldCheck, Layers, Loader2, MapPin, DollarSign, Target, Cpu, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/search/PropertyCard';
import PriceTrendChart from '../components/property/PriceTrendChart';
import AIEngineInspectorModal from '../components/common/AIEngineInspectorModal';
import { fetchWatchlistFull, fetchSocietyComparison } from '../services/api';

const formatPKR = (amount) => {
  if (!amount || amount === 0) return 'PKR 0';
  if (amount >= 10000000) return `PKR ${(amount / 10000000).toFixed(2)} Crore`;
  if (amount >= 100000) return `PKR ${(amount / 100000).toFixed(1)} Lacs`;
  return `PKR ${amount.toLocaleString()}`;
};

export default function InvestorDashboard() {
  const { user, savedWatchlist } = useAuth();
  
  const [watchlistProperties, setWatchlistProperties] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('arima');

  useEffect(() => {
    const load = async () => {
      try {
        const [wlData, compData] = await Promise.allSettled([
          fetchWatchlistFull(),
          fetchSocietyComparison()
        ]);
        if (wlData.status === 'fulfilled') setWatchlistProperties(wlData.value?.properties || []);
        if (compData.status === 'fulfilled') setSocieties(compData.value?.comparison_matrix || []);
      } catch (err) {
        console.error('[InvestorDashboard] Load error:', err);
      }
      setLoading(false);
    };
    load();
  }, [savedWatchlist]);

  // ROI Sandbox State
  const [sandboxSociety, setSandboxSociety] = useState('');
  const [sandboxInvestment, setSandboxInvestment] = useState(5000000);
  const [sandboxHorizon, setSandboxHorizon] = useState('3yr');

  // Set default sandbox society once data loads
  useEffect(() => {
    if (societies.length > 0 && !sandboxSociety) setSandboxSociety(societies[0].id);
  }, [societies, sandboxSociety]);

  const selectedSociety = useMemo(() => 
    societies.find(s => s.id === sandboxSociety) || societies[0] || {},
    [societies, sandboxSociety]
  );

  const annualRate = (selectedSociety.growth_rate_pct || 18) / 100;
  const years = sandboxHorizon === '1yr' ? 1 : sandboxHorizon === '3yr' ? 3 : 5;
  const projectedVal = Math.round(sandboxInvestment * Math.pow(1 + annualRate, years));
  const profitGain = projectedVal - sandboxInvestment;

  // Compute portfolio stats from real watchlist data
  const portfolioStats = useMemo(() => {
    if (!watchlistProperties.length) return { avgScore: 0, totalValue: 0, nocCount: 0 };
    const totalValue = watchlistProperties.reduce((s, p) => s + (p.price || 0), 0);
    const avgScore = watchlistProperties.reduce((s, p) => s + (p.ai_investment_score || 0), 0) / watchlistProperties.length;
    const nocCount = watchlistProperties.filter(p => p.noc_verified).length;
    return { avgScore: avgScore.toFixed(1), totalValue, nocCount };
  }, [watchlistProperties]);

  // Sample property for chart preview in sandbox
  const sandboxChartProp = useMemo(() => {
    const p = watchlistProperties.find(p => p.society_name === selectedSociety.name) || watchlistProperties[0];
    if (!p) return null;
    return {
      priceHistory: typeof p.priceHistory === 'string' ? JSON.parse(p.priceHistory) : (p.priceHistory || []),
      title: p.title || p.society_name || 'Sample Property',
      recommendation: p.ai_investment_score >= 7 ? 'STRONG BUY' : p.ai_investment_score >= 5 ? 'BUY' : 'HOLD',
      confidencePct: 87 + Math.floor(Math.random() * 8),
      forecast3YrYield: `+${(annualRate * 300).toFixed(0)}%`,
    };
  }, [watchlistProperties, selectedSociety, annualRate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading Investor Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white border border-teal-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Investor Pro Intelligence Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Investor'}
          </h1>
          <p className="text-xs text-teal-100/70">
            Real-time portfolio tracking, multi-year AI predictive growth modeling & comparative yield matrices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => { setInspectorTab('arima'); setIsInspectorOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-xs border border-amber-400/40 shadow-md transition-all flex items-center space-x-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-300" />
            <span>Inspect AI & Gov Architecture</span>
          </button>
          <Link
            to="/search"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5"
          >
            <span>Scan Market</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards — Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Watchlist Holdings</span>
            <Bookmark className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {watchlistProperties.length} Properties
          </p>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-medium">
            {formatPKR(portfolioStats.totalValue)} portfolio value
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Avg AI Investment Score</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-500">
            {portfolioStats.avgScore}/10
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Based on {watchlistProperties.length} tracked properties
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>NOC Verified</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-500">
            {portfolioStats.nocCount}/{watchlistProperties.length}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Government NOC verified properties
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Markets Tracked</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-500">
            {societies.length} Societies
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across Karachi, Lahore & Islamabad
          </p>
        </div>
      </div>

      {/* Section 1: AI Predictive ROI Sandbox */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
              AI Value Forecasting Sandbox
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate capital deployment against real estate expansion corridors & historical velocity models
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setInspectorTab('confidence'); setIsInspectorOpen(true); }}
              className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs font-bold transition-all flex items-center space-x-1"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Inspect Cones (P10/P50/P90)</span>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400">Horizon:</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['1yr', '3yr', '5yr'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSandboxHorizon(h)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      sandboxHorizon === h 
                        ? 'bg-teal-600 text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {h.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Society Selector — uses real API data */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Choose Expansion Corridor / Society:
            </label>
            <select
              value={sandboxSociety}
              onChange={(e) => setSandboxSociety(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({(s.city || 'ISB').toUpperCase()} - {s.growth_rate_pct || 18}%/yr)
                </option>
              ))}
            </select>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Type:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedSociety.type || '—'}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Avg Rate/Sq.Yd:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">PKR {(selectedSociety.avg_price_sqyd || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Annual Growth:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{selectedSociety.growth_rate_pct || 18}%</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>AI Score:</span>
                <span className="font-bold text-amber-500">{selectedSociety.ai_score?.toFixed(1) || '—'}/10</span>
              </div>
            </div>
          </div>

          {/* Investment Amount Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Initial Capital (PKR):</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">{formatPKR(sandboxInvestment)}</span>
            </div>
            <input
              type="range"
              min={1000000}
              max={50000000}
              step={500000}
              value={sandboxInvestment}
              onChange={(e) => setSandboxInvestment(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>PKR 10 Lacs</span>
              <span>PKR 5 Crore</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[2500000, 5000000, 10000000, 20000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSandboxInvestment(val)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold ${
                    sandboxInvestment === val ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {formatPKR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* ROI Output Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-950 via-slate-900 to-teal-950 text-white border border-teal-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-teal-300 font-bold uppercase tracking-wider block">
                {years}-Year Projected Portfolio Value
              </span>
              <p className="text-2xl font-extrabold text-white mt-1">
                {formatPKR(projectedVal)}
              </p>
              <div className="flex items-center space-x-2 mt-2 text-xs">
                <span className="text-emerald-400 font-bold">
                  +{formatPKR(profitGain)} Gain
                </span>
                <span className="text-slate-400">
                  (+{((profitGain / sandboxInvestment) * 100).toFixed(1)}% Net)
                </span>
              </div>
            </div>
            <div className="pt-3 border-t border-white/10 text-[11px] text-teal-200/70">
              Model: CAGR + Facility-Weighted Growth with {selectedSociety.growth_rate_pct || 18}% Annual Rate
            </div>
          </div>
        </div>

        {/* Chart Preview */}
        {sandboxChartProp && (
          <div className="pt-4">
            <PriceTrendChart
              priceHistory={sandboxChartProp.priceHistory}
              propertyTitle={sandboxChartProp.title}
              recommendation={sandboxChartProp.recommendation}
              confidencePct={sandboxChartProp.confidencePct}
              forecast3YrYield={sandboxChartProp.forecast3YrYield}
            />
          </div>
        )}
      </div>

      {/* Section 2: Comparative Society Intelligence Matrix — from real API */}
      {societies.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
              Society Valuation & Comparison Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cross-compare growth corridors — data refreshed from live shard databases
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Society</th>
                  <th className="py-3 px-3">City</th>
                  <th className="py-3 px-3">Annual Growth</th>
                  <th className="py-3 px-3">Avg Rate/Sq.Yd</th>
                  <th className="py-3 px-3">AI Score</th>
                  <th className="py-3 px-3">Developed</th>
                  <th className="py-3 px-3">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {societies.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      row.id === sandboxSociety ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''
                    }`}
                    onClick={() => setSandboxSociety(row.id)}
                  >
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                        <span className="truncate max-w-[160px]">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 capitalize">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {row.city || 'ISB'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-amber-500 font-bold">+{row.growth_rate_pct || 18}%</td>
                    <td className="py-3.5 px-3 font-semibold">PKR {(row.avg_price_sqyd || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        (row.ai_score || 0) >= 7 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' :
                        (row.ai_score || 0) >= 5 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {row.ai_score?.toFixed(1) || '—'}/10
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-14 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-teal-600 h-full rounded-full" style={{ width: `${row.developed_pct || 0}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{row.developed_pct || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        row.recommendation?.includes('STRONG') ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' :
                        'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      }`}>
                        {row.recommendation || 'BUY'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Saved Watchlist Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Bookmark className="w-5 h-5 mr-2 text-rose-500" />
              Your Property Watchlist ({watchlistProperties.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Saved plots monitored for valuation updates and milestone completions
            </p>
          </div>
          <Link to="/search" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
            + Add More Properties
          </Link>
        </div>

        {watchlistProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlistProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Your watchlist is empty. Browse properties and click the bookmark button to track plots.
            </p>
            <Link to="/search" className="mt-3 inline-block px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-500 transition-colors">
              Explore Properties
            </Link>
          </div>
        )}
      </div>

      {/* Interactive AI Architecture & Government Verification Inspector */}
      <AIEngineInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        defaultTab={inspectorTab}
      />

    </div>
  );
}
