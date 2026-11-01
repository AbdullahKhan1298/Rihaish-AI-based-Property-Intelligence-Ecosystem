import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AIChatbot from './components/common/AIChatbot';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import AuthPage from './pages/AuthPage';
import AdminLoginPage from './pages/AdminLoginPage';
import PricingPage from './pages/PricingPage';
import SavedPlotsPage from './pages/SavedPlotsPage';
import CheckoutPage from './pages/CheckoutPage';
import InvestorDashboard from './pages/InvestorDashboard';
import SocietyAdminDashboard from './pages/SocietyAdminDashboard';
import RihaishAdminDashboard from './pages/RihaishAdminDashboard';
import { useAuth } from './context/AuthContext';

// Role Guard Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Auth Expired Listener — auto-redirects on 401
function AuthExpiredHandler() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handler = () => {
      logout();
      navigate('/auth?mode=login&expired=true');
    };
    window.addEventListener('rihaish:auth-expired', handler);
    return () => window.removeEventListener('rihaish:auth-expired', handler);
  }, [navigate, logout]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        
        {/* Auth Expired Auto-Redirect */}
        <AuthExpiredHandler />

        {/* Global Header */}
        <Navbar />

        {/* Main Content Viewport */}
        <main className="flex-1">
          <Routes>
            {/* Public Discovery Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/saved-plots" element={<SavedPlotsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* Role Protected Dashboards */}
            <Route
              path="/dashboard/investor"
              element={
                <ProtectedRoute allowedRoles={['investor', 'admin']}>
                  <InvestorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/society"
              element={
                <ProtectedRoute allowedRoles={['society_admin', 'admin']}>
                  <SocietyAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RihaishAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Floating AI Assistant */}
        <AIChatbot />

        {/* Global Footer */}
        <Footer />

      </div>
    </ErrorBoundary>
  );
}
