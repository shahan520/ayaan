import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SetWithdrawalPasswordModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { setWithdrawalPassword } = useApp();
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pass1) {
      setError('Please enter a 6-digit withdrawal password.');
      return;
    }
    if (pass1.length !== 6 || !/^\d{6}$/.test(pass1)) {
      setError('Withdrawal password must be exactly 6 digits (e.g. 654321).');
      return;
    }
    if (pass1 !== pass2) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    const res = setWithdrawalPassword(pass1);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPass1('');
        setPass2('');
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      setError(res.message || 'Failed to set password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      {/* Mobile container matching Screenshot_2026-06-07-12-44-20-13 */}
      <div className="w-full max-w-sm bg-gradient-to-b from-[#6b1e22] via-[#521316] to-[#3a0b0d] text-white rounded-2xl shadow-2xl overflow-hidden border border-red-900/50">
        {/* Top Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10">
          <button
            onClick={onClose}
            className="p-1 -ml-1 text-white hover:text-red-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="flex-1 text-center font-semibold text-base pr-4">
            Set withdrawal password
          </h2>
        </div>

        <div className="p-6 space-y-5">
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <p className="font-medium text-white text-base">Withdrawal Password Set!</p>
              <p className="text-xs text-white/70">You can now proceed with your withdrawal.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-white/80 leading-relaxed font-medium">
                For security of your funds, please set a secure 6-digit withdrawal PIN password.
              </p>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Password Input 1 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4 text-black" />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pass1}
                  onChange={(e) => setPass1(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit withdrawal password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border-2 border-slate-300 text-black placeholder:text-black/70 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-inner"
                  maxLength={6}
                />
              </div>

              {/* Password Input 2 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4 text-black" />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit password again"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border-2 border-slate-300 text-black placeholder:text-black/70 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-inner"
                  maxLength={6}
                />
              </div>

              {/* OK Button */}
              <button
                type="submit"
                className="w-full py-3 mt-4 rounded-lg bg-[#7a3b40] hover:bg-[#8e464c] active:scale-[0.99] text-white font-medium text-sm transition-all shadow-md"
              >
                OK
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
