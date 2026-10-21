import { Check, ChevronRight, Copy, CreditCard, FileText, Lock, LogOut, MessageCircle, Settings, ShieldCheck, UserCheck, Users, Wallet, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  onNavigate: (page: string) => void;
  onOpenAuth: () => void;
}

export const MineTab: React.FC<Props> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser, logoutUser } = useApp();
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-full bg-slate-100/70 pb-24">
      {/* Dark Red Gradient Header matching Screenshot_2026-06-07-12-43-57-54 */}
      <div className="bg-gradient-to-b from-[#8b0000] via-[#6d1316] to-[#4a0000] text-white px-5 pt-7 pb-6 shadow-md">
        {currentUser ? (
          <>
            {/* Top row: Avatar + Username + VIP Badge + Invitation Code + Msg Icon */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                {/* Brand Pentagram Avatar */}
                <div className="w-14 h-14 rounded-full bg-white p-1 shadow-md shrink-0 flex items-center justify-center">
                  <img
                    src={currentUser.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png'}
                    alt="User Avatar"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      {currentUser.username}
                    </h2>
                    <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-sm shadow-xs uppercase">
                      VIP {currentUser.vipLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                    <span>Invitation code:</span>
                    <button
                      onClick={() => handleCopyCode(currentUser.inviteCode)}
                      className="font-mono font-bold text-white hover:text-red-200 flex items-center gap-1"
                      title="Copy invite code"
                    >
                      <span>{currentUser.inviteCode}</span>
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/70" />
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-white/60">UID: {currentUser.uid}</div>
                </div>
              </div>

              {/* Top-Right Notification/Message Icon */}
              <button
                onClick={() => onNavigate('service')}
                className="p-1.5 text-white/80 hover:text-white transition-colors"
                title="Customer Support"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Account Balance Row & Quick Deposit/Withdrawal Buttons */}
            <div className="mt-6 flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-white/75 font-medium block">My Account</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-semibold text-white/80">USDT</span>
                  <span className="text-3xl font-black text-white tracking-tight">
                    {currentUser.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Deposit and Withdrawal round icon buttons matching screenshot */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onNavigate('deposit')}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white text-[#8b0000] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-white">Deposit</span>
                </button>

                <button
                  onClick={() => onNavigate('withdrawal')}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white text-[#8b0000] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-white">Withdrawal</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Guest state */
          <div className="py-4 text-center space-y-3">
            <h2 className="text-lg font-bold text-white">Welcome to TradeWeb Mall</h2>
            <p className="text-xs text-white/80">Sign in to manage your USDT portfolio</p>
            <button
              onClick={onOpenAuth}
              className="px-6 py-2.5 bg-white text-[#8b0000] font-bold text-xs rounded-xl shadow-md hover:bg-slate-100 transition-colors"
            >
              Sign In / Register
            </button>
          </div>
        )}
      </div>

      {/* 4 Quick Actions Grid matching Screenshot_2026-06-07-12-43-57-54 */}
      <div className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-slate-200/80 grid grid-cols-4 gap-2 text-center">
        <button
          onClick={() => onNavigate('teams')}
          className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Teams</span>
        </button>

        <button
          onClick={() => onNavigate('record')}
          className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Record</span>
        </button>

        <button
          onClick={() => onNavigate('wallet')}
          className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 leading-tight">
            Wallet
            <br />
            mgmt
          </span>
        </button>

        <button
          onClick={() => onNavigate('invite')}
          className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 leading-tight">
            Invite
            <br />
            friends
          </span>
        </button>
      </div>

      {/* Navigation List matching Screenshot_2026-06-07-12-43-57-54 */}
      <div className="bg-white mx-4 mt-3 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 divide-y divide-slate-100">
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">Profile</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => onNavigate('deposit-records')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">Deposit records</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => onNavigate('withdrawal-records')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">Withdrawal records</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">Setting</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Personal Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Personal Avatar</span>
                <div className="w-8 h-8 rounded-full bg-slate-100 p-0.5 border border-slate-200">
                  <img
                    src="/assets/aistudio/a3.f53cf407_cf3e68d0.png"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Username</span>
                <span className="font-bold text-slate-900">{currentUser?.username}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Account UID</span>
                <span className="font-mono font-bold text-slate-900">{currentUser?.uid}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Invitation Code</span>
                <span className="font-mono font-bold text-red-700">{currentUser?.inviteCode}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Referred by</span>
                <span className="font-mono text-slate-700">{currentUser?.referredBy || 'None (Direct)'}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">VIP Tier</span>
                <span className="font-bold text-amber-600">VIP {currentUser?.vipLevel}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500">Bound Wallet</span>
                <span className="font-mono text-[11px] truncate max-w-[170px]">
                  {currentUser?.wallet?.walletAddress || 'Not bound yet'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal matching Screenshot_2026-06-07-12-48-41-52 */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                <span className="text-slate-700 font-medium">Language settings</span>
                <span className="text-slate-400 font-medium">English (UK) &gt;</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                <span className="text-slate-700 font-medium">App Version</span>
                <span className="text-slate-400 font-mono">v2.4.0</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  logoutUser();
                  setShowSettingsModal(false);
                }}
                className="w-full py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
