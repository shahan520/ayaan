/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Shield, User } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface AdminLoginGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onSuccess, onCancel }) => {
  const { adminLogin } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Please enter administrator username.');
      return;
    }
    if (!password) {
      setError('Please enter administrator password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = adminLogin(username.trim(), password, securityPin.trim());
      setIsLoading(false);

      if (res.success) {
        setSuccess('Authentication verified! Loading Admin Console...');
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        setError(res.message || 'Access Denied: Invalid credentials.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col z-10">
        {/* Header with Security Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/40 mb-3.5">
            <Shield className="w-7 h-7" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Admin Console Gateway
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Restricted administrative portal. Authorized operations and compliance personnel only.
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/90 border border-red-800/80 text-[10px] font-mono text-red-300 font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>Route Protected · 256-bit Auth</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="font-medium leading-relaxed">{success}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Admin Identifier / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or sub-admin username"
                className="w-full pl-10 pr-3.5 py-3 text-sm text-white placeholder:text-slate-500 bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-500 bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Master Security PIN
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                maxLength={6}
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                placeholder="Enter Master Security PIN"
                className="w-full pl-10 pr-3.5 py-3 text-sm text-white placeholder:text-slate-500 bg-slate-950 border border-slate-800 rounded-xl focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono tracking-widest transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/50 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Authenticating Security Gate...</span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Verify & Access Console</span>
              </>
            )}
          </button>
        </form>

        {/* Footer: Cancel / Return to Customer Site */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to User App</span>
          </button>

          <span className="text-[10px] text-slate-500 font-mono">IP: SECURE · TLS 1.3</span>
        </div>
      </div>
    </div>
  );
};
