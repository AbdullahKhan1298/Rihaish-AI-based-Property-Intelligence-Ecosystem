import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  ChevronDown,
  Sparkles,
  Lock,
  Compass,
  Bookmark,
  Zap,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AIEngineInspectorModal from './AIEngineInspectorModal';

export default function Navbar() {
  const { user, isAuthenticated, role, isSubscribed, savedWatchlist, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardPath = () => {
    if (role === 'investor') return '/dashboard/investor';
    if (role === 'society_admin') return '/dashboard/society';
    if (role === 'admin') return '/dashboard/admin';
    return '/saved-plots';
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'investor':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Investor Pro</span>;
      case 'society_admin':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">Society Admin</span>;
      case 'admin':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Rihaish Master</span>;
      default:
        return (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            isSubscribed 
              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            {isSubscribed ? 'Buyer Pro' : 'Resident / Buyer'}
          </span>
        );
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-200">
      {/* Top Utility Ticker / Admin Link */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1 text-xs bg-slate-100/70 dark:bg-slate-950/70 border-b border-slate-200/40 dark:border-slate-800/40 text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-teal-600 dark:text-teal-400 font-medium">
            <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
            AI Market Intelligence: Multi-City Distributed Real Estate Platform
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>100% Government Lease (Leez) & NOC Verified Listings</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            type="button"
            onClick={() => setIsInspectorOpen(true)}
            className="flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-500 font-bold transition-colors cursor-pointer"
          >
            <Cpu className="w-3 h-3 mr-1" />
            <span>AI Architecture & Gov Audit</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link 
            to="/pricing" 
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
          >
            Society Subscriptions (B2B)
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link 
            to="/admin/login" 
            className="flex items-center hover:text-teal-600 dark:hover:text-teal-400 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <Lock className="w-3 h-3 mr-1" />
            Rihaish Admin Portal
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                RIHAISH
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-teal-500/10 dark:bg-teal-400/20 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  AI
                </span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wide font-medium">
                Property & Society Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links — Role-Based */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/') 
                  ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Home
            </Link>
            
            <Link
              to="/search"
              className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/search') 
                  ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4 mr-1.5" />
              Explore Properties
            </Link>

            {/* Emerging Corridors — visible only to logged-in users */}
            {isAuthenticated && (
              <Link
                to="/search?filter=frontier"
                className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.search.includes('frontier') 
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Compass className="w-4 h-4 mr-1.5 text-amber-500" />
                Emerging Corridors
              </Link>
            )}

            {/* Saved Plots — visible only to authenticated buyers/investors */}
            {isAuthenticated && (role === 'buyer' || role === 'investor' || role === 'admin') && (
              <Link
                to="/saved-plots"
                className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/saved-plots') 
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Bookmark className="w-4 h-4 mr-1.5 text-rose-500" />
                <span>Saved Plots</span>
                {savedWatchlist.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {savedWatchlist.length}
                  </span>
                )}
              </Link>
            )}

            {/* Role-specific Dashboard Links */}
            {isAuthenticated && role === 'investor' && (
              <Link
                to="/dashboard/investor"
                className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/dashboard/investor') 
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-1.5 text-amber-500" />
                Investor Dashboard
              </Link>
            )}

            {isAuthenticated && role === 'society_admin' && (
              <Link
                to="/dashboard/society"
                className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/dashboard/society') 
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Building2 className="w-4 h-4 mr-1.5 text-teal-500" />
                Society Dashboard
              </Link>
            )}

            {isAuthenticated && role === 'admin' && (
              <Link
                to="/dashboard/admin"
                className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/dashboard/admin') 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mr-1.5 text-purple-500" />
                Admin Dashboard
              </Link>
            )}

            <Link
              to="/pricing"
              className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/pricing') 
                  ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Subscriptions
            </Link>

          </nav>

          {/* Right Actions: AI Engine Trigger, Theme Toggle, Auth / User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* AI Architecture Inspector Trigger */}
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
              title="Open RIHAISH AI & Government Verification Architecture"
            >
              <Cpu className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
              <span>AI Engine</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Auth State Button */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium capitalize">
                      {role === 'society_admin' ? 'Society Admin' : role === 'investor' ? 'Investor Pro' : role === 'admin' ? 'Master Admin' : 'Buyer'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </button>

                {/* Dropdown Menu & Click-Outside Backdrop */}
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                    <div 
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        <div className="mt-1.5">{getRoleBadge()}</div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => navigate(getDashboardPath())}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 flex items-center space-x-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Go to My Dashboard</span>
                        </button>

                      <button
                        onClick={() => navigate('/saved-plots')}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center"
                      >
                        <Bookmark className="w-4 h-4 mr-2 text-rose-500" />
                        My Saved Plots ({savedWatchlist.length})
                      </button>

                      <button
                        onClick={() => navigate('/checkout?plan=buyer_pro')}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center"
                      >
                        <Zap className="w-4 h-4 mr-2 text-amber-500" />
                        Manage Subscription
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          navigate('/');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center font-medium"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/auth?mode=login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow transition-all"
                >
                  Join Rihaish
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
              aria-label="Open Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-slideDown">
          <nav className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-100 hover:bg-teal-50 dark:hover:bg-teal-950/50"
            >
              Home
            </Link>
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-100 hover:bg-teal-50 dark:hover:bg-teal-950/50"
            >
              Explore Properties
            </Link>
            <Link
              to="/search?filter=frontier"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-100 hover:bg-teal-50 dark:hover:bg-teal-950/50"
            >
              Emerging Corridors
            </Link>
            <Link
              to="/saved-plots"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-100 hover:bg-teal-50 dark:hover:bg-teal-950/50"
            >
              <span>Saved Plots</span>
              {savedWatchlist.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                  {savedWatchlist.length}
                </span>
              )}
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-100 hover:bg-teal-50 dark:hover:bg-teal-950/50"
            >
              Subscriptions
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-base font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Rihaish Admin Portal
            </Link>
          </nav>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(getDashboardPath());
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 text-center"
                >
                  Go to My Dashboard
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full py-2 px-4 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-center"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth?mode=login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-center font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-center font-semibold text-white bg-brand-600 hover:bg-brand-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>

    {/* Global AI Architecture & Government Audit Inspector Modal (Portaled & outside header) */}
    <AIEngineInspectorModal
      isOpen={isInspectorOpen}
      onClose={() => setIsInspectorOpen(false)}
    />
  </>
);
}
