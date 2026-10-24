import {
  Camera,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  FileText,
  Globe,
  LogOut,
  MessageCircle,
  Settings,
  UserCheck,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { LanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/i18n';

interface Props {
  onNavigate: (page: string) => void;
  onOpenAuth: () => void;
}

export const MineTab: React.FC<Props> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser, logoutUser, language, setLanguage, t, updateUserAvatar } = useApp();
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToastMsg('Image size must be less than 5MB');
        setTimeout(() => setToastMsg(null), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          updateUserAvatar(result);
          setToastMsg(t('avatarUpdated'));
          setTimeout(() => setToastMsg(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'English (UK)';

  return (
    <div className="min-h-full bg-slate-100/70 pb-24 relative select-none font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
            {toastMsg}
          </div>
        </div>
      )}

      {/* Dark Red Gradient Header matching Screenshot_2026-06-07-12-43-57-54 */}
      <div className="bg-gradient-to-b from-[#8b0000] via-[#6d1316] to-[#4a0000] text-white px-5 pt-7 pb-6 shadow-md">
        {currentUser ? (
          <>
            {/* Top row: Avatar + Username + VIP Badge + Invitation Code + Msg Icon */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                {/* Brand Pentagram Avatar */}
                <div
                  onClick={() => setShowProfileModal(true)}
                  className="w-14 h-14 rounded-full bg-white p-1 shadow-md shrink-0 flex items-center justify-center cursor-pointer overflow-hidden border border-white/20 hover:scale-105 transition-transform"
                  title="Click to view/edit profile"
                >
                  <img
                    src={currentUser.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png'}
                    alt="User Avatar"
                    className="w-full h-full object-cover rounded-full"
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
                    <span>{t('invitationCode')}:</span>
                    <button
                      onClick={() => handleCopyCode(currentUser.inviteCode)}
                      className="font-mono font-bold text-white hover:text-red-200 flex items-center gap-1 cursor-pointer"
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
                className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Customer Support"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Account Balance Row & Quick Deposit/Withdrawal Buttons */}
            <div className="mt-6 flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-white/75 font-medium block">{t('myAccount')}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-semibold text-white/80">USDT</span>
                  <span className="text-3xl font-black text-white tracking-tight font-mono">
                    {currentUser.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Deposit and Withdrawal round icon buttons matching screenshot */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onNavigate('deposit')}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white text-[#8b0000] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-white">{t('deposit')}</span>
                </button>

                <button
                  onClick={() => onNavigate('withdrawal')}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white text-[#8b0000] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-white">{t('withdrawal')}</span>
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
              className="px-6 py-2.5 bg-white text-[#8b0000] font-bold text-xs rounded-xl shadow-md hover:bg-slate-100 transition-colors cursor-pointer"
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
          className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">{t('teams')}</span>
        </button>

        <button
          onClick={() => onNavigate('record')}
          className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">{t('record')}</span>
        </button>

        <button
          onClick={() => onNavigate('wallet')}
          className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 leading-tight">
            {t('walletMgmt')}
          </span>
        </button>

        <button
          onClick={() => onNavigate('invite')}
          className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 leading-tight">
            {t('inviteFriends')}
          </span>
        </button>
      </div>

      {/* Navigation List matching Screenshot_2026-06-07-12-43-57-54 */}
      <div className="bg-white mx-4 mt-3 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 divide-y divide-slate-100">
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">{t('profile')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => onNavigate('deposit-records')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">{t('depositRecords')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => onNavigate('withdrawal-records')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">{t('withdrawalRecords')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">{t('settings')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. PERSONAL PROFILE MODAL matching image_cc756bb3.png */}
      {/* ------------------------------------------------------------- */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">{t('profile')}</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              {/* Interactive Personal Avatar Row (Click to upload) */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex justify-between items-center py-2 px-1 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                title={t('clickToChangeAvatar')}
              >
                <div>
                  <span className="text-slate-800 font-semibold block">{t('personalAvatar')}</span>
                  <span className="text-[11px] text-red-600 font-medium">
                    {t('clickToChangeAvatar')}
                  </span>
                </div>
                <div className="relative w-11 h-11 rounded-full bg-slate-100 p-0.5 border-2 border-slate-200 group-hover:border-red-500 overflow-hidden shadow-xs transition-colors shrink-0">
                  <img
                    src={currentUser?.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png'}
                    alt="Personal Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* Username */}
              <div className="flex justify-between py-1.5 border-t border-slate-100">
                <span className="text-slate-500">{t('username')}</span>
                <span className="font-bold text-slate-900">{currentUser?.username}</span>
              </div>

              {/* Account UID */}
              <div className="flex justify-between py-1.5 border-t border-slate-100">
                <span className="text-slate-500">{t('accountUid')}</span>
                <span className="font-mono font-bold text-slate-900">{currentUser?.uid}</span>
              </div>

              {/* Invitation Code */}
              <div className="flex justify-between py-1.5 border-t border-slate-100">
                <span className="text-slate-500">{t('invitationCode')}</span>
                <span className="font-mono font-bold text-red-700">{currentUser?.inviteCode}</span>
              </div>

              {/* Referred by */}
              <div className="flex justify-between py-1.5 border-t border-slate-100">
                <span className="text-slate-500">{t('referredBy')}</span>
                <span className="font-mono text-slate-700">
                  {currentUser?.referredBy || 'SYS888'}
                </span>
              </div>

              {/* VIP Tier */}
              <div className="flex justify-between py-1.5 border-t border-slate-100">
                <span className="text-slate-500">{t('vipTier')}</span>
                <span className="font-bold text-amber-600">VIP {currentUser?.vipLevel}</span>
              </div>

              {/* NOTE: Bound Wallet row has been completely removed as requested in image_cc756bb3.png */}
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SETTINGS MODAL matching image_8c27cec3.png */}
      {/* ------------------------------------------------------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">{t('settings')}</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Language Settings row matching screenshot */}
              <button
                type="button"
                onClick={() => setShowLanguageModal(true)}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <span className="text-slate-800 font-semibold">{t('languageSettings')}</span>
                <span className="text-slate-500 font-medium text-xs flex items-center gap-1 group-hover:text-slate-800">
                  <span>{currentLanguageLabel}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </span>
              </button>

              {/* App Version row */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-800 font-semibold">{t('appVersion')}</span>
                <span className="text-slate-400 font-mono">v2.4.0</span>
              </div>
            </div>

            {/* Logout Button matching screenshot */}
            <div className="pt-2">
              <button
                onClick={() => {
                  logoutUser();
                  setShowSettingsModal(false);
                }}
                className="w-full py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MULTI-LANGUAGE SELECTION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-slate-900 text-sm">{t('selectLanguage')}</h3>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Options List */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {SUPPORTED_LANGUAGES.map((langOpt) => {
                const isSelected = language === langOpt.code;
                return (
                  <button
                    key={langOpt.code}
                    onClick={() => {
                      setLanguage(langOpt.code);
                      setShowLanguageModal(false);
                      setToastMsg(`Language changed to ${langOpt.label}`);
                      setTimeout(() => setToastMsg(null), 2500);
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/80 border border-red-300 text-red-950 font-bold shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border border-transparent text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <span className="text-xs block font-bold">{langOpt.nativeName}</span>
                      <span className="text-[10px] text-slate-400">{langOpt.label}</span>
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
