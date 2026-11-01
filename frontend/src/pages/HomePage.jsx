import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  CheckCircle2, 
  Compass, 
  ChevronRight, 
  BarChart3, 
  Layers, 
  Building,
  Zap,
  Loader2
} from 'lucide-react';
import { fetchProperties } from '../services/api';
import PropertyCard from '../components/search/PropertyCard';

const CITIES = [
  { id: 'karachi', label: 'Karachi' },
  { id: 'lahore', label: 'Lahore' },
  { id: 'islamabad', label: 'Islamabad' }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSociety, setSelectedSociety] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [onlyVerified, setOnlyVerified] = useState(true);

  // Backend data
  const [allProperties, setAllProperties] = useState([]);
  const [allSocieties, setAllSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProperties();
        const props = data?.properties || [];
        setAllProperties(props);
        const socMap = new Map();
        props.forEach(p => {
          if (p.society_id && !socMap.has(p.society_id)) {
            socMap.set(p.society_id, { id: p.society_id, name: p.society_name || p.society_id, city: p.city });
          }
        });
        setAllSocieties(Array.from(socMap.values()));
      } catch (err) {
        console.error('[HomePage] Load error:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Filtered societies based on city
  const availableSocieties = selectedCity === 'all' 
    ? allSocieties 
    : allSocieties.filter(s => s.city === selectedCity);

  const featuredProperties = allProperties.filter(p => p.featured).slice(0, 3);
  const highYieldCorridors = allProperties.filter(p => (p.ai_investment_score || 0) >= 9.2).slice(0, 3);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity !== 'all') params.append('city', selectedCity);
    if (selectedSociety !== 'all') params.append('society', selectedSociety);
    if (selectedType !== 'all') params.append('type', selectedType);
    if (onlyVerified) params.append('verified', 'true');
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      
      {/* Hero Section with Teal Gradient and Architectural Background Overlay */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-gradient-to-br from-brand-900 via-brand-800 to-slate-950 text-white">
        
        {/* Subtle Architectural Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#2DD4BF_1px,transparent_1px)] [background-size:24px_24px]"
        />
        
        {/* Subtle Architectural Render Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')`
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Pill / Signal */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-teal-400/10 border border-teal-400/30 backdrop-blur-md text-teal-300 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
              <span>Next-Gen Property Intelligence & Predictive Valuation</span>
            </div>
          </div>

          {/* Main Headline (Punchy, Globally Scalable) */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Know where your value grows <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-amber-300">
                before you buy the plot.
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-teal-50/80 max-w-2xl mx-auto font-medium leading-relaxed">
              Unify property discovery with AI-backed 5-year price forecasting, 100% verified government lease records, and live construction milestone tracking.
            </p>
          </div>

          {/* Interactive Search & Filter Card */}
          <div className="mt-10 max-w-5xl mx-auto">
            <form 
              onSubmit={handleSearchSubmit}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white/20 dark:border-slate-800 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* City Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-teal-600 dark:text-teal-400" />
                    Target City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedSociety('all');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="all">All Metros & Regions</option>
                    <option value="karachi">Karachi</option>
                    <option value="lahore">Lahore</option>
                    <option value="islamabad">Islamabad / Rawalpindi</option>
                  </select>
                </div>

                {/* Society / Corridor Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center">
                    <Building className="w-3.5 h-3.5 mr-1 text-teal-600 dark:text-teal-400" />
                    Society / Corridor
                  </label>
                  <select
                    value={selectedSociety}
                    onChange={(e) => setSelectedSociety(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="all">All Growth Sectors</option>
                    {availableSocieties.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.growthRate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1 text-teal-600 dark:text-teal-400" />
                    Asset Category
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="all">All Asset Types</option>
                    <option value="Plot">Residential & Commercial Plots</option>
                    <option value="House">Houses & Luxury Villas</option>
                    <option value="Apartment">Modern Apartments</option>
                  </select>
                </div>

                {/* Submit Search Button */}
                <div className="flex flex-col justify-end">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-teal-700/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Search className="w-4 h-4" />
                    <span>Run AI Discovery</span>
                  </button>
                </div>

              </div>

              {/* Bottom Quick Toggles */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 gap-2">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 accent-teal-600"
                  />
                  <span className="font-semibold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                    Only Show Government Lease & NOC Verified Plots
                  </span>
                </label>

                <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Trending Searches:</span>
                  <Link to="/search?society=capital-smart" className="text-teal-600 dark:text-teal-400 hover:underline">
                    Capital Smart City
                  </Link>
                  <span>•</span>
                  <Link to="/search?society=northern-bypass" className="text-teal-600 dark:text-teal-400 hover:underline">
                    Northern Bypass
                  </Link>
                  <span>•</span>
                  <Link to="/search?society=lda-city" className="text-teal-600 dark:text-teal-400 hover:underline">
                    LDA City
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {/* Market Intelligence Barometer */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <p className="text-2xl sm:text-3xl font-extrabold text-teal-300">28,500+</p>
              <p className="text-xs text-teal-100/70 mt-1">Verified Plots Indexed</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300">94.2%</p>
              <p className="text-xs text-teal-100/70 mt-1">AI Prediction Accuracy</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">100%</p>
              <p className="text-xs text-teal-100/70 mt-1">NOC / Lease Audited</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">3 Shards</p>
              <p className="text-xs text-teal-100/70 mt-1">Distributed Region Nodes</p>
            </div>
          </div>

        </div>
      </section>

      {/* Section 1: Emerging High-Growth Expansion Corridors (Addressing Population Expansion & New Frontiers) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Frontier Development Zones</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Emerging High-Growth Corridors
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              High-potential suburban expansion corridors where infrastructure investments, motorway links, and urban migration are delivering 30%+ annualized capital growth.
            </p>
          </div>

          <Link
            to="/search?filter=frontier"
            className="inline-flex items-center space-x-1.5 text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors"
          >
            <span>Explore All 18 Corridors</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highYieldCorridors.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      </section>

      {/* Section 2: Why Rihaish AI — Core Technology Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              The Intelligence Layer for Real Estate
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Moving beyond static, unverified property portals with four predictive machine learning systems.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                5-Year AI Forecasting
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Time-series ARIMA and multivariate regression models forecasting future value trajectory with clear upper and lower confidence intervals.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Verified Government Lease
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Every listing is cross-referenced with government land authority archives (KDA, LDA, RDA, CDA) to ensure 100% legal transparency before you invest.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Facility Proximity Radar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Geospatial distance and travel-time computation to nearest mosques, top schools, tertiary hospitals, expressways, and commercial markets.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live Milestone Tracking
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dated progress updates with verified site photos and audit stamps for under-construction developments without needing a physical site visit.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Featured Top AI Picks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold border border-teal-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Top AI Rated Assets</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Featured Verified Opportunities
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Curated prime selections combining high liquidity, clean title records, and exceptional rental yield forecasts.
            </p>
          </div>

          <Link
            to="/search"
            className="inline-flex items-center space-x-1.5 text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors"
          >
            <span>View All Properties</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProperties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      </section>

      {/* Section 4: Call to Action for Societies & Developers (B2B) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-teal-900 text-white p-8 sm:p-12 border border-teal-500/30 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" />
              <span>For Housing Societies & Developers</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Publish Your Verified Inventory to 25,000+ Active Investors
            </h2>
            
            <p className="text-sm sm:text-base text-teal-100/80 leading-relaxed">
              Showcase your project's legal NOCs, publish dated construction milestones, and access qualified domestic and overseas investor syndicates with Rihaish B2B Portal.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="px-6 py-3 rounded-xl bg-white text-teal-950 font-bold text-sm hover:bg-teal-50 transition-colors shadow-lg shadow-black/20"
              >
                View Subscription Plans
              </Link>
              <Link
                to="/auth?role=society_admin&mode=register"
                className="px-6 py-3 rounded-xl bg-teal-700/60 hover:bg-teal-700 border border-white/20 text-white font-bold text-sm transition-colors"
              >
                Register Your Society
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
