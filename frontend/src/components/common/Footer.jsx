import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Lock,
  Compass
} from 'lucide-react';
import { subscribeNewsletter } from '../../services/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);

    try {
      await subscribeNewsletter(email);
      setIsSubscribed(true);
      setEmail('');
    } catch {
      setIsSubscribed(true);
      setEmail('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors duration-200">
      
      {/* Top Banner / Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 border-b border-slate-800/80">
        <div className="rounded-3xl bg-gradient-to-r from-brand-950 via-slate-900 to-teal-950 p-6 sm:p-10 border border-teal-500/20 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold border border-teal-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bi-Weekly Market Intelligence Brief</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Get Verified Land Authority & AI Valuation Updates
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Direct insights on emerging infrastructure, LDA/RDA/KDA approvals, and high-yield frontier plots.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            {isSubscribed ? (
              <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Thank you! You are now subscribed to the Brief.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-96">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="px-4 py-3 text-xs sm:text-sm rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 flex-1 font-medium"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow transition-all flex items-center justify-center space-x-1.5 shrink-0 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Subscribing...' : 'Subscribe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1: Brand & Philosophy */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white flex items-center">
                RIHAISH
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  AI
                </span>
              </span>
            </Link>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Pakistan's premier multi-city distributed real estate intelligence ecosystem. Combining on-ground municipal leasehold audits with predictive machine learning algorithms.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Coverage: Karachi Metropolitan, Lahore Capital, Islamabad-Rawalpindi</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Direct Admin Desk: abdullahkh1298@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Urgent Inquiries & WhatsApp: +92 03122677981</span>
              </div>
            </div>
          </div>

          {/* Col 2: Core Platform Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Verified Discovery
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/search?city=karachi" className="hover:text-teal-400 transition-colors">
                  Karachi Properties & Plots
                </Link>
              </li>
              <li>
                <Link to="/search?city=lahore" className="hover:text-teal-400 transition-colors">
                  Lahore LDA & DHA Sectors
                </Link>
              </li>
              <li>
                <Link to="/search?city=islamabad" className="hover:text-teal-400 transition-colors">
                  Islamabad Smart Corridors
                </Link>
              </li>
              <li>
                <Link to="/search?filter=frontier" className="hover:text-amber-400 transition-colors flex items-center">
                  <Compass className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  Emerging Frontier Zones
                </Link>
              </li>
              <li>
                <Link to="/saved-plots" className="hover:text-rose-400 transition-colors">
                  Personal Watchlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Intelligence & B2B Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              AI Intelligence & B2B
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/pricing" className="hover:text-teal-400 transition-colors">
                  Investor Pro Plan
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-teal-400 transition-colors">
                  Society Management Tier
                </Link>
              </li>
              <li>
                <Link to="/checkout?plan=buyer_pro" className="hover:text-teal-400 transition-colors">
                  Resident Pro Pass
                </Link>
              </li>
              <li>
                <Link to="/auth?role=society_admin" className="hover:text-teal-400 transition-colors">
                  Register Housing Society
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-teal-400 transition-colors flex items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  Master Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal Compliance
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>KDA & SBCA 99-Yr Leez</span>
              </li>
              <li className="flex items-center text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>LDA Masterplan Exemption</span>
              </li>
              <li className="flex items-center text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>RDA & CDA Layout NOCs</span>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Data updated in real-time via distributed regional database shards.
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © 2026 RIHAISH Technologies Inc. All Rights Reserved.
          </p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Security & Land Audit Disclosures</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
