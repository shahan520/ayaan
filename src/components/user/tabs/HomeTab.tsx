import { ArrowUpRight, CheckCircle2, ChevronRight, TrendingUp, UserPlus, Users, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  onNavigate: (page: string) => void;
}

export const HomeTab: React.FC<Props> = ({ onNavigate }) => {
  const { deposits, withdrawals } = useApp();
  const [modalItem, setModalItem] = useState<{ title: string; image: string; text: string } | null>(
    null
  );
  const [tickerIndex, setTickerIndex] = useState(0);

  const announcements = [
    { user: 'J*********7', amount: '479.31 USDT', type: 'successful' },
    { user: 'K*********2', amount: '890.00 USDT', type: 'successful' },
    { user: 'H*********9', amount: '159.96 USDT', type: 'successful' },
    { user: 'T*********5', amount: '1,250.00 USDT', type: 'successful' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % announcements.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const platformCards = [
    {
      title: 'Platform profile',
      description: 'MALL is an intelligent cloud global order matching center supporting cross-border merchant promotion and automatic commission settlement.',
      image: '/assets/aistudio/a1.3f945898_a31a0efe.png',
      detail:
        'QuDaizi Mall is an intelligent cloud global order matching center, providing intelligent task allocation and rapid commission distribution for partners in e-commerce ecosystems worldwide. By utilizing high-throughput TRC-20 protocol settlements, users enjoy real-time settlement and high investment returns.',
    },
    {
      title: 'Platform rules',
      description: 'About recharge: [The platform will change the TRC-20 address periodically to guarantee asset isolation and funds security...]',
      image: '/assets/aistudio/w1.2477a4c7_d50a340f.png',
      detail:
        'Platform security rules: 1. Each recharge must verify the active one-time TRC-20 wallet address. 2. Orders must be submitted before grabbing new tasks. 3. Withdrawal requests are processed within 10-30 minutes through verified payment gateways.',
    },
    {
      title: 'Win-win cooperation',
      description: 'At MALL, we carry out win-win cooperation for all users, building sustainable long-term revenue through 3-tier team referral commissions.',
      image: '/assets/aistudio/a2.d2e2ddaf_16e6377b.png',
      detail:
        'Invite friends to join and expand your tier. You will receive up to 5% direct commission on level 1 referrals, 3% on level 2, and 1% on level 3, creating an ongoing passive income stream as your network grows.',
    },
    {
      title: 'Instructions for use',
      description: 'To celebrate the MALL membership surpassing 1,000,000 members worldwide, VIP tiers enjoy elevated rebate percentages up to 12%.',
      image: '/assets/aistudio/w2.383f75c3_5edad45e.png',
      detail:
        'How to start earning: 1. Deposit USDT via TRC-20. 2. Navigate to "Menu" to select your VIP Tier. 3. Click "Grab the order immediately" and submit the generated product order. 4. Collect automatic commission in your account balance.',
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Top Header Bar matching Screenshot_2026-06-07-12-48-53-99 */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img
            src="/assets/aistudio/a3.f53cf407_cf3e68d0.png"
            alt="Brand Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-slate-900 text-sm tracking-tight">TradeWeb Mall</span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Online
        </span>
      </div>

      {/* 4 Quick Actions (Recharge, Withdrawal, Teams, Invitation) */}
      <div className="bg-white px-4 py-4 grid grid-cols-4 gap-2 text-center border-b border-slate-100">
        <button
          onClick={() => onNavigate('deposit')}
          className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-1.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Recharge</span>
        </button>

        <button
          onClick={() => onNavigate('withdrawal')}
          className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-1.5">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Withdrawal</span>
        </button>

        <button
          onClick={() => onNavigate('teams')}
          className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-1.5">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Teams</span>
        </button>

        <button
          onClick={() => onNavigate('invite')}
          className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-1.5">
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Invitation</span>
        </button>
      </div>

      {/* Real-Time Announcement Ticker Bar */}
      <div className="bg-white mx-4 mt-3 p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-xs font-bold">
            👤
          </div>
          <div className="truncate">
            <span className="font-bold text-xs text-slate-800 mr-2">
              {announcements[tickerIndex].user}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {announcements[tickerIndex].type}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-900 shrink-0 font-mono">
          {announcements[tickerIndex].amount}
        </span>
      </div>

      {/* Start Task / Grab Order Quick Banner */}
      <div className="mx-4 mt-3 p-3.5 bg-gradient-to-r from-[#6b1e22] to-[#450d10] rounded-2xl text-white shadow-sm flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-sm uppercase">
              VIP Matching
            </span>
            <h3 className="font-bold text-xs text-white">Start Task & Grab Order</h3>
          </div>
          <p className="text-[11px] text-white/80">Match retail product tasks & earn up to 12% commission</p>
        </div>
        <button
          onClick={() => onNavigate('menu')}
          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-red-900 font-black text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <span>Grab Now</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Platform Introduction Section matching Screenshot */}
      <div className="px-4 mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Platform introduction</h2>
          <span className="text-[11px] text-slate-400">Verified System</span>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          {platformCards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => setModalItem({ title: card.title, image: card.image, text: card.detail })}
              className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xs cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="h-28 w-full bg-slate-100 overflow-hidden relative">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 mb-1 line-clamp-1">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <div className="pt-2 flex items-center text-[10px] text-red-700 font-semibold gap-0.5">
                  <span>Learn more</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-40 w-full relative">
              <img
                src={modalItem.image}
                alt={modalItem.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setModalItem(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs font-bold hover:bg-black"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <h3 className="text-base font-bold text-slate-900">{modalItem.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{modalItem.text}</p>
              <button
                onClick={() => setModalItem(null)}
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
