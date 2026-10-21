import { AlertCircle, CheckCircle2, Lock, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
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
  const { loginUser, registerUser, inviteCodes, users } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginIdentifier.trim()) {
      setError('Please enter your username or 6-digit UID.');
      return;
    }

    const res = loginUser(loginIdentifier.trim(), loginPassword);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Login failed.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regUsername.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!regInviteCode.trim()) {
      setError('Invitation Code is strictly mandatory! You cannot register without a valid code.');
      return;
    }

    const res = registerUser(regUsername.trim(), regPassword, regInviteCode.trim());
    if (res.success) {
      setSuccessMsg(res.message || 'Registration successful!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1800);
    } else {
      setError(res.message || 'Registration failed.');
    }
  };

  const activeCodesList = inviteCodes.filter((c) => c.status === 'active').slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header with Dark Red Theme */}
        <div className="bg-gradient-to-r from-[#8b0000] to-[#521316] text-white p-5 text-center relative">
          <div className="w-12 h-12 rounded-full bg-white/10 p-2 mx-auto mb-2 flex items-center justify-center backdrop-blur-xs">
            <img
              src="/assets/aistudio/a3.f53cf407_cf3e68d0.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-lg font-bold">TradeWeb Mall</h2>
          <p className="text-xs text-white/80">Intelligent Cloud Order Matching</p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-red-800 text-red-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              mode === 'register'
                ? 'border-red-800 text-red-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Account
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-black text-black block mb-1">
                  Username or 6-digit UID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                    <UserCheck className="w-4 h-4 text-black" />
                  </div>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter username or UID (e.g. Hanif8989 / 925886)"
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold text-black placeholder:text-black/70 bg-white border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-black block mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                    <Lock className="w-4 h-4 text-black" />
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold text-black placeholder:text-black/70 bg-white border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#8b0000] hover:bg-[#a00000] active:scale-[0.99] text-white font-bold text-sm rounded-lg transition-all shadow-sm"
              >
                Log In
              </button>

              {/* Quick 1-click test accounts */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Quick demo login:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {users.slice(0, 2).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        loginUser(u.username);
                        onClose();
                      }}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-left hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <span className="font-bold text-slate-800 block truncate">{u.username}</span>
                      <span className="text-slate-400 text-[10px]">
                        UID: {u.uid} · VIP {u.vipLevel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-black text-black block mb-1">
                  Desired Username
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. Satoshi_King"
                  className="w-full px-3 py-2 text-sm font-bold text-black placeholder:text-black/70 bg-white border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-black text-black block mb-1">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 4 chars"
                    className="w-full px-3 py-2 text-sm font-bold text-black placeholder:text-black/70 bg-white border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-black block mb-1">Confirm</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat pass"
                    className="w-full px-3 py-2 text-sm font-bold text-black placeholder:text-black/70 bg-white border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700"
                  />
                </div>
              </div>

              {/* Strict Invitation Code Field */}
              <div className="bg-red-50/70 p-3 rounded-xl border-2 border-red-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-black flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
                    Invitation Code <span className="text-red-700 font-black">*Mandatory</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={regInviteCode}
                  onChange={(e) => setRegInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit or system code"
                  className="w-full px-3 py-2 text-sm font-mono font-black uppercase text-black placeholder:text-black/70 bg-white border-2 border-red-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700"
                />
                <p className="text-[10px] text-red-700/80">
                  Strict Rule: Registration is invitation-only. You must supply a valid code.
                </p>

                {/* Quick available codes chips for test evaluation */}
                <div className="pt-1">
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Available active codes for testing:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeCodesList.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setRegInviteCode(c.code)}
                        className="px-2 py-0.5 bg-white border border-slate-300 text-[10px] font-mono rounded hover:bg-red-100 hover:text-red-800 transition-colors"
                      >
                        {c.code} ({c.type})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-tight">
                Upon registration, a unique 6-digit UID and your own referral code will be
                automatically created for your account.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#8b0000] hover:bg-[#a00000] active:scale-[0.99] text-white font-bold text-sm rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Complete Registration
              </button>
            </form>
          )}

          <div className="pt-1 text-center">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Continue as Guest / Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
