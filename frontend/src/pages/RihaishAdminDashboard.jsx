import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Server, Database, Cpu, Activity, AlertTriangle, CheckCircle2, 
  XCircle, RefreshCw, Layers, TrendingUp, Building2, UserCheck, FileText, 
  Clock, ArrowUpRight, Terminal, Zap, HardDrive, Users, BarChart3, 
  Globe, Sparkles, Play, Calendar, Mail, DollarSign, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchShardsStatus, triggerPhysicalFailover, fetchAdminMetrics, 
  fetchAdminUsers, fetchEmailLogs, syncAllShards, fetchSystemHealth,
  fetchPipelineStatus, triggerPipelineManually, fetchAICalibration, fetchMarketTrends
} from '../services/api';

const formatPKR = (val) => {
  if (!val || val === 0) return 'PKR 0';
  if (val >= 10000000) return `PKR ${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `PKR ${(val / 100000).toFixed(1)} Lac`;
  return `PKR ${val.toLocaleString()}`;
};

export default function RihaishAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [shards, setShards] = useState([]);
  const [users, setUsers] = useState([]);
  const [emails, setEmails] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [aiCalibration, setAiCalibration] = useState(null);
  const [marketTrends, setMarketTrends] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, shardsRes, trendsRes] = await Promise.allSettled([
        fetchAdminMetrics(),
        fetchShardsStatus(),
        fetchMarketTrends(),
      ]);
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value);
      if (shardsRes.status === 'fulfilled') setShards(shardsRes.value);
      if (trendsRes.status === 'fulfilled') setMarketTrends(trendsRes.value);
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const loadTabData = async (tab) => {
    setActiveTab(tab);
    try {
      if (tab === 'users' && users.length === 0) {
        const res = await fetchAdminUsers();
        setUsers(res.users || []);
      }
      if (tab === 'emails' && emails.length === 0) {
        const res = await fetchEmailLogs();
        setEmails(res.logs || []);
      }
      if (tab === 'pipeline' && !pipeline) {
        const [pRes, aiRes] = await Promise.allSettled([
          fetchPipelineStatus(),
          fetchAICalibration(),
        ]);
        if (pRes.status === 'fulfilled') setPipeline(pRes.value);
        if (aiRes.status === 'fulfilled') setAiCalibration(aiRes.value);
      }
    } catch (err) { console.error(err); }
  };

  const handleTriggerPipeline = async () => {
    setActionLoading('pipeline');
    try {
      const res = await triggerPipelineManually();
      setPipeline(prev => ({ ...prev, ...res.result }));
    } catch (err) { console.error(err); }
    setActionLoading('');
  };

  const handleSyncShards = async () => {
    setActionLoading('sync');
    try {
      await syncAllShards();
      const newShards = await fetchShardsStatus();
      setShards(newShards);
    } catch (err) { console.error(err); }
    setActionLoading('');
  };

  const handleFailover = async (shardId) => {
    setActionLoading(`failover-${shardId}`);
    try {
      await triggerPhysicalFailover(shardId);
      const newShards = await fetchShardsStatus();
      setShards(newShards);
    } catch (err) { console.error(err); }
    setActionLoading('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading Master Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'pipeline', label: 'Data Pipeline & AI', icon: Sparkles },
    { id: 'emails', label: 'Email Audit', icon: Mail },
  ];

  const totalProps = marketTrends ? 
    (marketTrends.karachi?.total_listings || 0) + (marketTrends.lahore?.total_listings || 0) + (marketTrends.islamabad?.total_listings || 0) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">RIHAISH Master Admin</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Platform Intelligence & Infrastructure Command Center</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/investor"
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Investor View</span>
          </Link>
          <Link
            to="/dashboard/society"
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 transition-all flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Society Admin View</span>
          </Link>
          <Link
            to="/search"
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Browse Directory</span>
          </Link>
          <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            {user?.name || 'Admin'} • Master Tier
          </span>
          <button onClick={loadDashboardData} title="Refresh Live Data" className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1.5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => loadTabData(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Listings', value: totalProps, icon: Building2, color: 'from-teal-500 to-emerald-500' },
              { label: 'Registered Users', value: metrics?.total_users || 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
              { label: 'Active Subscribers', value: metrics?.subscribed_users || 0, icon: UserCheck, color: 'from-amber-500 to-orange-500' },
              { label: 'Emails Sent', value: metrics?.total_emails || 0, icon: Mail, color: 'from-purple-500 to-pink-500' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white mb-3`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Market Trends Grid */}
          {marketTrends && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['karachi', 'lahore', 'islamabad'].map(city => {
                const data = marketTrends[city];
                if (!data || data.error) return null;
                return (
                  <div key={city} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-teal-500" />
                          {city}
                        </h3>
                        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-1 rounded-full">
                          {data.total_listings} listings
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Avg Price</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatPKR(data.avg_price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Max Price</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{formatPKR(data.max_price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Min Price</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(data.min_price)}</span>
                      </div>
                      
                      {/* Top Societies */}
                      {data.top_societies?.slice(0, 4).map((soc, i) => (
                        <div key={i} className="flex justify-between items-center text-xs py-1 border-t border-slate-100 dark:border-slate-700/40">
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{soc.society_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{formatPKR(soc.avg_price)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                              {soc.avg_score?.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* User Role Distribution */}
          {marketTrends?.user_roles && marketTrends.user_roles.length > 0 && (
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                User Role Distribution
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {marketTrends.user_roles.map((r, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{r.cnt}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-1">{(r.role || 'unknown').replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ INFRASTRUCTURE TAB ═══════════════ */}
      {activeTab === 'infrastructure' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              Distributed Shard Infrastructure
            </h2>
            <button
              onClick={handleSyncShards}
              disabled={actionLoading === 'sync'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 disabled:opacity-50 border border-blue-200/60 dark:border-blue-800/40 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading === 'sync' ? 'animate-spin' : ''}`} />
              Sync All Shards
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shards.map((shard, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                <div className={`px-5 py-3 border-b ${
                  shard.is_failover_active 
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className={`w-4 h-4 ${shard.is_failover_active ? 'text-amber-600' : 'text-emerald-600'}`} />
                      <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">{shard.city_name || shard.city_key}</span>
                    </div>
                    {shard.is_failover_active ? (
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">FAILOVER</span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">HEALTHY</span>
                    )}
                  </div>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Records</span>
                    <span className="font-bold text-slate-900 dark:text-white">{shard.total_records}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Primary DB Size</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{shard.primary_file_size_kb || '—'} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Query Latency</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{shard.query_latency_ms || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Replicated TX</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{shard.replicated_tx_count || 0}</span>
                  </div>
                  <button
                    onClick={() => handleFailover(shard.shard_id)}
                    disabled={actionLoading.startsWith('failover')}
                    className="w-full mt-2 py-2 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 disabled:opacity-40 transition-colors"
                  >
                    {actionLoading === `failover-${shard.shard_id}` ? 'Executing...' : shard.is_failover_active ? 'Restore Primary' : 'Trigger Failover'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ USERS TAB ═══════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Registered Users ({users.length})
          </h2>
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                    <th className="px-4 py-3 text-left font-semibold">Plan</th>
                    <th className="px-4 py-3 text-left font-semibold">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {users.length === 0 ? (
                    <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No users registered yet. Users will appear here after signing up.</td></tr>
                  ) : users.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                          u.role === 'investor' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                          u.role === 'society_admin' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>{(u.role || 'buyer').replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{u.subscription_plan || 'Free'}</td>
                      <td className="px-4 py-3">
                        {u.is_email_verified ? 
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                          <XCircle className="w-4 h-4 text-slate-300" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ PIPELINE & AI TAB ═══════════════ */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Pipeline Status */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Data Pipeline Scheduler
              </h3>
              <button
                onClick={handleTriggerPipeline}
                disabled={actionLoading === 'pipeline'}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/50 disabled:opacity-50 border border-purple-200/60 dark:border-purple-800/40 transition-colors"
              >
                <Play className={`w-4 h-4 ${actionLoading === 'pipeline' ? 'animate-spin' : ''}`} />
                {actionLoading === 'pipeline' ? 'Running...' : 'Trigger Now'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {pipeline?.is_running ? 
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                    <XCircle className="w-4 h-4 text-slate-400" />
                  }
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{pipeline?.is_running ? 'Active' : 'Idle'}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <p className="text-xs text-slate-500 mb-1">Interval</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{pipeline?.interval_days || 15} days</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <p className="text-xs text-slate-500 mb-1">Total Runs</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{pipeline?.run_count || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <p className="text-xs text-slate-500 mb-1">Last Run</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{pipeline?.last_run ? new Date(pipeline.last_run).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </div>

          {/* AI Calibration Report */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Model Calibration Report
            </h3>
            {aiCalibration?.is_calibrated ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Models calibrated with real shard data</span>
                </div>
                {aiCalibration.report?.growth_rates && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Growth Rate Analysis ({aiCalibration.report.growth_rates.societies_analyzed} societies)</p>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(aiCalibration.report.growth_rates.tier_multipliers || {}).map(([tier, rate]) => (
                        <div key={tier} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-center">
                          <p className="text-xs text-slate-500 capitalize">{tier.replace('_', ' ')}</p>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{(rate * 100).toFixed(1)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {aiCalibration.report?.facility_analysis && (
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/30">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Facility Analysis</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {aiCalibration.report.facility_analysis.properties_analyzed} properties analyzed • 
                      Avg {aiCalibration.report.facility_analysis.avg_facilities_per_property} facilities per property • 
                      Avg rating: {aiCalibration.report.facility_analysis.avg_facility_rating}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>AI models not yet calibrated — will calibrate on next data pipeline run</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ EMAIL AUDIT TAB ═══════════════ */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-500" />
            Email Dispatch Audit Log ({emails.length})
          </h2>
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Recipient</th>
                    <th className="px-4 py-3 text-left font-semibold">Subject</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {emails.length === 0 ? (
                    <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No emails sent yet.</td></tr>
                  ) : emails.map((e, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{e.recipient_email}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{e.subject}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{e.email_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        {e.delivery_status === 'SMTP_DELIVERED' ? 
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5"/>SMTP</span> :
                          <span className="text-xs text-slate-400">Logged</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{e.sent_at ? new Date(e.sent_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
