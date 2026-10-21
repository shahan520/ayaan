import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  initialType?: 'deposit' | 'withdrawal';
  onBack: () => void;
}

export const RecordsPage: React.FC<Props> = ({ initialType = 'deposit', onBack }) => {
  const { currentUser, deposits, withdrawals } = useApp();
  const [recordType, setRecordType] = useState<'deposit' | 'withdrawal'>(initialType);

  const userDeposits = deposits.filter(
    (d) => currentUser && (d.userId === currentUser.id || d.userUid === currentUser.uid)
  );

  const userWithdrawals = withdrawals.filter(
    (w) => currentUser && (w.userId === currentUser.id || w.userUid === currentUser.uid)
  );

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Top App Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-slate-800 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-900 text-base pr-4">
          {recordType === 'deposit' ? 'Deposit records' : 'Withdrawal records'}
        </h1>
      </div>

      {/* Switch between Deposit / Withdrawal records */}
      <div className="bg-white border-b border-slate-200 flex px-4 pt-2">
        <button
          onClick={() => setRecordType('deposit')}
          className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
            recordType === 'deposit'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Deposit Records ({userDeposits.length})
        </button>
        <button
          onClick={() => setRecordType('withdrawal')}
          className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
            recordType === 'withdrawal'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Withdrawal Records ({userWithdrawals.length})
        </button>
      </div>

      <div className="p-4 flex-1">
        {recordType === 'deposit' ? (
          userDeposits.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">No more</div>
          ) : (
            <div className="space-y-3">
              {userDeposits.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900">
                        +{item.amount.toFixed(2)} USDT
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Protocol: {item.protocol}
                      </span>
                    </div>

                    <div>
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Under Review
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg text-[11px] font-mono text-slate-600 break-all">
                    TXID: {item.txid}
                  </div>

                  {item.rejectionReason && (
                    <div className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded-sm">
                      Note: {item.rejectionReason}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>Submitted: {item.createdAt}</span>
                    {item.reviewedBy && <span>Verified by: {item.reviewedBy}</span>}
                  </div>
                </div>
              ))}
              <div className="text-center py-4 text-xs text-slate-400">No more</div>
            </div>
          )
        ) : userWithdrawals.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">No more</div>
        ) : (
          <div className="space-y-3">
            {userWithdrawals.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-slate-900">
                      -{item.amount.toFixed(2)} USDT
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Protocol: {item.protocol}
                    </span>
                  </div>

                  <div>
                    {(item.status === 'completed' || item.status === 'approved') && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Completed
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-700" /> Pending
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded-full border border-red-300">
                        <XCircle className="w-3 h-3 text-red-700" /> Rejected (Refunded)
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg text-[11px] font-mono text-slate-600 break-all">
                  To: {item.walletAddress}
                </div>

                {item.rejectionReason && (
                  <div className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded-sm">
                    Reason: {item.rejectionReason}
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Submitted: {item.createdAt}</span>
                  {item.reviewedBy && <span>Reviewed by: {item.reviewedBy}</span>}
                </div>
              </div>
            ))}
            <div className="text-center py-4 text-xs text-slate-400">No more</div>
          </div>
        )}
      </div>
    </div>
  );
};
