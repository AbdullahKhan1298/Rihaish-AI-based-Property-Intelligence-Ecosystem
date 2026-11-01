import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Share2, 
  Bookmark, 
  Maximize2, 
  Layers, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PropertyCard({ property }) {
  const { isSaved, toggleWatchlist } = useAuth();
  const [copied, setCopied] = useState(false);
  const saved = isSaved(property.id);

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/property/${property.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out ${property.title} in ${property.society_name} on RIHAISH`,
          url: shareUrl,
        });
      } catch (err) {
        // Fallback
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(property.id, property.city);
  };

  return (
    <div className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      
      {/* Image Gallery Trigger / Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Government Lease Verification Badge */}
          {property.leaseStatus?.verified ? (
            <div className="pointer-events-auto px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[11px] font-bold flex items-center space-x-1 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>99-Yr Leez / NOC Clear</span>
            </div>
          ) : (
            <div className="pointer-events-auto px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 text-[11px] font-semibold">
              Pending Audit
            </div>
          )}

          {/* Action Buttons: Share & Save */}
          <div className="flex items-center space-x-1.5 pointer-events-auto">
            <button
              onClick={handleShare}
              title="Share Property"
              className="p-2 rounded-full bg-slate-900/70 backdrop-blur-md text-white hover:bg-slate-900 hover:text-teal-400 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleSaveToggle}
              title={saved ? 'Remove from Saved Plots' : 'Save Plot'}
              className={`p-2 rounded-full backdrop-blur-md transition-colors shadow-xs ${
                saved
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-900/70 text-white hover:bg-slate-900 hover:text-rose-400'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* AI Score Badge in bottom corner */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-1.5">
          <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-teal-900/90 to-brand-900/90 backdrop-blur-md border border-teal-500/30 text-white text-xs font-extrabold flex items-center space-x-1 shadow-md">
            <Sparkles className="w-3 h-3 text-teal-300" />
            <span>AI Score: {property.ai_investment_score} / 10</span>
          </div>

          <div className="px-2 py-0.5 rounded-lg bg-emerald-500/90 text-slate-950 font-bold text-[10px]">
            {property.recommendation || 'STRONG BUY'}
          </div>
        </div>

      </div>

      {/* Card Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-teal-600 dark:text-teal-400 capitalize flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {property.society_name}
            </span>
            <span className="text-[11px] text-slate-400 capitalize font-medium">
              {property.city}
            </span>
          </div>

          <Link to={`/property/${property.id}`} className="block">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              {property.title}
            </h3>
          </Link>
        </div>

        {/* Property Specs (Size, Type, 3Yr Yield) */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-400 block">Plot Area</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
              {property.size}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Asset Type</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize truncate block">
              {property.subtype || property.type}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">3-Yr ROI</span>
            <span className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {property.forecast_3yr_yield || '+32.5%'}
            </span>
          </div>
        </div>

        {/* Price & Detail CTA */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Asking Price
            </span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {property.price_formatted}
            </p>
          </div>

          <Link
            to={`/property/${property.id}`}
            className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-600 text-teal-700 dark:text-teal-300 hover:text-white font-bold text-xs transition-all flex items-center space-x-1 group-hover:bg-teal-600 group-hover:text-white"
          >
            <span>View Full Audit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}
