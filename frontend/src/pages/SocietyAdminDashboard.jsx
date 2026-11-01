import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  Upload, 
  Layers, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchSocietyListings, fetchSocietySubscription, fetchSocietyLeads } from '../services/api';

export default function SocietyAdminDashboard() {
  const { user } = useAuth();
  
  // Backend data
  const [inventory, setInventory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [listingsData, subData, leadsData] = await Promise.allSettled([
          fetchSocietyListings(),
          fetchSocietySubscription(),
          fetchSocietyLeads()
        ]);
        if (listingsData.status === 'fulfilled') setInventory(listingsData.value?.listings || []);
        if (subData.status === 'fulfilled') setSubscription(subData.value);
        if (leadsData.status === 'fulfilled') setLeads(leadsData.value?.leads || []);
      } catch (err) {
        console.error('[SocietyAdmin] Load error:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // New plot modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlot, setNewPlot] = useState({
    title: '',
    subtype: 'Residential Plot',
    priceFormatted: 'PKR 45.0 Lacs',
    size: '5 Marla (125 Sq.Yd)',
    status: 'Available',
    nocNumber: 'RDA/2026/AUTH-77',
    completionPct: 60
  });

  // Milestone updates
  const [milestones, setMilestones] = useState([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestonePct, setNewMilestonePct] = useState(75);

  const handleAddPlot = (e) => {
    e.preventDefault();
    const created = {
      id: 'prop-custom-' + Date.now(),
      title: newPlot.title || '5 Marla Premium Sector Plot',
      society: 'Capital Smart City Silicon Village',
      societyId: 'capital-smart',
      city: 'islamabad',
      type: 'Plot',
      subtype: newPlot.subtype,
      price: 4500000,
      priceFormatted: newPlot.priceFormatted,
      pricePerSqFt: 'PKR 3,200/sq.yd',
      size: newPlot.size,
      sizeNumeric: 125,
      bedrooms: 0,
      bathrooms: 0,
      status: newPlot.status,
      completionStatus: 'Under Construction (70%)',
      completionPct: Number(newPlot.completionPct),
      featured: false,
      aiInvestmentScore: 9.3,
      recommendation: 'STRONG BUY',
      confidencePct: 93,
      forecast3YrYield: '+34.0%',
      priceHistory: [
        { year: '2024', price: 3200000 },
        { year: '2025', price: 3900000 },
        { year: '2026', price: 4500000 },
        { year: '2027', price: 5700000 }
      ],
      leaseStatus: {
        verified: true,
        title: 'RDA Approved Masterplan NOC',
        nocNumber: newPlot.nocNumber,
        issuingAuthority: 'Rawalpindi Development Authority',
        statusType: 'Direct Transfer Verified',
        transferType: 'Society Allotment',
        verificationDate: '23 Feb 2026',
        notes: 'Submitted via Society Admin Portal'
      },
      facilities: [
        { name: 'Sector Mosque', distance: '0.4 km', driveTime: '2 mins', rating: 4.8, type: 'mosque' },
        { name: 'Commercial Hub', distance: '0.6 km', driveTime: '3 mins', rating: 4.7, type: 'market' }
      ],
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
      ],
      description: 'Newly registered sector plot with clean RDA government lease clearance.'
    };

    setInventory([created, ...inventory]);
    setShowAddModal(false);
    alert('Plot listing submitted and indexed successfully!');
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const m = {
      date: 'Mar 2026',
      title: newMilestoneTitle,
      pct: Number(newMilestonePct),
      status: Number(newMilestonePct) === 100 ? 'Completed' : 'In Progress',
      verified: false
    };

    setMilestones([m, ...milestones]);
    setNewMilestoneTitle('');
    alert('Construction milestone update submitted for Rihaish field audit!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Society & Developer B2B Management Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Capital Smart City Portal
          </h1>
          <p className="text-xs text-teal-100/70">
            Society Admin: {user?.name || 'Danish Rasheed'} • Verified B2B Subscription: <span className="text-teal-300 font-bold">Growth Tier (Active)</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Plot Listing</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Total Plots in Catalog</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{inventory.length} Listed</p>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">100% Shard-Synced</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Buyer & Investor Inquiries</span>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">142 Leads</p>
          <span className="text-[11px] text-slate-400 font-medium">Last 30 days (+24% growth)</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Government NOC Status</span>
          <p className="text-2xl font-extrabold text-emerald-500 mt-1">Approved</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">RDA/MP&TE/F-PHS-TAX-28</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Active Subscription</span>
          <p className="text-2xl font-extrabold text-purple-500 mt-1">Growth Tier</p>
          <span className="text-[11px] text-slate-400 font-medium">Renews in 18 days</span>
        </div>
      </div>

      {/* Inventory Management Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Layers className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
              Plot & Property Inventory Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live inventory published to domestic and overseas investors across Karachi, Lahore & Islamabad shards
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold"
          >
            + Quick Add Plot
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-3">Listing Title</th>
                <th className="py-3 px-3">Size</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Lease Status</th>
                <th className="py-3 px-3">Availability</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                    {item.title}
                  </td>
                  <td className="py-3 px-3">{item.size}</td>
                  <td className="py-3 px-3 font-bold text-teal-600 dark:text-teal-400">{item.priceFormatted}</td>
                  <td className="py-3 px-3">{item.subtype}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold flex items-center w-max">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/property/${item.id}`}
                      className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Construction Progress Milestone Submitter */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amber-500" />
            Post Construction Milestone Progress Update
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit dated progress reports for investor transparency. Updates are verified by Rihaish audit team.
          </p>
        </div>

        {/* Milestone Submission Form */}
        <form onSubmit={handleAddMilestone} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Milestone Headline / Work Description
            </label>
            <input
              type="text"
              required
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="e.g. Sector C Main Boulevard Asphalt Carpeting Layer 2 Complete"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Sector Completion (%): {newMilestonePct}%
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={newMilestonePct}
              onChange={(e) => setNewMilestonePct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg accent-teal-600"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit Progress Report & Photos</span>
            </button>
          </div>
        </form>

        {/* Existing Milestones List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Construction Updates on Record:
          </h3>

          <div className="space-y-2">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                    m.pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}>
                    {m.pct}%
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{m.title}</p>
                    <p className="text-[11px] text-slate-400">{m.date} • Status: {m.status}</p>
                  </div>
                </div>

                <div>
                  {m.verified ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Rihaish Audit Passed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Under Field Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Plot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Add New Plot to Society Catalog
            </h3>

            <form onSubmit={handleAddPlot} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Plot Title</label>
                <input
                  type="text"
                  required
                  value={newPlot.title}
                  onChange={(e) => setNewPlot({...newPlot, title: e.target.value})}
                  placeholder="e.g. 5 Marla Sector B Park-Facing Plot"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Price Formatted</label>
                  <input
                    type="text"
                    required
                    value={newPlot.priceFormatted}
                    onChange={(e) => setNewPlot({...newPlot, priceFormatted: e.target.value})}
                    placeholder="PKR 45.0 Lacs"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Size / Dimension</label>
                  <input
                    type="text"
                    required
                    value={newPlot.size}
                    onChange={(e) => setNewPlot({...newPlot, size: e.target.value})}
                    placeholder="5 Marla (125 Sq.Yd)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Government NOC Serial #</label>
                <input
                  type="text"
                  required
                  value={newPlot.nocNumber}
                  onChange={(e) => setNewPlot({...newPlot, nocNumber: e.target.value})}
                  placeholder="RDA/2026/AUTH-77"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold"
                >
                  Publish Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
