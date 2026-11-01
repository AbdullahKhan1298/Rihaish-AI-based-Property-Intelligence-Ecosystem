import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Server, 
  ArrowRight, 
  Key, 
  AlertTriangle,
  Mail,
  Eye,
  EyeOff,
  User,
  Check,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login', 'register', 'otp', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');

  // Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await handleResponse(res);
      login(data);
      navigate('/dashboard/admin');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Registration — Send OTP
  const handleAdminRegisterInit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/send-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName.trim(), email: email.trim().toLowerCase(), password })
      });
      const data = await handleResponse(res);
      setOtpNotice(data.message || `Verification code sent to ${email}`);
      setMode('otp');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate admin registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAdminSlot = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/admin/reset-admin-slot`, { method: 'POST' });
      const data = await handleResponse(res);
      setSuccessMessage(data.message);
      setMode('register');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset admin slot.');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin OTP Verify & Finalize
  const handleAdminOtpVerify = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/verify-otp-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp_code: otpCode, name: fullName.trim(), password })
      });
      const data = await handleResponse(res);
      login(data);
      navigate('/dashboard/admin');
    } catch (err) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password — Send Reset OTP
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await handleResponse(res);
      setSuccessMessage(data.message);
      setMode('reset');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp_code: otpCode, new_password: newPassword })
      });
      const data = await handleResponse(res);
      setSuccessMessage(data.message);
      setTimeout(() => setMode('login'), 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Rihaish Platform Master Portal
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'register' || mode === 'otp'
              ? 'Register as the first Platform Administrator with OTP verification.'
              : mode === 'forgot' || mode === 'reset'
              ? 'Reset your admin account password securely.'
              : 'Restricted access for platform administrators, NOC auditors & shard infrastructure engineers.'}
          </p>
        </div>

        {/* Security Alert Banner */}
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-start space-x-2 text-xs text-purple-300">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>This console controls distributed database shards (Khi, Lhr, Isb) and government NOC approvals.</span>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-400 font-semibold space-y-2">
            <p>{errorMessage}</p>
            {errorMessage.toLowerCase().includes('already exists') && (
              <button
                type="button"
                onClick={handleResetAdminSlot}
                className="inline-block px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/40 transition-colors"
              >
                Reset Admin Slot & Allow First-Come Registration
              </button>
            )}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-400 font-semibold">
            {successMessage}
          </div>
        )}

        {/* ─── LOGIN MODE ─── */}
        {mode === 'login' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Admin Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rihaish.ai"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Master Security Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Authenticate Master Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button type="button" onClick={() => { setMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }} className="text-purple-400 hover:text-purple-300 font-semibold">
                Forgot Password?
              </button>
              <button type="button" onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }} className="text-teal-400 hover:text-teal-300 font-semibold">
                Register New Admin
              </button>
            </div>
          </form>
        )}

        {/* ─── REGISTER MODE ─── */}
        {mode === 'register' && (
          <form onSubmit={handleAdminRegisterInit} className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Abdullah Khan"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Admin Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rihaish.ai"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Sending OTP...' : 'Proceed to OTP Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button type="button" onClick={() => { setMode('login'); setErrorMessage(''); }} className="w-full text-xs text-slate-400 hover:text-white font-semibold py-2">
              ← Back to Admin Login
            </button>
          </form>
        )}

        {/* ─── OTP VERIFY MODE ─── */}
        {mode === 'otp' && (
          <form onSubmit={handleAdminOtpVerify} className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-center space-y-1">
              <Mail className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h4 className="font-bold text-white text-sm">Enter Email Verification OTP</h4>
              <p className="text-xs text-slate-400">{otpNotice}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">6-Digit Security OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="e.g. 492108"
                className="w-full text-center tracking-widest text-lg font-mono py-3 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-purple-500 text-white font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setMode('register')} className="w-1/3 py-3 rounded-xl bg-slate-800 font-semibold text-xs text-slate-400">
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying...' : 'Verify & Activate Admin'}</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ─── FORGOT PASSWORD MODE ─── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Your Registered Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rihaish.ai"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Sending...' : 'Send Password Reset Code'}</span>
              <RotateCcw className="w-4 h-4" />
            </button>

            <button type="button" onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }} className="w-full text-xs text-slate-400 hover:text-white font-semibold py-2">
              ← Back to Admin Login
            </button>
          </form>
        )}

        {/* ─── RESET PASSWORD MODE ─── */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Reset OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code from email"
                className="w-full text-center tracking-widest text-lg font-mono py-3 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-purple-500 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Resetting...' : 'Reset Password & Login'}</span>
              <Check className="w-4 h-4" />
            </button>

            <button type="button" onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }} className="w-full text-xs text-slate-400 hover:text-white font-semibold py-2">
              ← Back to Admin Login
            </button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-slate-800">
          <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Return to Public Home
          </Link>
        </div>

      </div>
    </div>
  );
}
