import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Building, 
  Grid, 
  ListFilter,
  Check,
  Loader2
} from 'lucide-react';
import { fetchProperties } from '../services/api';
import PropertyCard from '../components/search/PropertyCard';
import AccordionFilter from '../components/search/AccordionFilter';
import PriceRangeSlider from '../components/search/PriceRangeSlider';

// Fallback constants for filter options
const CITIES = [
  { id: 'karachi', label: 'Karachi' },
  { id: 'lahore', label: 'Lahore' },
  { id: 'islamabad', label: 'Islamabad' }
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Backend data states
  const [allProperties, setAllProperties] = useState([]);
  const [allSocieties, setAllSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mobile drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter States initialized from URL params if available
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all');
  const [selectedSociety, setSelectedSociety] = useState(searchParams.get('society') || 'all');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [maxPrice, setMaxPrice] = useState(200000000); // 20 Crore Default
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [minAiScore, setMinAiScore] = useState(0);
  const [sortBy, setSortBy] = useState('aiScore'); // 'aiScore' | 'priceAsc' | 'priceDesc' | 'yield'

  // Frontier filter shortcut
  const isFrontier = searchParams.get('filter') === 'frontier';

  // Fetch properties from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProperties();
        const props = data?.properties || [];
        setAllProperties(props);
        // Extract unique societies from properties
        const socMap = new Map();
        props.forEach(p => {
          if (p.society_id && !socMap.has(p.society_id)) {
            socMap.set(p.society_id, { id: p.society_id, name: p.society_name || p.society_id, city: p.city });
          }
        });
        setAllSocieties(Array.from(socMap.values()));
      } catch (err) {
        setError('Failed to load properties. Please check that the backend server is running.');
        console.error('[SearchPage] Load error:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Available societies for city
  const availableSocieties = selectedCity === 'all'
    ? allSocieties
    : allSocieties.filter(s => s.city === selectedCity);

  // Active filter count for mobile badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== 'all') count++;
    if (selectedSociety !== 'all') count++;
    if (selectedType !== 'all') count++;
    if (maxPrice < 200000000) count++;
    if (verifiedOnly) count++;
    if (minAiScore > 0) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCity, selectedSociety, selectedType, maxPrice, verifiedOnly, minAiScore, searchQuery]);

  // Filtering Logic — applied client-side on fetched data
  const filteredProperties = useMemo(() => {
    return allProperties.filter((item) => {
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (item.title || '').toLowerCase().includes(q);
        const matchesSociety = (item.society_name || item.society || '').toLowerCase().includes(q);
        const matchesCity = (item.city || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSociety && !matchesCity) return false;
      }

      // City filter
      if (selectedCity !== 'all' && item.city !== selectedCity) return false;

      // Society filter
      if (selectedSociety !== 'all' && item.society_id !== selectedSociety) return false;

      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) return false;

      // Price filter
      if (item.price > maxPrice) return false;

      // Minimum AI Score
      if ((item.ai_investment_score || item.aiInvestmentScore || 0) < minAiScore) return false;

      // Frontier filter
      if (isFrontier && (item.ai_investment_score || item.aiInvestmentScore || 0) < 9.1) return false;

      return true;
    }).sort((a, b) => {
      const scoreA = a.ai_investment_score || a.aiInvestmentScore || 0;
      const scoreB = b.ai_investment_score || b.aiInvestmentScore || 0;
      if (sortBy === 'aiScore') return scoreB - scoreA;
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      if (sortBy === 'yield') return parseFloat(b.forecast_3yr_yield || b.forecast3YrYield || 0) - parseFloat(a.forecast_3yr_yield || a.forecast3YrYield || 0);
      return 0;
    });
  }, [allProperties, searchQuery, selectedCity, selectedSociety, selectedType, maxPrice, verifiedOnly, minAiScore, sortBy, isFrontier]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedSociety('all');
    setSelectedType('all');
    setMaxPrice(200000000);
    setVerifiedOnly(false);
    setMinAiScore(0);
    setSearchParams({});
  };

  // Reusable Filter Sidebar Content
  const FilterContent = (
    <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
      
      {/* Search by Keyword */}
      <div className="pb-4">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
          Keyword Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. 10 Marla, DHA, Silicon..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Target City Accordion */}
      <AccordionFilter 
        title="Target City & Shard" 
        defaultOpen={true}
        tooltipText="Select which regional distributed database shard to query"
      >
        <div className="space-y-1.5">
          {CITIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCity(c.id);
                setSelectedSociety('all');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCity === c.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{c.name}</span>
              {c.shardStatus && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedCity === c.id ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {c.shardStatus}
                </span>
              )}
            </button>
          ))}
        </div>
      </AccordionFilter>

      {/* Society / Corridor Accordion */}
      <AccordionFilter 
        title="Society & Sector" 
        defaultOpen={true}
        tooltipText="Filter by established societies or emerging frontier growth corridors"
      >
        <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
          <button
            type="button"
            onClick={() => setSelectedSociety('all')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedSociety === 'all'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Societies ({availableSocieties.length})
          </button>
          {availableSocieties.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSociety(s.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                selectedSociety === s.id
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate mr-1">{s.name}</span>
              <span className="text-[10px] text-amber-500 font-bold shrink-0">{s.growthRate}</span>
            </button>
          ))}
        </div>
      </AccordionFilter>

      {/* Price Range Slider */}
      <AccordionFilter 
        title="Max Price (PKR)" 
        defaultOpen={true}
        tooltipText="Interactive budget filter with live PKR Lacs/Crores calculation"
      >
        <PriceRangeSlider
          currentMax={maxPrice}
          onChange={setMaxPrice}
        />
      </AccordionFilter>

      {/* Property Asset Type */}
      <AccordionFilter 
        title="Property Asset Type" 
        defaultOpen={true}
        tooltipText="Choose between Residential / Commercial Plots or Finished Homes"
      >
        <div className="space-y-1.5">
          {['all', 'Plot', 'House', 'Apartment'].map((t) => (
            <label
              key={t}
              className="flex items-center space-x-2.5 px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium"
            >
              <input
                type="radio"
                name="propType"
                checked={selectedType === t}
                onChange={() => setSelectedType(t)}
                className="w-3.5 h-3.5 text-teal-600 focus:ring-teal-500 accent-teal-600"
              />
              <span>{t === 'all' ? 'All Property Types' : t === 'Plot' ? 'Plots (Residential & Commercial)' : t === 'House' ? 'Houses & Designer Villas' : 'Apartments'}</span>
            </label>
          ))}
        </div>
      </AccordionFilter>

      {/* Trust & AI Scores */}
      <AccordionFilter 
        title="Trust & AI Intelligence" 
        defaultOpen={true}
        tooltipText="Filter by verified government lease records and AI growth ratings"
      >
        <div className="space-y-3 pt-1">
          {/* Verified Lease Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 accent-teal-600"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              Verified Government Lease
            </span>
          </label>

          {/* AI Score Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Min AI Score:</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {minAiScore > 0 ? `${minAiScore}+ / 10` : 'Any Score'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={9.5}
              step={0.5}
              value={minAiScore}
              onChange={(e) => setMinAiScore(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>
        </div>
      </AccordionFilter>

      {/* Reset Action */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleResetFilters}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center space-x-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>

    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header & Mobile Filter Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Explore Properties & Investment Plots
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Showing <span className="font-bold text-teal-600 dark:text-teal-400">{filteredProperties.length}</span> verified properties across distributed city shards
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Mobile Filter Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-teal-900 text-[10px] font-extrabold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort By Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="aiScore">Top AI Score (Recommended)</option>
              <option value="yield">Highest 3-Yr ROI Yield</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Layout Grid: Sidebar Filters + Property Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Left Filter Sidebar (Accessible Accordion) */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
                Refine Search
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Clear ({activeFiltersCount})
                </button>
              )}
            </div>

            {FilterContent}
          </div>
        </aside>

        {/* Right Main Content: Property Cards Grid */}
        <main className="lg:col-span-3">
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No matching properties found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Try widening your price range or clearing specific society filters to see more results across city shards.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </main>

      </div>

      {/* Mobile Slide-in Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between z-10 animate-slideLeft">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <SlidersHorizontal className="w-4 h-4 mr-2 text-teal-600" />
                  Filter Properties
                </h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {FilterContent}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-md"
              >
                Apply Filters ({filteredProperties.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
