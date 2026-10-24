import {
  ArrowUpRight,
  Headphones,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  onNavigate: (page: string) => void;
}

// 5-Polygon Colorful Logo matching top-left of Screenshot_2026-06-07-12-48-53-99
const ColorfulPolygonLogo: React.FC = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-8 h-8 drop-shadow-2xs"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red Polygon - Top Left */}
    <polygon points="34,14 58,16 50,42 26,38" fill="#E53935" />
    {/* Yellow/Orange Polygon - Top Right */}
    <polygon points="58,16 84,34 68,58 50,42" fill="#FBC02D" />
    {/* Green Polygon - Bottom Right */}
    <polygon points="84,34 76,68 48,70 68,58" fill="#43A047" />
    {/* Cyan/Blue Polygon - Bottom Left */}
    <polygon points="76,68 44,86 26,64 48,70" fill="#0288D1" />
    {/* Purple/Violet Polygon - Left */}
    <polygon points="44,86 16,56 26,38 26,64" fill="#8E24AA" />
  </svg>
);

export const HomeTab: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser } = useApp();
  const [modalItem, setModalItem] = useState<{
    title: string;
    image: string;
    description: string;
    detail: string;
    points?: string[];
  } | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Live Payout Notification Feeds matching screenshot
  const payoutFeeds = [
    { user: 'J**********7', status: 'successful', amount: '479.31 USDT' },
    { user: 'K**********2', status: 'successful', amount: '890.00 USDT' },
    { user: 'H**********9', status: 'successful', amount: '159.96 USDT' },
    { user: 'A**********4', status: 'successful', amount: '1,280.50 USDT' },
    { user: 'M**********1', status: 'successful', amount: '320.00 USDT' },
    { user: 'T**********8', status: 'successful', amount: '2,400.00 USDT' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % payoutFeeds.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [payoutFeeds.length]);

  // Exact 4 Platform Introduction Cards with specific attached image mapping
  const platformCards = [
    {
      title: 'Platform profile',
      description: 'MALL is an intelligent cloud global order matching cente...',
      image: '/assets/aistudio/a1.3f945898_a31a0efe.png',
      detail:
        'MALL is an intelligent cloud global order matching center, providing intelligent task allocation and rapid commission distribution for partners in e-commerce ecosystems worldwide. By utilizing high-throughput TRC-20 protocol settlements, users enjoy real-time settlement and high investment returns.',
      points: [
        'Over 1,000,000 registered global active members',
        'Direct automated TRC-20 blockchain settlement',
        'Official merchant order fulfillment with certified retailers',
        '24/7 bilingual customer service concierge',
      ],
    },
    {
      title: 'Platform rules',
      description: 'About recharge: [The platform will change the...',
      image: '/assets/aistudio/a2.d2e2ddaf_16e6377b.png',
      detail:
        'About recharge: [The platform will change the TRC-20 address periodically to guarantee asset isolation and funds security. Members must always copy the live recharge address before depositing.]\n\nTask rules: Each task cycle consists of 25 orders. Members must complete all 25 orders before requesting a withdrawal. After completing 25 tasks, the grabbing system is locked until approved by the admin panel for the next cycle.',
      points: [
        'Recharge Address: Dynamic one-time TRC-20 address protection',
        'Task Cycle: 25 completed tasks unlock the withdrawal gateway',
        'Withdrawal Processing: Verified TRC-20 withdrawals arrive within 10-30 minutes',
        'Zero Hidden Fees: Clear real-time balance and commission auditing',
      ],
    },
    {
      title: 'Win-win cooperation',
      description: 'At MALL, we carry out win-win cooperation for all users...',
      image: '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
      detail:
        'At MALL, we carry out win-win cooperation for all users, building sustainable long-term revenue through 3-tier team referral commissions. Invite friends to join and expand your tier: You will receive 5% direct commission on level 1 referrals, 3% on level 2, and 1% on level 3, creating an ongoing passive income stream.',
      points: [
        'Level 1: 5.0% direct referral commission rebate',
        'Level 2: 3.0% secondary team member rebate',
        'Level 3: 1.0% tertiary network reward rebate',
        'Automatic balance crediting with real-time audit logs',
      ],
    },
    {
      title: 'Instructions for use',
      description: 'To celebrate the MALL membership surpassing...',
      image: '/assets/aistudio/a4.e7293f5f_d901c643.png',
      detail:
        'To celebrate the MALL membership surpassing 1,000,000 members worldwide, VIP tiers enjoy elevated rebate percentages up to 12%.\n\nQuick Start Guide:\n1. Deposit USDT via TRC-20.\n2. Open Menu and click "Grab the order immediately".\n3. Review product details and submit order.\n4. Complete all 25 orders to unlock withdrawals.',
      points: [
        'Step 1: Top up account balance with TRC-20 USDT',
        'Step 2: Enter Menu tab and select matching VIP tier',
        'Step 3: Grab orders and submit for instant commission',
        'Step 4: Bind TRC-20 electronic wallet and withdraw profits',
      ],
    },
  ];

  const currentAnnouncement = payoutFeeds[tickerIndex];

  return (
    <div className="min-h-full bg-slate-50 pb-20 select-none">
      {/* 1. Header with Colorful 5-Polygon Logo matching Screenshot_2026-06-07-12-48-53-99 */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <ColorfulPolygonLogo />
        </div>
        <button
          onClick={() => onNavigate('support')}
          className="p-1.5 text-slate-600 hover:text-black transition-colors cursor-pointer"
          aria-label="Customer Service"
        >
          <Headphones className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Quick Action Grid (4 Outline Icons matching Screenshot) */}
      <div className="bg-white px-4 py-4 grid grid-cols-4 gap-2 text-center border-b border-slate-100">
        {/* Recharge */}
        <button
          onClick={() => onNavigate('deposit')}
          className="flex flex-col items-center justify-center p-1 rounded-xl transition-transform active:scale-95 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl border border-slate-700/80 text-slate-900 flex items-center justify-center mb-1.5 group-hover:border-black group-hover:bg-slate-50 transition-colors">
            <TrendingUp className="w-6 h-6 stroke-[1.7]" />
          </div>
          <span className="text-xs font-semibold text-[#000000]">Recharge</span>
        </button>

        {/* Withdrawal */}
        <button
          onClick={() => onNavigate('withdrawal')}
          className="flex flex-col items-center justify-center p-1 rounded-xl transition-transform active:scale-95 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl border border-slate-700/80 text-slate-900 flex items-center justify-center mb-1.5 group-hover:border-black group-hover:bg-slate-50 transition-colors">
            <Wallet className="w-6 h-6 stroke-[1.7]" />
          </div>
          <span className="text-xs font-semibold text-[#000000]">Withdrawal</span>
        </button>

        {/* Teams */}
        <button
          onClick={() => onNavigate('teams')}
          className="flex flex-col items-center justify-center p-1 rounded-xl transition-transform active:scale-95 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl border border-slate-700/80 text-slate-900 flex items-center justify-center mb-1.5 group-hover:border-black group-hover:bg-slate-50 transition-colors">
            <Users className="w-6 h-6 stroke-[1.7]" />
          </div>
          <span className="text-xs font-semibold text-[#000000]">Teams</span>
        </button>

        {/* Invitation */}
        <button
          onClick={() => onNavigate('invite')}
          className="flex flex-col items-center justify-center p-1 rounded-xl transition-transform active:scale-95 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl border border-slate-700/80 text-slate-900 flex items-center justify-center mb-1.5 group-hover:border-black group-hover:bg-slate-50 transition-colors">
            <UserPlus className="w-6 h-6 stroke-[1.7]" />
          </div>
          <span className="text-xs font-semibold text-[#000000]">Invitation</span>
        </button>
      </div>

      {/* 3. Live Notification Ticker Bar matching Screenshot */}
      <div className="mx-4 mt-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Red outlined avatar icon matching screenshot */}
          <div className="w-8 h-8 rounded-full border border-red-500 text-red-500 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-[#000000] font-mono tracking-tight leading-tight">
              {currentAnnouncement.user}
            </span>
            <span className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
              {currentAnnouncement.status}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-700 font-mono shrink-0">
          {currentAnnouncement.amount}
        </span>
      </div>

      {/* Quick Start / Grab Order shortcut banner */}
      <div className="mx-4 mt-3 p-3.5 bg-gradient-to-r from-[#6e0a12] via-[#52050b] to-[#380105] rounded-xl text-white shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.2 rounded-xs uppercase">
              Task System
            </span>
            <h3 className="font-bold text-xs text-white">Start Grabbing Orders</h3>
          </div>
          <p className="text-[11px] text-white/80 mt-0.5">
            Earn up to 83% High Reward Commission Today!
          </p>
        </div>
        <button
          onClick={() => onNavigate('menu')}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#6e0a12] font-black text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>Grab</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Platform Introduction Section (2x2 Grid matching Screenshot) */}
      <div className="px-4 mt-4 space-y-2.5">
        <h2 className="text-base font-bold text-[#000000] tracking-tight">
          Platform introduction
        </h2>

        {/* 2x2 Grid with exact 4 attached images */}
        <div className="grid grid-cols-2 gap-3">
          {platformCards.map((card, idx) => (
            <div
              key={idx}
              onClick={() =>
                setModalItem({
                  title: card.title,
                  image: card.image,
                  description: card.description,
                  detail: card.detail,
                  points: card.points,
                })
              }
              className="bg-white rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col group active:scale-[0.98]"
            >
              {/* Card Image */}
              <div className="h-28 w-full bg-slate-100 overflow-hidden relative">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Card Text Content */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#000000] mb-0.5 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Introduction Detail Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="h-44 w-full relative shrink-0 bg-slate-100">
              <img
                src={modalItem.image}
                alt={modalItem.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setModalItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#6e0a12] bg-red-50 px-2 py-0.5 rounded-sm">
                  Platform Notice
                </span>
                <h3 className="text-base font-black text-[#000000] mt-1.5">{modalItem.title}</h3>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                {modalItem.detail}
              </div>

              {modalItem.points && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-[#000000]">Key Rules & Points:</h4>
                  <ul className="space-y-1.5">
                    {modalItem.points.map((p, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-2">
                        <span className="text-[#6e0a12] font-bold text-xs leading-none mt-0.5">
                          ✓
                        </span>
                        <span className="leading-snug">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setModalItem(null)}
                className="w-full py-2.5 bg-[#000000] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
