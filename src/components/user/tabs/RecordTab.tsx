import { CheckCircle2, Clock } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { GrabbedOrder } from '../../../types';
import { OrderDetailsModal } from '../modals/OrderDetailsModal';

export const RecordTab: React.FC = () => {
  const { currentUser, orders, submitOrder } = useApp();
  const [activeTab, setActiveTab] = useState<'incomplete' | 'complete'>('incomplete');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inspectOrder, setInspectOrder] = useState<GrabbedOrder | null>(null);

  const userOrders = orders.filter((o) => currentUser && o.userId === currentUser.id);

  const incompleteOrders = userOrders.filter((o) => o.status === 'incomplete');
  const completeOrders = userOrders.filter((o) => o.status === 'completed');

  const displayedList = activeTab === 'incomplete' ? incompleteOrders : completeOrders;

  const handleSubmit = (order: GrabbedOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectOrder(order);
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col pb-20 select-none">
      {/* Top Header matching Screenshot_2026-06-07-12-47-37-38 */}
      <div className="bg-white sticky top-0 z-20 px-4 py-3.5 border-b border-slate-200 text-center">
        <h1 className="font-bold text-black text-base">Record</h1>
      </div>

      {/* Tabs matching screenshot */}
      <div className="bg-white border-b border-slate-200 flex">
        <button
          onClick={() => setActiveTab('incomplete')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
            activeTab === 'incomplete'
              ? 'border-amber-500 text-amber-600 bg-amber-50/20'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          Incomplete ({incompleteOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('complete')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
            activeTab === 'complete'
              ? 'border-amber-500 text-amber-600 bg-amber-50/20'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          Complete ({completeOrders.length})
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="mx-4 mt-3 p-3 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Orders List */}
      <div className="p-4 flex-1 space-y-4">
        {displayedList.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs font-medium">No more</div>
        ) : (
          displayedList.map((order) => {
            const hasMultiItems = order.items && order.items.length > 0;
            return (
              /* Order Card matching Screenshot_2026-06-07-12-51-37-77 */
              <div
                key={order.id}
                onClick={() => setInspectOrder(order)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-black border-b border-slate-100 pb-2">
                  <div>
                    Order Nos:{' '}
                    <span className="font-mono text-black font-semibold">{order.orderNo}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-black ${
                      order.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Product Items List (1 to 3 items) */}
                {hasMultiItems ? (
                  <div className="space-y-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {order.items!.map((item) => (
                      <div key={item.id} className="flex gap-2.5 items-center">
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 p-0.5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="font-bold text-xs text-black truncate">{item.name}</h4>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {item.detailsLabel || 'Original details'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-xs text-black">
                            {item.unitPrice.toFixed(2)} USDT
                          </div>
                          <span className="text-[10px] text-black font-bold">x{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3 items-center">
                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 p-1">
                      <img
                        src={order.productImage}
                        alt={order.productTitle}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-black line-clamp-2">
                        {order.productTitle}
                      </h4>
                      <div className="flex justify-between items-center text-xs font-bold text-black mt-1">
                        <span>{order.unitPrice.toFixed(2)} USDT</span>
                        <span>x{order.quantity}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Specs */}
                {(() => {
                  const orderComm =
                    order.isComboOrder && order.comboCommissionPercent
                      ? Number(((order.orderAmount * order.comboCommissionPercent) / 100).toFixed(4))
                      : order.commission;
                  const orderExpected = Number((order.orderAmount + orderComm).toFixed(4));

                  return (
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs font-semibold text-black border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Transaction time:</span>
                        <span className="text-black font-mono font-bold">{order.createdAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Order amount:</span>
                        <span className="font-bold text-black font-mono">
                          {order.orderAmount.toFixed(2)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Commissions:</span>
                        <span className="font-bold text-emerald-600 font-mono">
                          +{orderComm.toFixed(4)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                        <span className="font-black text-black">Expected income:</span>
                        <span className="text-sm font-black text-[#c48b26] font-mono">
                          {orderExpected.toFixed(4)} USDT
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Submit button for incomplete orders matching grab_order_80330fb5.jpg design */}
                {order.status === 'incomplete' ? (
                  <button
                    onClick={(e) => handleSubmit(order, e)}
                    disabled={submittingId === order.id}
                    className="w-full py-3 bg-[#5b3d42] hover:bg-[#6e4950] active:scale-[0.99] text-white font-bold text-sm rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingId === order.id ? (
                      <Clock className="w-4 h-4 animate-spin text-white" />
                    ) : null}
                    <span>Submit order</span>
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Completed at {order.completedAt?.substring(11, 19) || order.createdAt.substring(11, 19)}</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {displayedList.length > 0 && (
          <div className="text-center py-2 text-xs text-slate-400">No more</div>
        )}
      </div>

      {/* Order Details Modal Popup matching screenshot */}
      <OrderDetailsModal
        order={inspectOrder}
        isOpen={!!inspectOrder}
        onClose={() => setInspectOrder(null)}
        onOrderSubmitted={() => {
          setInspectOrder(null);
          setFeedback('Order submitted successfully! Earned commission credited.');
          setTimeout(() => setFeedback(null), 3000);
        }}
      />
    </div>
  );
};
