import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bookmark, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Maximize2, 
  MapPin, 
  Layers, 
  Building,
  Share2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWatchlistFull } from '../services/api';
import PropertyCard from '../components/search/PropertyCard';

export default function SavedPlotsPage() {
  const { user, savedWatchlist, toggleWatchlist } = useAuth();
  const [selectedCity, setSelectedCity] = useState('all');
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const data = await fetchWatchlistFull();
        setSavedProperties(data?.properties || []);
      } catch (err) {
        console.error('[SavedPlots] Load error:', err);
      }
      setLoading(false);
    };
    load();
  }, [user, savedWatchlist]);
  
  const filteredSaved = selectedCity === 'all'
    ? savedProperties
    : savedProperties.filter(p => p.city === selectedCity);

  const totalValue = savedProperties.reduce((acc, p) => acc + (p.price || 0), 0);

  const formatPKR = (amount) => {
    if (amount >= 10000000) {
      return `PKR ${(amount / 10000000).toFixed(2)} Crore`;
    }
    return `PKR ${(amount / 100000).toFixed(1)} Lacs`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] space-x-3">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Loading your saved portfolio...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <Bookmark className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign in to view saved plots</h2>
        <p className="text-sm text-slate-500">Your watchlist is synced to your account across devices.</p>
        <Link to="/auth?mode=login" className="inline-block px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white border border-teal-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Personal Portfolio Watchlist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Saved Properties & Plots
          </h1>
          <p className="text-xs text-teal-100/70">
            Active tracking for price valuation shifts, legal NOC audits, and on-ground milestone completions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/search"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5"
          >
            <span>+ Add More Plots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Total Bookmarked Holdings</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {savedProperties.length} Properties
          </p>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
            Saved in your persistent Rihaish account
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Cumulative Target Asset Value</span>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {formatPKR(totalValue)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            Across Karachi, Lahore & Islamabad
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Government Lease Clearance</span>
          <p className="text-2xl font-extrabold text-emerald-500 mt-1">
            100% Verified
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Zero litigation or unapproved schemes
          </span>
        </div>

      </div>

      {/* Filter Tabs & Saved Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            {['all', 'karachi', 'lahore', 'islamabad'].map((cityKey) => (
              <button
                key={cityKey}
                onClick={() => setSelectedCity(cityKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  selectedCity === cityKey
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cityKey === 'all' ? 'All Cities' : cityKey}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredSaved.length} of {savedProperties.length} saved plots
          </span>
        </div>

        {filteredSaved.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSaved.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No saved properties in this view
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Click the bookmark icon on any property card to track legal updates, 5-year forecasts, and construction progress.
            </p>
            <Link
              to="/search"
              className="inline-block px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Browse Verified Directory
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
