import {
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { DepositNavigationParams, GrabbedOrder } from '../../../types';

interface Props {
  order: GrabbedOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSubmitted?: () => void;
  onNavigateToDeposit?: (params?: DepositNavigationParams) => void;
}

export const OrderDetailsModal: React.FC<Props> = ({
  order,
  isOpen,
  onClose,
  onOrderSubmitted,
  onNavigateToDeposit,
}) => {
  const { currentUser, submitOrder } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  // Use items if available, else create single item from primary order details
  const displayItems =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            id: 'item_fallback',
            name: order.productTitle,
            image: order.productImage,
            unitPrice: order.unitPrice,
            quantity: order.quantity,
            detailsLabel: 'Original details',
          },
        ];

  const userBalance = currentUser?.balance ?? 0;
  const isComboOrder = !!order.isComboOrder;
  const requiredBalance = order.requiredBalance || order.orderAmount;
  const isBalanceSufficient = !isComboOrder || userBalance >= requiredBalance;
  const balanceShortfall = Number(Math.max(0, requiredBalance - userBalance).toFixed(4));

  // Format shortfall matching screenshot, e.g. 17.469 or 305.62
  const formatShortfall = (val: number) => {
    const str = val.toString();
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      if (decimals.length >= 3) {
        return val.toFixed(3);
      }
      return val.toFixed(2);
    }
    return val.toFixed(2);
  };
  const formattedShortfall = formatShortfall(balanceShortfall);

  // FORMULA: Commission = Total Order Amount * Commission Percentage or explicit commission
  const effectiveCommission =
    order.commission > 0
      ? order.commission
      : isComboOrder && order.comboCommissionPercent
      ? Number(((order.orderAmount * order.comboCommissionPercent) / 100).toFixed(4))
      : order.commission;
  const effectiveExpectedIncome = Number((order.orderAmount + effectiveCommission).toFixed(4));

  const handleOverlayClick = () => {
    if (onNavigateToDeposit) {
      onClose();
      if (isComboOrder && userBalance < requiredBalance) {
        onNavigateToDeposit({
          fromComboShortage: true,
          shortfall: balanceShortfall,
          comboStepNumber: order.comboStepNumber,
          requiredAmount: requiredBalance,
        });
      } else {
        onNavigateToDeposit();
      }
    }
  };

  const handleSubmit = () => {
    // If Combo order with deficit, clicking submit order takes user to deposit
    if (isComboOrder && userBalance < requiredBalance) {
      if (onNavigateToDeposit) {
        onClose();
        onNavigateToDeposit({
          fromComboShortage: true,
          shortfall: balanceShortfall,
          comboStepNumber: order.comboStepNumber,
          requiredAmount: requiredBalance,
        });
      }
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = submitOrder(order.id);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMsg(res.message || 'Order submitted successfully!');
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
          if (onOrderSubmitted) onOrderSubmitted();
        }, 1300);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100 flex flex-col space-y-3.5">
        {/* Top Header matching Screenshot */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="text-xs sm:text-sm tracking-tight truncate pr-2">
            <span className="font-bold text-slate-800">Order Nos:</span>{' '}
            <span className="font-semibold text-slate-500 font-mono">{order.orderNo}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-slate-400 hover:text-black transition-colors rounded-full"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success toast overlay */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-950 text-xs font-bold animate-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1 to 3 Matched Product Cards Container matching Screenshot */}
        <div className="space-y-3 max-h-[38vh] overflow-y-auto pr-0.5">
          {displayItems.map((item, index) => (
            <div
              key={item.id || index}
              className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
            >
              {/* Product Thumbnail */}
              <div className="w-14 h-14 rounded-xl bg-[#f0f0f0] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 rounded-lg" />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-bold text-xs sm:text-[13px] text-slate-800 truncate leading-tight">
                  {item.name}
                </h4>
                <div className="font-bold text-xs text-slate-500 mt-1">
                  {item.unitPrice.toFixed(2)}USDT
                </div>
              </div>

              {/* Quantity */}
              <div className="font-bold text-xs sm:text-[13px] text-slate-500 shrink-0">
                x{item.quantity}
              </div>
            </div>
          ))}
        </div>

        {/* Financial Specs List matching Screenshot */}
        <div className="space-y-1.5 text-xs font-semibold text-slate-500 pt-1">
          <div className="flex justify-between items-center">
            <span>Transaction time</span>
            <span className="font-bold text-slate-800 font-mono">{order.createdAt}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Order amount</span>
            <span className="font-bold text-slate-800 font-mono">
              {order.orderAmount.toFixed(order.orderAmount % 1 !== 0 && order.orderAmount.toString().split('.')[1]?.length > 2 ? 4 : 2)}USDT
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Commissions</span>
            <span className="font-bold text-slate-800 font-mono">
              {effectiveCommission.toFixed(4)}USDT
            </span>
          </div>

          <div className="flex justify-between items-center pt-1.5">
            <span className="font-bold text-slate-600">Expected income</span>
            <span className="font-black text-[#f39800] text-base sm:text-lg font-mono">
              {effectiveExpectedIncome.toFixed(4)}USDT
            </span>
          </div>
        </div>

        {/* COMBO ORDER POPUP OVERLAY (INSUFFICIENT BALANCE) matching Screenshot */}
        {isComboOrder && !isBalanceSufficient && (
          <div
            onClick={handleOverlayClick}
            className="absolute inset-x-6 top-[40%] -translate-y-1/2 z-30 bg-[#2b2b2b]/95 backdrop-blur-xs border border-white/10 rounded-2xl p-5 shadow-2xl text-center cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] animate-in zoom-in-95 duration-150"
            title="Click to recharge"
          >
            <p className="text-white font-bold text-xs sm:text-[13px] leading-relaxed select-none">
              Your account balance is not enough, you need to recharge {formattedShortfall} to submit this order
            </p>
          </div>
        )}

        {/* Submit Order Button matching Screenshot */}
        <div className="pt-1">
          {order.status === 'incomplete' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#5b1f2b] hover:bg-[#6b2433] active:bg-[#4d1a24] text-white font-bold text-sm sm:text-base rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting order...</span>
                </>
              ) : (
                <span>Submit order</span>
              )}
            </button>
          ) : (
            <div className="w-full py-3 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-2xl text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Order already completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
