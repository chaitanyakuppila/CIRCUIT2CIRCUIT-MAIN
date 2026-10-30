import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, AlertCircle, Info, ShieldCheck, Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react';
import { validateVasaviRollNumber, validateMobileNumber, validatePassword, validateVasaviEmail, OFFICIAL_EMAIL_DOMAIN } from '../utils/validation';
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
  
  // Sign-in state: accepts either Roll Number OR @srivasaviengg.ac.in Email
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Registration state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState(branches[0] || 'Computer Science and Artificial Intelligence (CAI)');
  const [year, setYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('2nd Year');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [shareMobilePublicly, setShareMobilePublicly] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    setShowForgotNotice(false);
    if (isOpen) {
      setTimeout(() => {
        identifierInputRef.current?.focus();
      }, 80);
    }
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (branches.length > 0 && !branches.includes(branch)) {
      setBranch(branches[0]);
    }
  }, [branches, branch]);

  // When roll number changes during registration, auto-suggest official email if user hasn't typed a custom prefix
  const handleRollChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    setRollNumber(clean);
    if (!email || email.includes('@srivasaviengg.ac.in')) {
      setEmail(clean ? `${clean.toLowerCase()}@${OFFICIAL_EMAIL_DOMAIN}` : '');
    }
    if (errorMsg) setErrorMsg(null);
  };

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

    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setErrorMsg('Please enter your Sri Vasavi roll number or official college email.');
      return;
    }

    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(identifier, loginPassword);
      onAuthSuccess(res.user, res.message);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to sign in. Please verify your roll number / email and password.');
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

    const emailCheck = validateVasaviEmail(email);
    if (!emailCheck.isValid) {
      setErrorMsg(emailCheck.error || `Official college email ending with @${OFFICIAL_EMAIL_DOMAIN} is required.`);
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
        email: emailCheck.normalized,
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={mode === 'signin' ? 'signin-heading' : 'register-heading'}
        className="relative w-full max-w-[460px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/95 ring-1 ring-white/10 p-5 sm:p-7 text-slate-100 transition-all my-auto max-h-[92vh] overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Zone */}
        <div className="text-center space-y-2 mb-4">
          <div className="flex justify-center">
            <img
              src="/assets/aistudio/CIRCUIT2CIRCUIT_7c14473a.jpeg"
              alt="Circuit2Circuit Logo"
              className="w-11 h-11 rounded-xl object-contain border border-slate-800 shadow-md"
            />
          </div>

          <div>
            <h1 
              id={mode === 'signin' ? 'signin-heading' : 'register-heading'}
              className="text-xl sm:text-2xl font-extrabold text-white tracking-tight"
            >
              {mode === 'signin' ? 'Welcome back' : 'Join Sri Vasavi Exchange'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {mode === 'signin'
                ? 'Sign in to access student lab component rentals and campus exchanges'
                : 'Exclusive electronics exchange for Sri Vasavi Engineering College'}
            </p>
          </div>

          {/* College Domain Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-[11px] font-medium text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Sri Vasavi Engineering College (Autonomous)</span>
          </div>
        </div>

        {/* Error Message Alert */}
        {errorMsg && (
          <div 
            role="alert" 
            aria-live="polite" 
            className="mb-4 p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Password Assistance Notice */}
        {mode === 'signin' && showForgotNotice && (
          <div 
            role="status" 
            className="mb-4 p-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-slate-300 space-y-2 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Password Reset / Re-register
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
              If you forgot your password or need a new account for <span className="font-mono text-emerald-300">{loginIdentifier || 'your roll number'}</span>, you can register fresh credentials:
            </p>
            <button
              type="button"
              onClick={() => {
                if (loginIdentifier.includes('@')) {
                  setEmail(loginIdentifier);
                } else if (loginIdentifier) {
                  setRollNumber(loginIdentifier);
                }
                setMode('register');
                setShowForgotNotice(false);
                setErrorMsg(null);
              }}
              className="mt-1 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              Register fresh account credentials
            </button>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' ? (
          <form onSubmit={handleLogin} noValidate className="space-y-3.5">
            {/* Roll Number or Email Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="loginIdentifier" 
                className="block text-xs font-semibold text-slate-200"
              >
                Roll Number or College Email
              </label>
              <div className="relative">
                <input
                  ref={identifierInputRef}
                  id="loginIdentifier"
                  name="loginIdentifier"
                  type="text"
                  required
                  autoComplete="username"
                  spellCheck="false"
                  placeholder="25A81A4300 or student@srivasaviengg.ac.in"
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  aria-invalid={Boolean(errorMsg)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Hint: Sri Vasavi roll format (e.g. <span className="font-mono text-slate-300">25A81A4300</span>) or <span className="font-mono text-slate-300">@srivasaviengg.ac.in</span>
              </p>
            </div>

            {/* Password Field */}
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
                  className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer min-h-[32px] flex items-center"
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

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 min-h-[44px] bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Sign in'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setShowForgotNotice(false);
                }}
                className="w-full py-2.5 px-4 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center"
              >
                Create account
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} noValidate className="space-y-3">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="regName" className="block text-xs font-semibold text-slate-200">
                Full Name
              </label>
              <input
                id="regName"
                type="text"
                required
                placeholder="e.g. Chaitanya Varma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 min-h-[40px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* Roll Number & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label htmlFor="regRoll" className="block text-xs font-semibold text-slate-200">
                  Roll Number (Sri Vasavi)
                </label>
                <input
                  id="regRoll"
                  type="text"
                  required
                  maxLength={10}
                  placeholder="25A81A4300"
                  value={rollNumber}
                  onChange={(e) => handleRollChange(e.target.value)}
                  className="w-full px-3.5 py-2 min-h-[40px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white font-mono uppercase placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="regYear" className="block text-xs font-semibold text-slate-200">
                  BTech Year
                </label>
                <select
                  id="regYear"
                  value={year}
                  onChange={(e) => setYear(e.target.value as any)}
                  className="w-full px-3 py-2 min-h-[40px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-emerald-400"
                >
                  <option value="1st Year">1st Year (Junior)</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year (Senior / Capstone)</option>
                </select>
              </div>
            </div>

            {/* Official College Email */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="regEmail" className="block text-xs font-semibold text-slate-200">
                  Official College Email
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">@{OFFICIAL_EMAIL_DOMAIN}</span>
              </div>
              <input
                id="regEmail"
                type="email"
                required
                placeholder={`rollnumber@${OFFICIAL_EMAIL_DOMAIN}`}
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                className="w-full px-3.5 py-2 min-h-[40px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
              <p className="text-[10px] text-slate-400">
                Restricted to verified students of Sri Vasavi Engineering College.
              </p>
            </div>

            {/* Branch Selector */}
            <div className="space-y-1">
              <label htmlFor="regBranch" className="block text-xs font-semibold text-slate-200">
                BTech Branch
              </label>
              <select
                id="regBranch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 min-h-[40px] bg-slate-950/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-emerald-400"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Number & Privacy Toggle */}
            <div className="space-y-1">
              <label htmlFor="regMobile" className="block text-xs font-semibold text-slate-200">
                10-Digit Mobile Number
              </label>
              <input
                id="regMobile"
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3.5 py-2 min-h-[40px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400"
              />
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareMobilePublicly}
                  onChange={(e) => setShareMobilePublicly(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-400 focus:ring-emerald-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 leading-tight">
                  Display my phone number on my listings (uncheck to keep strictly private; you can still coordinate via in-app chat)
                </span>
              </label>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label htmlFor="regPassword" className="block text-xs font-semibold text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="regPassword"
                    type={regShowPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 min-h-[40px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute inset-y-0 right-0 w-9 h-full flex items-center justify-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {regShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="regConfirmPassword" className="block text-xs font-semibold text-slate-200">
                  Confirm Password
                </label>
                <input
                  id="regConfirmPassword"
                  type={regShowPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 min-h-[40px] bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Privacy notice banner */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Passwords are cryptographically hashed. Phone numbers remain hidden by default.</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 min-h-[44px] bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Complete registration'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className="w-full py-2.5 px-4 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
