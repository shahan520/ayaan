import { ArrowLeft, CheckCircle2, ShoppingBag, ShoppingCart, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { GrabbedOrder } from '../../../types';
import { OrderDetailsModal } from '../modals/OrderDetailsModal';

interface Props {
  onNavigateToRecord: () => void;
  onNavigateToDeposit: () => void;
}

export const MenuTab: React.FC<Props> = ({ onNavigateToRecord, onNavigateToDeposit }) => {
  const { currentUser, grabOrder, orders } = useApp();
  const [selectedVip, setSelectedVip] = useState<'All' | 'VIP 1' | 'VIP 2' | 'VIP 3'>('All');
  const [activePlatformDetail, setActivePlatformDetail] = useState<'Amazon' | 'Alibaba' | 'Aliexpress' | null>(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [justMatchedOrderNo, setJustMatchedOrderNo] = useState<string | null>(null);

  // Modal order state for OrderDetailsModal matching grab_order_80330fb5.jpg
  const [activeModalOrder, setActiveModalOrder] = useState<GrabbedOrder | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
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

  const handleGrabOrder = () => {
    if (!currentUser) {
      showToast('Please log in first to grab orders');
      return;
    }

    // Check if user has an incomplete order
    const incompleteOrder = orders.find(
      (o) => o.userId === currentUser.id && o.status === 'incomplete'
    );
    if (incompleteOrder) {
      setActiveModalOrder(incompleteOrder);
      showToast('You have an unpaid order, please complete the payment first');
      return;
    }

    // Check balance
    const bal = currentUser.balance;
    if (bal < activePlatformObj.minBal || (activePlatformObj.maxBal !== Infinity && bal > activePlatformObj.maxBal)) {
      if (activePlatformObj.name === 'Amazon') {
        showToast('Amazon only allows users with balances 20-498 to grab orders');
      } else if (activePlatformObj.name === 'Alibaba') {
        showToast('Alibaba only allows users with balances 499-899 to grab orders');
      } else {
        showToast('Aliexpress requires a minimum balance of 899 USDT to grab orders');
      }
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
        showToast(res.message || 'Failed to match order');
      }
    }, 800);
  };

  // If inside detail view of a platform
  if (activePlatformDetail) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col pb-20 relative">
        {/* Dark Red Gradient Header matching Screenshot_2026-06-07-12-51-20-33 */}
        <div className="bg-gradient-to-b from-[#8b0000] via-[#6d1316] to-[#4a0000] text-white px-4 pt-3 pb-8">
          <div className="flex items-center pb-4 border-b border-white/10">
            <button
              onClick={() => setActivePlatformDetail(null)}
              className="p-1 -ml-1 text-white hover:text-red-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex-1 text-center font-bold text-base pr-4">
              {activePlatformObj.name}
            </h1>
          </div>

          <div className="pt-3">
            <span className="text-xs text-white/70 block">Account Balance:</span>
            <span className="text-3xl font-bold tracking-tight text-white">
              {currentUser?.balance.toFixed(2) || '0.00'} USDT
            </span>
          </div>
        </div>

        {/* 6 Stats Grid Card floating above header matching screenshot */}
        <div className="px-4 -mt-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 grid grid-cols-2 gap-y-4 gap-x-3 text-center">
            <div>
              <span className="text-base font-bold text-slate-800 block">
                {currentUser?.todayOrdersCount || 0}
              </span>
              <span className="text-[11px] text-slate-500">Today's Times</span>
            </div>
            <div>
              <span className="text-base font-bold text-slate-800 block">
                {(currentUser?.todayCommission || 0).toFixed(4)} USDT
              </span>
              <span className="text-[11px] text-slate-500">Today's commission</span>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-base font-bold text-slate-800 block">0 USDT</span>
              <span className="text-[11px] text-slate-500">Cash gap between tasks</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-base font-bold text-slate-800 block">12.7968 USDT</span>
              <span className="text-[11px] text-slate-500">Yesterday's buy commission</span>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-base font-bold text-slate-800 block">0 USDT</span>
              <span className="text-[11px] text-slate-500">Yesterday's team commission</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-base font-bold text-slate-800 block">
                {currentUser?.frozenBalance || 0} USDT
              </span>
              <span className="text-[11px] text-slate-500">Money frozen in accounts</span>
            </div>
          </div>
        </div>

        {/* Order Grab Button */}
        <div className="p-4 space-y-4">
          <button
            onClick={handleGrabOrder}
            disabled={isGenerating}
            className="w-full py-3.5 bg-[#694248] hover:bg-[#7b4f56] active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <span>Matching task...</span>
            ) : (
              <span>Grab the order immediately</span>
            )}
          </button>

          {justMatchedOrderNo && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
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
                className="font-bold underline text-emerald-700"
              >
                View Order
              </button>
            </div>
          )}

          {/* Hint Section matching Screenshot */}
          <div className="text-xs text-slate-500 space-y-1.5 p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-slate-700 text-[11px]">Hint:</p>
            <p className="text-[11px] leading-relaxed">
              1: {activePlatformObj.rateText} of the amount of completed transactions earned.
            </p>
            <p className="text-[11px] leading-relaxed">
              2: The system sends tasks randomly. Complete them as soon as possible after matching
              them, so as to avoid hanging all the time.
            </p>
          </div>

          {/* Quick deposit shortcut if balance is insufficient */}
          {currentUser && currentUser.balance < activePlatformObj.minBal && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
              <span>Your balance is below {activePlatformObj.minBal} USDT requirement.</span>
              <button
                onClick={onNavigateToDeposit}
                className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700"
              >
                Deposit Now
              </button>
            </div>
          )}
        </div>

        {/* Dark Pop-up Toast */}
        {toastMessage && (
          <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-6 pointer-events-none">
            <div className="max-w-xs bg-slate-900/90 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-center animate-in fade-in zoom-in-95 duration-150">
              {toastMessage}
            </div>
          </div>
        )}

        {/* Exact Order Details Modal matching grab_order_80330fb5.jpg */}
        <OrderDetailsModal
          order={activeModalOrder}
          isOpen={!!activeModalOrder}
          onClose={() => setActiveModalOrder(null)}
          onOrderSubmitted={() => {
            showToast('Order submitted successfully! Commission credited.');
          }}
        />
      </div>
    );
  }

  // Master Menu List matching Screenshot_2026-06-07-12-51-13-24
  return (
    <div className="min-h-full bg-slate-50 flex flex-col pb-20 relative">
      {/* Top Title Bar */}
      <div className="bg-white sticky top-0 z-20 px-4 py-3.5 border-b border-slate-200 text-center">
        <h1 className="font-bold text-slate-900 text-base">Menu</h1>
      </div>

      {/* Segmented VIP Filter Tabs matching screenshot */}
      <div className="bg-white p-3 border-b border-slate-200">
        <div className="flex gap-2">
          {(['All', 'VIP 1', 'VIP 2', 'VIP 3'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedVip(tab)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
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

      {/* Platform VIP Cards List matching screenshot */}
      <div className="p-4 space-y-3.5 flex-1">
        {filteredPlatforms.map((p) => (
          <div
            key={p.name}
            onClick={() => setActivePlatformDetail(p.name)}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs cursor-pointer hover:border-red-400 hover:shadow-md transition-all relative overflow-hidden"
          >
            {/* VIP Gold Tag on top left corner */}
            <div className="mb-2">
              <span className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-sm shadow-xs">
                {p.tier}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Brand Icon Badge */}
              <div
                className={`w-14 h-14 rounded-xl ${p.bgColor} flex items-center justify-center shrink-0 shadow-xs`}
              >
                {p.icon}
              </div>

              {/* Info details */}
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

      {toastMessage && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-6 pointer-events-none">
          <div className="max-w-xs bg-slate-900/90 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-center animate-in fade-in zoom-in-95 duration-150">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Exact Order Details Modal matching grab_order_80330fb5.jpg */}
      <OrderDetailsModal
        order={activeModalOrder}
        isOpen={!!activeModalOrder}
        onClose={() => setActiveModalOrder(null)}
        onOrderSubmitted={() => {
          showToast('Order submitted successfully! Commission credited.');
        }}
      />
    </div>
  );
};
