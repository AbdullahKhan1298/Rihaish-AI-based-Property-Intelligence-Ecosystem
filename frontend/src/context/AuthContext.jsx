import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchUserProfile, fetchWatchlist, toggleWatchlistAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedWatchlist, setSavedWatchlist] = useState([]);

  // Restore session from token on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('rihaish_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchUserProfile();
        setUser({ ...data.user, token });
        // Load watchlist
        try {
          const wl = await fetchWatchlist();
          setSavedWatchlist(wl.saved_properties?.map(s => s.property_id) || []);
        } catch { /* watchlist optional */ }
      } catch (err) {
        console.warn('[Auth] Session restore failed:', err.message);
        localStorage.removeItem('rihaish_token');
        localStorage.removeItem('rihaish_user');
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // Listen for auth expiry events from API client
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setSavedWatchlist([]);
    };
    window.addEventListener('rihaish:auth-expired', handler);
    return () => window.removeEventListener('rihaish:auth-expired', handler);
  }, []);

  const login = useCallback((userData) => {
    // Store token separately for API auth headers
    if (userData.access_token) {
      localStorage.setItem('rihaish_token', userData.access_token);
    }
    const userObj = userData.user || userData;
    localStorage.setItem('rihaish_user', JSON.stringify(userObj));
    setUser({ ...userObj, token: userData.access_token });

    // Load watchlist after login
    fetchWatchlist()
      .then(wl => setSavedWatchlist(wl.saved_properties?.map(s => s.property_id) || []))
      .catch(() => {});

    return userObj;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rihaish_token');
    localStorage.removeItem('rihaish_user');
    setUser(null);
    setSavedWatchlist([]);
  }, []);

  const updateSubscription = useCallback((subscriptionData) => {
    setUser(prev => prev ? {
      ...prev,
      is_subscribed: true,
      subscription_plan: subscriptionData.plan_name
    } : null);
    // Update stored user
    const stored = localStorage.getItem('rihaish_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.is_subscribed = true;
      parsed.subscription_plan = subscriptionData.plan_name;
      localStorage.setItem('rihaish_user', JSON.stringify(parsed));
    }
  }, []);

  const toggleWatchlist = useCallback(async (propertyId, city = 'islamabad') => {
    if (!user) return;
    try {
      const res = await toggleWatchlistAPI(propertyId, city);
      if (res.is_saved) {
        setSavedWatchlist(prev => [...prev, propertyId]);
      } else {
        setSavedWatchlist(prev => prev.filter(id => id !== propertyId));
      }
      return res;
    } catch (err) {
      console.error('[Watchlist] Toggle failed:', err.message);
    }
  }, [user]);

  const isSaved = useCallback((propertyId) => {
    return savedWatchlist.includes(propertyId);
  }, [savedWatchlist]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        role: user?.role || 'guest',
        isSubscribed: !!user?.is_subscribed,
        login,
        logout,
        updateSubscription,
        savedWatchlist,
        toggleWatchlist,
        isSaved,
        watchlistCount: savedWatchlist.length,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
