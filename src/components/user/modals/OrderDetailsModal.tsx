import { CheckCircle2, Clock, X } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { GrabbedOrder } from '../../../types';

interface Props {
  order: GrabbedOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSubmitted?: () => void;
}

export const OrderDetailsModal: React.FC<Props> = ({
  order,
  isOpen,
  onClose,
  onOrderSubmitted,
}) => {
  const { submitOrder } = useApp();
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

  const handleSubmit = () => {
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
        }, 1200);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100 flex flex-col space-y-4">
        {/* Top Header matching Screenshot */}
        <div className="flex items-center justify-between">
          <div className="font-black text-black text-sm tracking-tight">
            Order Nos: <span className="font-mono text-black font-bold">{order.orderNo}</span>
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
          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-900 text-xs font-bold animate-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1 to 3 Matched Product Cards Container matching Screenshot */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-3 max-h-[46vh] overflow-y-auto">
          {displayItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Product Thumbnail */}
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to stock SVG icon if unpredicted network issue
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-bold text-xs text-black truncate leading-tight">
                  {item.name}
                </h4>
                <div className="font-bold text-xs text-black mt-0.5">
                  {item.unitPrice.toFixed(2)}USDT
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {item.detailsLabel || 'Original details'}
                </div>
              </div>

              {/* Quantity */}
              <div className="font-bold text-xs text-black shrink-0">
                x{item.quantity}
              </div>
            </div>
          ))}
        </div>

        {/* Financial Specs List matching Screenshot */}
        <div className="space-y-1.5 text-xs font-bold text-black px-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-black">Transaction time:</span>
            <span className="font-mono text-black font-semibold">{order.createdAt}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-black">Order amount:</span>
            <span className="font-mono font-bold text-black">{order.orderAmount.toFixed(2)}USDT</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-black">Commissions:</span>
            <span className="font-mono font-bold text-black">+{order.commission.toFixed(4)}USDT</span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
            <span className="font-bold text-black">Expected income:</span>
            <span className="font-mono font-black text-[#c48b26] text-sm">
              {order.expectedIncome.toFixed(4)}USDT
            </span>
          </div>
        </div>

        {/* Dark Brown / Burgundy Submit Order Button matching Screenshot */}
        <div>
          {order.status === 'incomplete' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#5b3d42] hover:bg-[#6e4950] active:scale-[0.99] text-white font-bold text-sm rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="w-full py-3 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-full text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Order already completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
