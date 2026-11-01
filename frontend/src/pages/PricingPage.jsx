import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Lock,
  Phone,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 dark:bg-teal-400/20 text-teal-700 dark:text-teal-300 text-xs font-extrabold border border-teal-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Value-Driven Intelligence</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Subscriptions & Intelligence Tiers
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          From individual home buyers and institutional investors to master developers and housing societies — choose the plan tailored to your objectives.
        </p>
      </div>

      {/* Part 1: Buyer & Investor Consumer Intelligence Tiers */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            For Home Buyers & Real Estate Investors
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unlock AI predictive price trajectories, deep legal audit checks, and high-yield frontier radars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Resident & Buyer Pro Pass */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl transition-all">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                Resident & Buyer Pass
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Buyer Pro Annual
              </h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">PKR 4,999</span>
                <span className="text-xs text-slate-500">/ year</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ideal for individuals and families looking to purchase plots or ready homes with 100% legal security.
              </p>

              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                {[
                  '5-Year AI Predictive Valuation Trajectories',
                  'Unlimited Verified Government Lease (Leez) Audits',
                  'Interactive Geospatial Facility Proximity Radar',
                  'Personal Saved Plots Watchlist with Price Change Alerts',
                  'Direct WhatsApp Lead Routing to Verified Developers'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/checkout?plan=buyer_pro"
              className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition-all text-center flex items-center justify-center space-x-2"
            >
              <span>Get Buyer Pro Pass</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Investor Pro Annual Intelligence */}
          <div className="rounded-3xl bg-gradient-to-b from-brand-950 via-slate-900 to-teal-950 border-2 border-teal-500/50 p-8 flex flex-col justify-between space-y-6 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                Most Popular
              </span>
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                Institutional & High Net Worth
              </span>
              <h3 className="text-2xl font-bold text-white">
                Investor Pro Intelligence
              </h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-white">PKR 14,999</span>
                <span className="text-xs text-teal-200/80">/ year</span>
              </div>
              <p className="text-xs text-teal-100/70">
                Designed for high-conviction investors seeking 30%+ returns across emerging frontier expansion corridors.
              </p>

              <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs">
                {[
                  'Everything in Buyer Pro Pass Included',
                  'Interactive 1/3/5-Year Capital Allocation Sandbox',
                  'Comparative Society Valuation & Trade Velocity Matrix',
                  'Live Construction Milestone Photo Feeds & Drone Audits',
                  'Emerging Frontier Alpha Alerts (Northern Bypass, Mandra, etc.)',
                  'Direct Priority Line to Rihaish Master Analysts'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span className="text-slate-200">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/checkout?plan=investor_pro"
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xl shadow-teal-700/20 transition-all text-center flex items-center justify-center space-x-2"
            >
              <span>Unlock Investor Pro Suite</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>

      {/* Part 2: B2B Society & Developer Tiers */}
      <div className="space-y-6 pt-12 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            B2B Housing Society & Developer Plans
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Digitize your inventory, verify NOC records, post milestone updates, and connect with 45,000+ active investors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Starter Tier */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Starter Society Portal</h3>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">PKR 45,000</span>
                <span className="text-xs text-slate-400">/ mo</span>
              </div>
              <p className="text-xs text-slate-500">Up to 50 verified plot listings with government NOC status badge.</p>
              
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                {['50 Plot / Property Listings', 'Government NOC Certificate Badge', 'Quarterly Progress Reports', 'Lead Capture Dashboard'].map((f, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/checkout?plan=starter"
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 text-slate-800 dark:text-slate-200 hover:text-white font-bold text-xs text-center transition-colors block"
            >
              Subscribe Starter
            </Link>
          </div>

          {/* Growth Tier */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-teal-500 p-6 flex flex-col justify-between space-y-6 shadow-xl relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-extrabold uppercase">
              Recommended for Developers
            </span>

            <div className="space-y-3">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Growth</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Growth Developer Tier</h3>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">PKR 95,000</span>
                <span className="text-xs text-slate-400">/ mo</span>
              </div>
              <p className="text-xs text-slate-500">Up to 250 plot listings, high-growth frontier spotlight, and bi-weekly updates.</p>
              
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                {['250 Plot Listings', 'Featured High-Growth Spotlight', 'Bi-Weekly Construction Tracking', 'Direct WhatsApp & Lead Routing', 'Dedicated Verification Specialist'].map((f, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/checkout?plan=growth"
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs text-center shadow-md transition-colors block"
            >
              Subscribe Growth
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise Syndicate</h3>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">PKR 220,000</span>
                <span className="text-xs text-slate-400">/ mo</span>
              </div>
              <p className="text-xs text-slate-500">Unlimited listings, weekly drone inspection audits, and nationwide marketing.</p>
              
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                {['Unlimited Inventory', 'Top AI Investment Spotlight', 'Weekly Drone & Field Audits', 'Investor Watchlist Push Alerts', '24/7 Dedicated Account Manager'].map((f, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/checkout?plan=enterprise"
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 text-slate-800 dark:text-slate-200 hover:text-white font-bold text-xs text-center transition-colors block"
            >
              Subscribe Enterprise
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
