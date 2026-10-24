import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { GrabbedOrder } from '../../../types';
import { getPlatformBalanceValidationMessage } from '../../../utils/balanceValidation';
import { OrderDetailsModal } from '../modals/OrderDetailsModal';

interface Props {
  onNavigateToRecord: () => void;
  onNavigateToDeposit: () => void;
  onNavigateToWithdrawal?: () => void;
  onNavigateToSupport?: () => void;
}

export const MenuTab: React.FC<Props> = ({
  onNavigateToRecord,
  onNavigateToDeposit,
  onNavigateToWithdrawal,
  onNavigateToSupport,
}) => {
  const { currentUser, grabOrder, orders } = useApp();
  const [selectedVip, setSelectedVip] = useState<'All' | 'VIP 1' | 'VIP 2' | 'VIP 3'>('All');
  // Default to null so the VIP Hall / platform list (Amazon VIP 1, Alibaba VIP 2, Aliexpress VIP 3) is rendered first
  const [activePlatformDetail, setActivePlatformDetail] = useState<'Amazon' | 'Alibaba' | 'Aliexpress' | null>(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [justMatchedOrderNo, setJustMatchedOrderNo] = useState<string | null>(null);

  // Modal order state for OrderDetailsModal matching grab_order_80330fb5.jpg
  const [activeModalOrder, setActiveModalOrder] = useState<GrabbedOrder | null>(null);

  // Modal for locked work cycle (25/25 tasks done)
  const [showCycleLockedModal, setShowCycleLockedModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const platforms = [
    {
      tier: 'VIP 1' as const,
      name: 'Amazon' as const,
      range: '20USDT-498 USDT',
      rateText: '4%',
      minBal: 20,
      maxBal: 498,
      commissionRate: 0.04,
      bgColor: 'bg-blue-600',
      icon: <ShoppingCart className="w-8 h-8 text-white" />,
    },
    {
      tier: 'VIP 2' as const,
      name: 'Alibaba' as const,
      range: '499USDT-899 USDT',
      rateText: '8%',
      minBal: 499,
      maxBal: 899,
      commissionRate: 0.08,
      bgColor: 'bg-orange-500',
      icon: <ShoppingBag className="w-8 h-8 text-white" />,
    },
    {
      tier: 'VIP 3' as const,
      name: 'Aliexpress' as const,
      range: '≥899 USDT',
      rateText: '12%',
      minBal: 899,
      maxBal: Infinity,
      commissionRate: 0.12,
      bgColor: 'bg-red-500',
      icon: <Sparkles className="w-8 h-8 text-white" />,
    },
  ];

  const filteredPlatforms =
    selectedVip === 'All'
      ? platforms
      : platforms.filter((p) => p.tier === selectedVip);

  const activePlatformObj = platforms.find((p) => p.name === activePlatformDetail) || platforms[0];

  const currentCycleTasks = currentUser?.currentCycleTasks ?? 0;
  const isCycleLocked = currentCycleTasks >= 25 || !currentUser?.cycleApprovedByAdmin;

  // Pending gap calculation (if an incomplete order requires more balance)
  const incompleteOrder = orders.find(
    (o) => o.userId === currentUser?.id && o.status === 'incomplete'
  );
  const pendingShortfall =
    incompleteOrder && incompleteOrder.requiredBalance && currentUser
      ? Math.max(0, incompleteOrder.requiredBalance - currentUser.balance)
      : 0;

  const handleGrabOrder = () => {
    if (!currentUser) {
      showToast('Please log in first to grab orders');
      return;
    }

    // RULE 1: Check if 25 tasks completed for current work cycle
    if (isCycleLocked) {
      setShowCycleLockedModal(true);
      return;
    }

    // Check if user has an incomplete order (Mandatory deficit rule)
    if (incompleteOrder) {
      setActiveModalOrder(incompleteOrder);
      if (incompleteOrder.isComboOrder) {
        showToast(`Mandatory Combo Order #${incompleteOrder.comboStepNumber} pending! Please deposit deficit.`);
      } else {
        showToast('You have an unpaid order, please complete the payment first');
      }
      return;
    }

    // Check balance with dynamic suggestion warnings
    const bal = currentUser.balance;
    const balanceWarning = getPlatformBalanceValidationMessage(activePlatformObj.name, bal);
    if (balanceWarning) {
      showToast(balanceWarning);
      return;
    }

    // Simulate generation delay
    setIsGenerating(true);
    showToast('The order is being generated... Please try again later.');

    setTimeout(() => {
      setIsGenerating(false);
      const res = grabOrder(activePlatformObj.tier);
      if (res.success && res.order) {
        setJustMatchedOrderNo(res.order.orderNo);
        setActiveModalOrder(res.order);
      } else {
        if (res.isCycleLocked) {
          setShowCycleLockedModal(true);
        } else {
          showToast(res.message || 'Failed to match order');
        }
      }
    }, 800);
  };

  // --------------------------------------------------------------------------
  // ORDER GRABBING / TASK PAGE DASHBOARD MATCHING PREVIOUS COLOR SCHEME
  // (Screenshot_2026-06-07-12-51-20-33)
  // --------------------------------------------------------------------------
  if (activePlatformDetail) {
    // Dynamic Stats metrics
    const userBalanceDisplay = currentUser ? currentUser.balance.toFixed(2) : '0.00';
    const todayTimes = currentUser?.todayOrdersCount ?? 0;
    const todayCommissionStr = `${(currentUser?.todayCommission ?? 0).toFixed(4)}USDT`;
    const cashGapStr = pendingShortfall > 0 ? `${pendingShortfall.toFixed(2)}USDT` : '0USDT';
    const yesterdayBuyCommissionStr = `${(currentUser?.yesterdayCommission ?? 0).toFixed(4)}USDT`;
    const yesterdayTeamCommissionStr = '0USDT';
    const frozenMoneyStr = `${(currentUser?.frozenBalance ?? 0).toFixed(2)}USDT`;

    return (
      <div className="min-h-full bg-slate-50 flex flex-col pb-20 relative select-none font-sans">
        {/* 1. Previous Deep Wine / Dark Red Gradient Header matching Screenshot_2026-06-07-12-51-20-33 */}
        <div className="bg-gradient-to-b from-[#8b0000] via-[#6d1316] to-[#4a0000] text-white px-4 pt-3 pb-12 shadow-md">
          {/* Top Bar with Back Arrow and Title */}
          <div className="flex items-center justify-between pb-3">
            <button
              onClick={() => setActivePlatformDetail(null)}
              className="p-1 -ml-1 text-white hover:text-red-200 transition-colors cursor-pointer"
              aria-label="Back to Menu"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="font-bold text-base text-white tracking-wide">
              {activePlatformObj.name}
            </h1>
            <div className="w-5" /> {/* Spacer for visual balance */}
          </div>

          {/* Account Balance Display */}
          <div className="pt-2 pb-1">
            <span className="text-xs text-white/80 block font-medium">Account Balance:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                {userBalanceDisplay}
              </span>
              <span className="text-lg font-bold text-white tracking-tight">USDT</span>
            </div>
          </div>
        </div>

        {/* 2. Floating White Statistical Dashboard Card (2 Columns, 3 Rows) */}
        <div className="-mt-8 mx-4 bg-white rounded-3xl shadow-md border border-slate-100 p-6">
          <div className="grid grid-cols-2 gap-y-6 text-center">
            {/* ROW 1: Left - Today's Times */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono leading-none">
                {todayTimes}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1.5 leading-tight">
                Today's Times
              </span>
            </div>

            {/* ROW 1: Right - Today's commission */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono leading-none">
                {todayCommissionStr}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1.5 leading-tight">
                Today's commission
              </span>
            </div>

            {/* ROW 2: Left - Cash gap between tasks */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono leading-none">
                {cashGapStr}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1.5 leading-tight">
                Cash gap between tasks
              </span>
            </div>

            {/* ROW 2: Right - Yesterday's buy commission */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono leading-none">
                {yesterdayBuyCommissionStr}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1.5 leading-tight">
                Yesterday's buy commission
              </span>
            </div>

            {/* ROW 3: Left - Yesterday's team commission */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono leading-none">
                {yesterdayTeamCommissionStr}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1.5 leading-tight">
                Yesterday's team commission
              </span>
            </div>

            {/* ROW 3: Right - Money frozen in accounts */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono leading-none">
                {frozenMoneyStr}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1.5 leading-tight">
                Money frozen in accounts
              </span>
            </div>
          </div>
        </div>

        {/* 3. Action Section matching Previous Scheme */}
        <div className="px-4 mt-6 space-y-4">
          {/* Work Cycle Progress Indicator */}
          <div className="flex items-center justify-between text-xs px-2 text-slate-600 font-medium">
            <span>Cycle #{currentUser?.cycleNumber || 1} Progress</span>
            <span className="font-bold text-[#8b0000] font-mono">
              {currentCycleTasks} / 25 Tasks Completed
            </span>
          </div>

          {/* Professional Motivational Banner */}
          <div className="p-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-2 text-xs text-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#8b0000]/10 text-[#8b0000] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  Daily Trading Tasks
                </span>
                <span className="text-[11px] text-slate-500 font-medium leading-tight">
                  Complete your daily tasks to maximize your trading commission rewards.
                </span>
              </div>
            </div>
          </div>

          {/* Grab the order immediately Button matching Previous burgundy/wine style */}
          <button
            onClick={handleGrabOrder}
            disabled={isGenerating}
            className={`w-full py-3.5 text-white font-bold text-base rounded-full shadow-md transition-all active:scale-[0.99] cursor-pointer text-center ${
              isCycleLocked
                ? 'bg-slate-400 hover:bg-slate-500'
                : 'bg-[#694248] hover:bg-[#7b4f56]'
            }`}
          >
            {isGenerating ? (
              <span>Matching task...</span>
            ) : isCycleLocked ? (
              <span className="flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4" /> Cycle Completed (25/25 Tasks)
              </span>
            ) : (
              <span>Grab the order immediately</span>
            )}
          </button>

          {/* Just Matched Order Notification banner */}
          {justMatchedOrderNo && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Task matched! Ready for submission.</span>
              </div>
              <button
                onClick={() => {
                  const ord = orders.find((o) => o.orderNo === justMatchedOrderNo);
                  if (ord) setActiveModalOrder(ord);
                  else onNavigateToRecord();
                }}
                className="font-bold underline text-emerald-700 cursor-pointer"
              >
                View Order
              </button>
            </div>
          )}

          {/* Hint Section matching exact wording from screenshot */}
          <div className="pt-2 space-y-1.5 text-slate-500">
            <p className="font-bold text-slate-700 text-xs">Hint:</p>
            <p className="text-[11px] leading-relaxed">
              1: {activePlatformObj.rateText} of the amount of completed transactions earned.
            </p>
            <p className="text-[11px] leading-relaxed">
              2: The system sends tasks randomly. Complete them as soon as possible after matching them, so as to avoid hanging all the time.
            </p>
          </div>
        </div>

        {/* Dark Pop-up Toast matching image_f81c148b.png */}
        {toastMessage && (
          <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 pointer-events-none">
            <div className="max-w-[340px] bg-slate-900/95 text-white text-xs font-semibold px-4 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 text-center leading-relaxed animate-in fade-in zoom-in-95 duration-150">
              {toastMessage}
            </div>
          </div>
        )}

        {/* Order Details Modal matching grab_order_80330fb5.jpg */}
        <OrderDetailsModal
          order={activeModalOrder}
          isOpen={!!activeModalOrder}
          onClose={() => setActiveModalOrder(null)}
          onNavigateToDeposit={onNavigateToDeposit}
          onOrderSubmitted={() => {
            showToast('Order submitted successfully! Commission credited.');
          }}
        />

        {/* Cycle Locked Modal */}
        {showCycleLockedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-base text-black">Work Cycle Complete (25/25)</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  You have completed all <strong>25 tasks</strong> for Cycle #{currentUser?.cycleNumber || 1}. The task grabbing system is now locked.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 font-bold space-y-1 text-left">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Withdrawal Feature UNLOCKED!</span>
                </div>
                <p className="text-[11px] text-emerald-900/80 font-normal">
                  Your 25-task requirement is satisfied. You can now submit your USDT withdrawal request.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700 text-left">
                <strong>Need to start your next 25 tasks?</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Per security rules, users cannot restart task grabbing automatically. Please contact Customer Support / Admin to approve and reset your next 25-task cycle.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {onNavigateToWithdrawal && (
                  <button
                    onClick={() => {
                      setShowCycleLockedModal(false);
                      onNavigateToWithdrawal();
                    }}
                    className="w-full py-3 bg-[#8b0000] hover:bg-[#a00000] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Go to Withdrawal Page
                  </button>
                )}
                {onNavigateToSupport && (
                  <button
                    onClick={() => {
                      setShowCycleLockedModal(false);
                      onNavigateToSupport();
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Contact Customer Support
                  </button>
                )}
                <button
                  onClick={() => setShowCycleLockedModal(false)}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Master Menu List matching VIP Selection Screen
  return (
    <div className="min-h-full bg-slate-50 flex flex-col pb-20 relative select-none font-sans">
      {/* Top Title Bar */}
      <div className="bg-white sticky top-0 z-20 px-4 py-3.5 border-b border-slate-200 text-center">
        <h1 className="font-bold text-slate-900 text-base">Menu</h1>
      </div>

      {/* 25-Task Work Cycle Progress Banner */}
      <div className="p-4 pb-0">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-black">
                Work Cycle #{currentUser?.cycleNumber || 1}
              </span>
              {isCycleLocked ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> LOCKED (25/25)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                  ACTIVE
                </span>
              )}
            </div>
            <span className="font-mono text-xs font-bold text-black">
              {currentCycleTasks} / 25 Tasks
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCycleLocked
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500'
              }`}
              style={{
                width: `${Math.min(100, (currentCycleTasks / 25) * 100)}%`,
              }}
            />
          </div>

          {isCycleLocked ? (
            <div className="text-[11px] text-rose-700 font-medium flex items-center justify-between">
              <span>Completed 25 tasks! Withdrawal unlocked.</span>
              {onNavigateToWithdrawal && (
                <button
                  onClick={onNavigateToWithdrawal}
                  className="font-bold underline text-[#8b0000] hover:text-black cursor-pointer"
                >
                  Withdraw Now →
                </button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-600 flex items-center justify-between">
              <span>{25 - currentCycleTasks} tasks remaining to unlock Withdrawal</span>
              {currentUser?.cycleNumber === 1 && currentCycleTasks < (currentUser?.comboOrderStep || 14) && (
                <span className="text-amber-700 font-bold">
                  ⚡ Special Combo Order at Task #{currentUser?.comboOrderStep || 14}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Segmented VIP Filter Tabs */}
      <div className="bg-white p-3 border-b border-slate-200 mt-3">
        <div className="flex gap-2">
          {(['All', 'VIP 1', 'VIP 2', 'VIP 3'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedVip(tab)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                selectedVip === tab
                  ? 'bg-[#694248] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Platform VIP Cards List */}
      <div className="p-4 space-y-3.5 flex-1">
        {filteredPlatforms.map((p) => (
          <div
            key={p.name}
            onClick={() => setActivePlatformDetail(p.name)}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="mb-2">
              <span className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-sm shadow-xs">
                {p.tier}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl ${p.bgColor} flex items-center justify-center shrink-0 shadow-xs`}
              >
                {p.icon}
              </div>

              <div className="space-y-1 flex-1">
                <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-600">Available balance: {p.range}</p>
                <p className="text-xs text-red-600 font-semibold">
                  Commissions: <span className="font-bold">{p.rateText}</span>
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center py-4 text-xs text-slate-400">No more</div>
      </div>
    </div>
  );
};
