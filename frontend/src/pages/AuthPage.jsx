import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  Briefcase, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Key,
  RotateCcw,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendSignupOtp, verifyOtpAndRegister, loginUser, forgotPassword, resetPassword } from '../services/api';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mode: 'login' or 'register'
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
  
  // Role tab: 'buyer', 'investor', 'society_admin'
  const initialRole = searchParams.get('role') || 'buyer';
  const [selectedRole, setSelectedRole] = useState(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification Step State
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password State
  const [forgotMode, setForgotMode] = useState(false); // 'forgot', 'reset'
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsRegister(true);
    }
    if (searchParams.get('role')) {
      setSelectedRole(searchParams.get('role'));
    }
  }, [searchParams]);

  // Step 1: Submit initial registration -> Request OTP
  const handleRegisterInit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validation
    if (!fullName || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (selectedRole === 'society_admin' && (!societyName || societyName.trim().length < 3)) {
      setErrorMessage('Please enter your society/project name.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await sendSignupOtp({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: selectedRole,
        society_name: societyName || undefined
      });

      setOtpSentNotice(res.message || `Verification code sent to ${email}`);
      setOtpStep(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send verification code. Check your email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize signup
  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await verifyOtpAndRegister({
        email: email,
        otp_code: otpCode,
        name: fullName,
        password: password,
        role: selectedRole,
        society_name: societyName || undefined
      });

      login(res);

      const role = res.user?.role || selectedRole;
      if (role === 'admin') navigate('/dashboard/admin');
      else if (role === 'investor') navigate('/dashboard/investor');
      else if (role === 'society_admin') navigate('/dashboard/society');
      else navigate('/search');

    } catch (err) {
      setErrorMessage(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginUser({
        email: email.trim().toLowerCase(),
        password: password
      });

      login(res);

      const userRole = res.user?.role || selectedRole;
      if (userRole === 'investor') navigate('/dashboard/investor');
      else if (userRole === 'society_admin') navigate('/dashboard/society');
      else if (userRole === 'admin') navigate('/dashboard/admin');
      else navigate('/search');

    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password — Send Reset OTP
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setSuccessMessage(res.message);
      setForgotMode('reset');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!resetOtpCode || resetOtpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit reset code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await resetPassword(email.trim().toLowerCase(), resetOtpCode.trim(), newPassword);
      setSuccessMessage(res.message);
      
      // If backend returns auth token, automatically log user in
      if (res.access_token && res.user) {
        login(res);
        const userRole = res.user.role;
        if (userRole === 'investor') navigate('/dashboard/investor');
        else if (userRole === 'society_admin') navigate('/dashboard/society');
        else if (userRole === 'admin') navigate('/dashboard/admin');
        else navigate('/search');
      } else {
        // Fallback: populate password field so manual sign in succeeds immediately
        setPassword(newPassword);
        setResetOtpCode('');
        setNewPassword('');
        setForgotMode(false);
        setIsRegister(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      {/* Auth Card Container */}
      <div className="w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Teal Green Column with Universal Inspiring Caption */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-brand-950 via-brand-900 to-teal-900 text-white p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
          
          {/* Subtle Architectural Grid Pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#2DD4BF_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* High Quality Architectural Mockup Render Backdrop */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80')`
            }}
          />

          {/* Top Brand Info */}
          <div className="relative z-10 space-y-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-400 text-teal-950 flex items-center justify-center font-bold shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white flex items-center">
                RIHAISH
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-white/20 text-white">
                  AI
                </span>
              </span>
            </Link>

            <div className="pt-4">
              <span className="px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                {selectedRole === 'investor' 
                  ? 'Investor Pro Intelligence Suite' 
                  : selectedRole === 'society_admin' 
                  ? 'B2B Society Management Portal' 
                  : 'Verified Property Discovery'}
              </span>
            </div>
          </div>

          {/* Center / Universal Inspiring Caption */}
          <div className="relative z-10 my-8 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
              Your Gateway to Intelligent & Verified Property Intelligence.
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              Empowering high-conviction decisions with 5-year AI forecasting, 100% verified government lease records, and live milestone tracking.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center space-x-2 text-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Multi-city distributed database sharding (Khi, Lhr, Isb)</span>
              </div>
              <div className="flex items-center space-x-2 text-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Zero opacity on government leasehold titles</span>
              </div>
              <div className="flex items-center space-x-2 text-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Real-time on-ground construction tracking</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-teal-200/70">
            <span>28,000+ Plots Indexed</span>
            <span>94.2% AI Accuracy</span>
          </div>

        </div>

        {/* Right Form Column: Role Selector & Auth / OTP Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white dark:bg-slate-900">
          
          <div>
            {/* Role Switcher Tabs */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Select Your Account Type:
              </p>

              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                
                {/* Buyer / Resident */}
                <button
                  type="button"
                  onClick={() => { setSelectedRole('buyer'); setOtpStep(false); }}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    selectedRole === 'buyer'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Buyer / Resident</span>
                </button>

                {/* Investor */}
                <button
                  type="button"
                  onClick={() => { setSelectedRole('investor'); setOtpStep(false); }}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    selectedRole === 'investor'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>Investor Pro</span>
                </button>

                {/* Society Admin */}
                <button
                  type="button"
                  onClick={() => { setSelectedRole('society_admin'); setOtpStep(false); }}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    selectedRole === 'society_admin'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Society Admin</span>
                </button>

              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Success Message Box */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {successMessage}
              </div>
            )}

            {/* ─── FORGOT PASSWORD MODE ─── */}
            {forgotMode === 'forgot' ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 animate-fadeIn">
                <div className="mb-4">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Forgot Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter your email to receive a password reset code.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                  <div className="relative">
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium" />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50">
                  <span>{isLoading ? 'Sending...' : 'Send Reset Code'}</span>
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button type="button" onClick={() => { setForgotMode(false); setErrorMessage(''); setSuccessMessage(''); }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold py-2">
                  ← Back to Login
                </button>
              </form>
            ) : forgotMode === 'reset' ? (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 animate-fadeIn">
                <div className="mb-4">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Reset Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter the code from your email and choose a new password.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">6-Digit Reset Code</label>
                  <input type="text" required maxLength={6} value={resetOtpCode} onChange={(e) => setResetOtpCode(e.target.value)} placeholder="e.g. 492108"
                    className="w-full text-center tracking-widest text-lg font-mono py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-bold" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium" />
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50">
                  <span>{isLoading ? 'Resetting...' : 'Reset Password'}</span>
                  <Check className="w-4 h-4" />
                </button>

                <button type="button" onClick={() => { setForgotMode(false); setErrorMessage(''); setSuccessMessage(''); }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold py-2">
                  ← Back to Login
                </button>
              </form>
            ) : otpStep ? (
              <form onSubmit={handleOtpVerifySubmit} className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/30 text-center space-y-1">
                  <span className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-2">
                    <Mail className="w-5 h-5" />
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Enter Email Verification OTP
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {otpSentNotice}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    6-Digit Security OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 492108"
                    className="w-full text-center tracking-widest text-lg font-mono py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="w-1/3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-600 dark:text-slate-400"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{isLoading ? 'Verifying...' : 'Verify OTP & Activate'}</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* Main Signup/Login Form */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {isRegister ? 'Create Your Account' : 'Welcome Back'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isRegister 
                        ? `Register as ${selectedRole.replace('_', ' ')} with email verification`
                        : `Log in to access your ${selectedRole.replace('_', ' ')} workspace`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setIsRegister(!isRegister); setErrorMessage(''); }}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>

                <form onSubmit={isRegister ? handleRegisterInit : handleLoginSubmit} className="space-y-3.5">
                  
                  {isRegister && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Zeeshan Tariq"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  )}

                  {isRegister && selectedRole === 'society_admin' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Registered Society / Developer Name
                      </label>
                      <input
                        type="text"
                        required
                        value={societyName}
                        onChange={(e) => setSocietyName(e.target.value)}
                        placeholder="e.g. Capital Smart City / Bahria Town"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={selectedRole === 'investor' ? 'investor@rihaish.ai' : selectedRole === 'society_admin' ? 'admin@capitalsmartcity.pk' : 'buyer@rihaish.ai'}
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Processing...' : (isRegister ? `Proceed to OTP Verification` : `Sign In as ${selectedRole.replace('_', ' ')}`)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Forgot Password link — login mode only */}
                  {!isRegister && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setForgotMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
