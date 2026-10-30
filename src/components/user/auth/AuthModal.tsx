import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { loginUser, registerUser, users, currentUser } = useApp();

  // Helper to extract invite code from URL parameters (?code=... or ?inviteCode=... or ?ref=...) or URL hash
  const getInviteCodeFromUrl = (): string => {
    if (typeof window === 'undefined') return '';
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const codeFromSearch =
        searchParams.get('code') ||
        searchParams.get('inviteCode') ||
        searchParams.get('ref');
      if (codeFromSearch) return codeFromSearch.trim().toUpperCase();

      if (window.location.hash && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?') + 1);
        const hashParams = new URLSearchParams(hashQuery);
        const codeFromHash =
          hashParams.get('code') ||
          hashParams.get('inviteCode') ||
          hashParams.get('ref');
        if (codeFromHash) return codeFromHash.trim().toUpperCase();
      }
    } catch {}
    return '';
  };

  const initialInviteCode = getInviteCodeFromUrl();
  const [mode, setMode] = useState<'login' | 'register'>(
    initialInviteCode ? 'register' : defaultMode
  );

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regInviteCode, setRegInviteCode] = useState(initialInviteCode);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-sync when URL changes or on initial mount
  React.useEffect(() => {
    const code = getInviteCodeFromUrl();
    if (code) {
      setRegInviteCode(code);
      setMode('register');
    }
  }, []);

  if (!isOpen) return null;

  // Validation readiness check for Register Confirm button
  const isRegisterReady =
    regUsername.trim().length >= 3 &&
    regPassword.length >= 6 &&
    regConfirmPassword.length >= 6 &&
    regPassword === regConfirmPassword &&
    regInviteCode.trim().length > 0;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginIdentifier.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password');
      return;
    }

    const res = loginUser(loginIdentifier.trim(), loginPassword);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Invalid username or password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regUsername.trim()) {
      setError('Please enter a username (min 3 chars).');
      return;
    }
    if (regUsername.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!regInviteCode.trim()) {
      setError('Invite code is required to register.');
      return;
    }

    const res = registerUser(regUsername.trim(), regPassword, regInviteCode.trim());
    if (res.success) {
      setSuccessMsg(res.message || 'Account created successfully! Logging you in...');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);
    } else {
      setError(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="fixed md:absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-3 overflow-y-auto">
      <div className="w-full max-w-[390px] bg-gradient-to-b from-[#4a121e] via-[#380b16] to-[#25050e] rounded-[32px] shadow-2xl overflow-hidden border border-white/10 flex flex-col my-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* iOS style Top Status Bar mockup (hidden on desktop PC because MobileFrame already has one) */}
        <div className="md:hidden flex items-center justify-between px-6 pt-3.5 pb-1 text-white text-[13px] font-semibold tracking-tight">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2.5 rounded-[2px] border border-white/80 relative flex items-center p-0.5">
              <span className="w-full h-full bg-white rounded-[1px] block"></span>
            </span>
          </div>
        </div>

        {/* Header Section */}
        <div className="pt-4 pb-6 px-6 text-center relative">
          {/* Back button (Only in Register mode, matching screenshot) */}
          {mode === 'register' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className="absolute top-4 left-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
              title="Back to Login"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5 text-white" />
            </button>
          )}

          {/* Dismiss button if user is already logged in and just switched */}
          {currentUser && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Circular Logo with Soft Glowing Outer Border */}
          <div className="w-16 h-16 rounded-full bg-white/10 p-2.5 mx-auto mb-3 flex items-center justify-center backdrop-blur-md border border-white/25 shadow-inner">
            <img
              src="/assets/aistudio/a3.f53cf407_cf3e68d0.png"
              alt="Velora Logo"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>

          {/* Title and Subtitle */}
          {mode === 'login' ? (
            <>
              <h1 className="text-2xl font-bold text-white tracking-tight">Velora</h1>
              <p className="text-xs text-white/80 mt-1 font-normal tracking-wide">
                Secure · Fast · Reliable
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
              <p className="text-xs text-white/80 mt-1 font-normal tracking-wide">
                Invite code required to register
              </p>
            </>
          )}
        </div>

        {/* White Card Section */}
        <div className="bg-white rounded-t-[30px] rounded-b-[28px] p-6 sm:p-7 shadow-2xl mx-1.5 mb-1.5 space-y-4">
          {/* Notification Banners */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* LOGIN VIEW */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username field */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Action Button: Gold/Orange Login */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#e08920] hover:bg-[#cf7b19] active:scale-[0.99] text-white font-bold text-base rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                Login
              </button>

              {/* Footer Link: Don't have an account? Register */}
              <div className="text-center text-xs text-slate-500 font-medium pt-1">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="text-[#e08920] font-bold hover:underline cursor-pointer"
                >
                  Register
                </button>
              </div>

              {/* Fast 1-Click Demo Testing Accounts */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 text-center">
                  Quick demo accounts (1-click fill):
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {users.slice(0, 2).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setLoginIdentifier(u.username);
                        setLoginPassword(u.password || 'password123');
                        setError('');
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-lg text-[11px] text-center text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-slate-800 block truncate">{u.username}</span>
                      <span className="text-slate-400 text-[10px]">VIP {u.vipLevel}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* CREATE ACCOUNT / REGISTRATION VIEW */
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Username field */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Min 3 chars"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password field */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Shield className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Invite Code * field */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Invite Code <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={regInviteCode}
                    onChange={(e) => setRegInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter invite code"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium uppercase text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Primary Action Button: Confirm */}
              <button
                type="submit"
                className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all cursor-pointer ${
                  isRegisterReady
                    ? 'bg-[#e08920] hover:bg-[#cf7b19] active:scale-[0.99] text-white shadow-lg shadow-amber-500/25'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-400'
                }`}
              >
                Confirm
              </button>

              {/* Footer Link: Already have an account? Login */}
              <div className="text-center text-xs text-slate-500 font-medium pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-[#e08920] font-bold hover:underline cursor-pointer"
                >
                  Login
                </button>
              </div>
            </form>
          )}

          {/* Dismiss button if user wants to browse as guest */}
          {!currentUser && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Continue as Guest / Preview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
