import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { validateVasaviRollNumber, validateMobileNumber, validatePassword } from '../utils/validation';
import { api } from '../services/api';
import { StudentUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: StudentUser, message: string) => void;
  initialMode?: 'signin' | 'register';
  branches: string[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
  branches,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  
  // Sign-in state
  const [loginRoll, setLoginRoll] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Registration state
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState(branches[0] || 'Artificial Intelligence & Data Science (AI & DS)');
  const [year, setYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('2nd Year');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [shareMobilePublicly, setShareMobilePublicly] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rollInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    setShowForgotNotice(false);
    if (isOpen) {
      setTimeout(() => {
        rollInputRef.current?.focus();
      }, 80);
    }
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (branches.length > 0 && !branches.includes(branch)) {
      setBranch(branches[0]);
    }
  }, [branches, branch]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rollCheck = validateVasaviRollNumber(loginRoll);
    if (!rollCheck.isValid) {
      setErrorMsg(rollCheck.error || 'Please enter a valid Sri Vasavi roll number (e.g. 25A81A4300).');
      return;
    }

    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(rollCheck.normalized, loginPassword);
      onAuthSuccess(res.user, res.message);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect roll number or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name || name.trim().length < 2) {
      setErrorMsg('Please enter your full student name (minimum 2 characters).');
      return;
    }

    const rollCheck = validateVasaviRollNumber(rollNumber);
    if (!rollCheck.isValid) {
      setErrorMsg(rollCheck.error || 'Invalid roll number format.');
      return;
    }

    const mobileCheck = validateMobileNumber(mobile);
    if (!mobileCheck.isValid) {
      setErrorMsg(mobileCheck.error || 'Invalid mobile number.');
      return;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      setErrorMsg(passCheck.error || 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        name: name.trim(),
        rollNumber: rollCheck.normalized,
        branch,
        year,
        mobile: mobileCheck.normalized,
        password,
        shareMobilePublicly,
      });
      onAuthSuccess(res.user, res.message);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (roll: string, pw: string) => {
    setLoginRoll(roll);
    setLoginPassword(pw);
    setErrorMsg(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      {/* 
        Centered, compact sign-in card with dark, slightly transparent surface, 
        subtle borders, strong text contrast, and soft outline.
      */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={mode === 'signin' ? 'signin-heading' : 'register-heading'}
        className="relative w-full max-w-[430px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/90 ring-1 ring-white/5 p-5 sm:p-8 text-slate-100 transition-all my-4 sm:my-8 max-h-[90vh] overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Zone with Circuit2Circuit Logo */}
        <div className="text-center space-y-2.5 mb-5">
          <div className="flex justify-center">
            <img
              src="/assets/aistudio/CIRCUIT2CIRCUIT_7c14473a.jpeg"
              alt="Circuit2Circuit Logo"
              className="w-12 h-12 rounded-xl object-contain border border-slate-800 shadow-md"
            />
          </div>

          <div>
            <h1 
              id={mode === 'signin' ? 'signin-heading' : 'register-heading'}
              className="text-2xl sm:text-2xl font-bold text-white tracking-tight"
            >
              {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'signin'
                ? 'Sign in to access student lab component rentals and campus exchanges'
                : 'Register your Sri Vasavi student profile to join the campus exchange'}
            </p>
          </div>
        </div>

        {/* Error Message Alert */}
        {errorMsg && (
          <div 
            role="alert" 
            aria-live="polite" 
            className="mb-5 p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Password Assistance Notice (when "Forgot password?" is clicked) */}
        {mode === 'signin' && showForgotNotice && (
          <div 
            role="status" 
            className="mb-5 p-3.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-slate-300 space-y-2 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Password Assistance
              </span>
              <button 
                type="button" 
                onClick={() => setShowForgotNotice(false)} 
                className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Circuit2Circuit accounts are student-managed on campus. If you need a password reset, please contact your class representative or department student coordinator. You can also test sign-in immediately using any demo account below.
            </p>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' ? (
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {/* Roll Number Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="rollNumber" 
                className="block text-xs font-semibold text-slate-200"
              >
                Roll Number
              </label>
              <input
                ref={rollInputRef}
                id="rollNumber"
                name="rollNumber"
                type="text"
                required
                autoComplete="username"
                spellCheck="false"
                placeholder="25A81A4300"
                value={loginRoll}
                maxLength={10}
                onChange={(e) => {
                  setLoginRoll(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg(null);
                }}
                aria-invalid={Boolean(errorMsg)}
                aria-describedby="roll-hint"
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white uppercase font-mono tracking-wider placeholder:text-slate-600 placeholder:font-mono focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              />
              <p id="roll-hint" className="text-[11px] text-slate-400">
                Hint: Sri Vasavi Engineering College format (e.g. <span className="font-mono text-slate-300">25A81A4300</span>)
              </p>
            </div>

            {/* Password Field with Show Password & Forgot Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-semibold text-slate-200"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(!showForgotNotice)}
                  className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer focus:outline-hidden focus-visible:underline min-h-[32px] flex items-center"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  aria-invalid={Boolean(errorMsg)}
                  className="w-full pl-3.5 pr-12 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                />

                {/* Show password toggle with min 44px tap target */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-200 focus:outline-hidden focus-visible:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons: Sign in & Create account side by side */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] px-3 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 flex items-center justify-center text-center"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  const path = window.location.pathname.toLowerCase();
                  if (path === '/signin' || path === '/login') {
                    window.history.pushState(null, '', '/register');
                  }
                }}
                className="w-full min-h-[44px] px-2.5 sm:px-3 bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-900 text-white hover:text-emerald-300 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-emerald-400/80 shadow-md transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 flex items-center justify-center text-center"
              >
                Create account
              </button>
            </div>

            {/* Quick Demo Accounts for seamless campus evaluation */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span className="font-medium text-slate-300">Quick sign-in demo accounts:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('25A81A4300', 'Password123')}
                  className="px-2.5 py-1.5 min-h-[36px] text-[11px] font-mono font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center"
                  title="2nd Year AI & DS student"
                >
                  25A81A4300
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('21A81A0501', 'Password123')}
                  className="px-2.5 py-1.5 min-h-[36px] text-[11px] font-mono font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center"
                  title="4th Year CSE senior"
                >
                  21A81A0501
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('25A81A0401', 'Password123')}
                  className="px-2.5 py-1.5 min-h-[36px] text-[11px] font-mono font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center"
                  title="1st Year ECE student"
                >
                  25A81A0401
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} noValidate className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="regName" className="block text-xs font-semibold text-slate-200">
                Student Full Name *
              </label>
              <input
                id="regName"
                type="text"
                required
                placeholder="e.g. Praveen Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* Roll Number & BTech Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="regRoll" className="block text-xs font-semibold text-slate-200">
                  Roll Number *
                </label>
                <input
                  id="regRoll"
                  type="text"
                  required
                  placeholder="25A81A4300"
                  value={rollNumber}
                  maxLength={10}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white uppercase font-mono tracking-wider placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
                <span className="text-[10px] text-slate-500 font-mono block">e.g. 25A81A4300</span>
              </div>

              <div className="space-y-1">
                <label htmlFor="regYear" className="block text-xs font-semibold text-slate-200">
                  BTech Year *
                </label>
                <select
                  id="regYear"
                  value={year}
                  onChange={(e) => setYear(e.target.value as any)}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                >
                  <option value="1st Year" className="bg-slate-900 text-white">1st Year (Freshman)</option>
                  <option value="2nd Year" className="bg-slate-900 text-white">2nd Year (Core Labs)</option>
                  <option value="3rd Year" className="bg-slate-900 text-white">3rd Year (IoT/Mini Project)</option>
                  <option value="4th Year" className="bg-slate-900 text-white">4th Year (Senior Capstone)</option>
                </select>
              </div>
            </div>

            {/* Branch Selection */}
            <div className="space-y-1">
              <label htmlFor="regBranch" className="block text-xs font-semibold text-slate-200">
                BTech Branch *
              </label>
              <select
                id="regBranch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-white">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label htmlFor="regMobile" className="block text-xs font-semibold text-slate-200">
                Mobile Number *
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 min-h-[44px] flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono text-xs shrink-0">
                  +91
                </span>
                <input
                  id="regMobile"
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={mobile}
                  maxLength={10}
                  onChange={(e) => setMobile(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="regPassword" className="block text-xs font-semibold text-slate-200">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="regPassword"
                    type={regShowPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    aria-label={regShowPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 w-10 h-full flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="regConfirmPassword" className="block text-xs font-semibold text-slate-200">
                  Confirm *
                </label>
                <input
                  id="regConfirmPassword"
                  type={regShowPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* Privacy Checkbox */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={shareMobilePublicly}
                  onChange={(e) => setShareMobilePublicly(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 shrink-0"
                />
                <span className="text-[11px] text-slate-300 leading-relaxed">
                  Allow my phone number to be visible on my listings (otherwise, chat is strictly private).
                </span>
              </label>
            </div>

            {/* Registration Action Buttons: Create account & Sign in side by side */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] px-3 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 flex items-center justify-center text-center"
              >
                {loading ? 'Creating...' : 'Create account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  const path = window.location.pathname.toLowerCase();
                  if (path === '/register' || path === '/signup') {
                    window.history.pushState(null, '', '/signin');
                  }
                }}
                className="w-full min-h-[44px] px-2.5 sm:px-3 bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-900 text-white hover:text-emerald-300 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-emerald-400/80 shadow-md transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 flex items-center justify-center text-center"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
