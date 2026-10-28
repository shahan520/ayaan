import { AlertCircle, ArrowLeft, Check, CheckCircle2, Clock, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { DEMO_TRC20_ADDRESS_POOL, DepositNavigationParams } from '../../../types';
import { QRCodeSVG } from '../../common/QRCodeSVG';

interface Props {
  onBack: () => void;
  onNavigateToRecords: () => void;
  navigationParams?: DepositNavigationParams | null;
}

export const DepositPage: React.FC<Props> = ({ onBack, onNavigateToRecords, navigationParams }) => {
  const { systemConfig, submitDeposit, currentUser, orders, deposits } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [manualCycleOffset, setManualCycleOffset] = useState<number>(0);

  // MANUAL DEPOSIT AMOUNT INPUT:
  // When redirected from combo shortage, do not auto-fill or lock the deposit amount field.
  // Leave the deposit amount input field blank and editable so the customer manually types their desired deposit amount.
  const [amount, setAmount] = useState<string>('');
  const [txid, setTxid] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Optional combo shortage information banner (informational only; does not lock or pre-fill input)
  const comboShortageNotice = React.useMemo(() => {
    if (navigationParams?.fromComboShortage && navigationParams.shortfall) {
      return {
        shortfall: navigationParams.shortfall,
        stepNumber: navigationParams.comboStepNumber,
      };
    }
    const incomplete = orders.find(
      (o) => o.userId === currentUser?.id && o.status === 'incomplete' && o.isComboOrder
    );
    if (!incomplete || !incomplete.requiredBalance || !currentUser) return null;
    const diff = Number(Math.max(0, incomplete.requiredBalance - currentUser.balance).toFixed(2));
    if (diff > 0) {
      return {
        shortfall: diff,
        stepNumber: incomplete.comboStepNumber,
      };
    }
    return null;
  }, [navigationParams, orders, currentUser]);

  // DYNAMIC TRC-20 DEPOSIT ADDRESS ROTATION:
  // 1. For demo accounts: sequentially cycle through 4 distinct addresses for the 4 consecutive combo stages (Tasks #9, #14, #19, #24)
  // 2. For real accounts: sequentially cycle through the admin-managed TRC-20 address pool across consecutive transactions.
  //    If user has an active incomplete combo order, retain and display its assigned depositAddress.
  const { activeDepositAddress, activeStageNumber, realRotationInfo } = React.useMemo(() => {
    if (currentUser?.isDemoAccount) {
      // 1. If an incomplete combo order exists, use its stage-assigned address
      const incomplete = orders.find(
        (o) => o.userId === currentUser.id && o.status === 'incomplete' && o.isComboOrder
      );
      if (incomplete?.depositAddress) {
        let stage = 1;
        if (incomplete.comboStepNumber === 9) stage = 1;
        else if (incomplete.comboStepNumber === 14) stage = 2;
        else if (incomplete.comboStepNumber === 19) stage = 3;
        else if (incomplete.comboStepNumber === 24) stage = 4;
        return {
          activeDepositAddress: incomplete.depositAddress,
          activeStageNumber: stage,
          realRotationInfo: null,
        };
      }
      if (incomplete?.comboStepNumber) {
        if (incomplete.comboStepNumber === 9)
          return { activeDepositAddress: DEMO_TRC20_ADDRESS_POOL[0], activeStageNumber: 1, realRotationInfo: null };
        if (incomplete.comboStepNumber === 14)
          return { activeDepositAddress: DEMO_TRC20_ADDRESS_POOL[1], activeStageNumber: 2, realRotationInfo: null };
        if (incomplete.comboStepNumber === 19)
          return { activeDepositAddress: DEMO_TRC20_ADDRESS_POOL[2], activeStageNumber: 3, realRotationInfo: null };
        if (incomplete.comboStepNumber === 24)
          return { activeDepositAddress: DEMO_TRC20_ADDRESS_POOL[3], activeStageNumber: 4, realRotationInfo: null };
      }

      // 2. Otherwise determine stage from current cycle progress
      const tasks = currentUser.currentCycleTasks ?? 0;
      let stageIndex = 0;
      if (tasks >= 20) stageIndex = 3;
      else if (tasks >= 15) stageIndex = 2;
      else if (tasks >= 10) stageIndex = 1;
      else stageIndex = 0;

      return {
        activeDepositAddress: DEMO_TRC20_ADDRESS_POOL[stageIndex],
        activeStageNumber: stageIndex + 1,
        realRotationInfo: null,
      };
    }

    // REAL USER ACCOUNTS: Sequential rotation across consecutive transactions
    const pool =
      systemConfig.trc20AddressPool && systemConfig.trc20AddressPool.length > 0
        ? systemConfig.trc20AddressPool
        : [systemConfig.trc20DepositAddress];

    // Check if user has an incomplete combo order with assigned depositAddress
    const incompleteCombo = orders.find(
      (o) => o.userId === currentUser?.id && o.status === 'incomplete' && o.isComboOrder
    );
    if (incompleteCombo?.depositAddress) {
      const assignedAddr = incompleteCombo.depositAddress;
      const poolIdx = pool.indexOf(assignedAddr);
      return {
        activeDepositAddress: assignedAddr,
        activeStageNumber: null,
        realRotationInfo: {
          poolIndex: poolIdx >= 0 ? poolIdx + 1 : 1,
          totalPool: pool.length,
          txNumber: (deposits.filter((d) => d.userId === currentUser?.id).length || 0) + 1,
          isCombo: true,
          comboStep: incompleteCombo.comboStepNumber,
        },
      };
    }

    // Sequential transaction rotation: Tx #1 -> Pool[0], Tx #2 -> Pool[1], Tx #3 -> Pool[2], etc.
    const userDepositsCount = currentUser
      ? deposits.filter((d) => d.userId === currentUser.id).length
      : 0;
    const sequentialIndex = (userDepositsCount + manualCycleOffset) % pool.length;
    const selectedAddress = pool[sequentialIndex] || systemConfig.trc20DepositAddress;

    return {
      activeDepositAddress: selectedAddress,
      activeStageNumber: null,
      realRotationInfo: {
        poolIndex: sequentialIndex + 1,
        totalPool: pool.length,
        txNumber: userDepositsCount + 1,
        isCombo: false,
        comboStep: undefined,
      },
    };
  }, [currentUser, orders, systemConfig, deposits, manualCycleOffset]);

  const quickAmounts = [20, 50, 100, 300, 500, 1000];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount);
    if (isNaN(num) || num < systemConfig.minDeposit) {
      setError(`Deposit amount must be greater than or equal to ${systemConfig.minDeposit} USDT.`);
      return;
    }
    setStep(2);
  };

  const handleConfirmVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount);
    const res = submitDeposit(num, txid, activeDepositAddress);
    if (res.success) {
      setIsSubmitted(true);
    } else {
      setError(res.message || 'Submission failed');
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Top App Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-200">
        <button
          onClick={() => {
            if (step === 2 && !isSubmitted) {
              setStep(1);
            } else {
              onBack();
            }
          }}
          className="p-1 -ml-1 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-800 text-base pr-4">Deposit</h1>
      </div>

      {step === 1 ? (
        /* STEP 1: Amount & Protocol Selection (Matching Screenshot_2026-06-07-12-44-27-67) */
        <form onSubmit={handleNextStep} className="p-4 flex-1 flex flex-col space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-800 tracking-wide">Payment method</h2>
            <div className="flex">
              <div className="relative border-2 border-red-600 rounded-lg p-2.5 bg-white flex flex-col items-center justify-center min-w-[76px] shadow-xs">
                {/* USDT Coin Logo */}
                <div className="w-8 h-8 rounded-full bg-[#26A17B]/10 flex items-center justify-center text-[#26A17B] font-bold text-xs mb-1">
                  ₮
                </div>
                <span className="text-xs font-bold text-slate-800">USDT</span>
                {/* Red Triangle Corner */}
                <div className="absolute bottom-0 right-0 w-0 h-0 border-b-14 border-b-red-600 border-l-14 border-l-transparent flex items-end justify-end">
                  <Check className="w-2.5 h-2.5 text-white absolute bottom-0 right-0 -mb-0.5 -mr-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Protocol Selection */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-800 tracking-wide">
              Select the protocol to use
            </h2>
            <div className="flex">
              <div className="relative border-2 border-red-600 rounded-lg px-4 py-2 bg-white flex items-center justify-center shadow-xs">
                <span className="text-xs font-bold text-slate-800">TRC-20</span>
                <div className="absolute bottom-0 right-0 w-0 h-0 border-b-14 border-b-red-600 border-l-14 border-l-transparent">
                  <Check className="w-2.5 h-2.5 text-white absolute bottom-0 right-0 -mb-0.5 -mr-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-800 tracking-wide">Currency selection</h2>
            <div className="flex items-center gap-3">
              <div className="relative border border-red-600 rounded-lg px-4 py-1.5 bg-white shadow-xs">
                <span className="text-xs font-semibold text-red-700">ALL</span>
                <div className="absolute bottom-0 right-0 w-0 h-0 border-b-10 border-b-red-600 border-l-10 border-l-transparent" />
              </div>
            </div>
          </div>

          {/* Combo Shortfall Notice (Informational only, keeps amount field blank & fully editable) */}
          {comboShortageNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-900 block">
                  Combo Order #{comboShortageNotice.stepNumber || ''} Shortfall Notice
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Required deficit to complete combo order: <strong className="font-bold text-red-600">{comboShortageNotice.shortfall.toFixed(2)} USDT</strong>.
                  Please manually enter your desired deposit amount below.
                </p>
              </div>
            </div>
          )}

          {/* Deposit Amount */}
          <div className="space-y-2">
            <h2 className="text-xs font-black text-black uppercase tracking-wide">Deposit amount</h2>
            <div className="flex items-center bg-white border-2 border-slate-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-red-600 focus-within:border-transparent transition-all">
              <span className="text-sm font-black text-black mr-2">USDT</span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Deposit amount must be greater than 0.1USDT"
                className="w-full text-sm font-bold text-black placeholder:text-black/70 bg-white focus:outline-hidden"
                autoFocus
              />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(q.toString())}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    amount === q.toString()
                      ? 'bg-red-50 border-red-600 text-red-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated payment calculation */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-600">
            <div className="flex justify-between items-center text-slate-800 font-medium">
              <span>Estimated payment:</span>
              <span className="font-bold text-sm text-red-700">{amount || '0'} USDT</span>
            </div>
            <p className="text-[11px] text-slate-500">Reference rate: 1 USDT ≈ 1 USDT</p>
            <p className="text-[11px] text-slate-400">
              The payment amount and exchange rate are subject to the actual payment.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-[#694248] hover:bg-[#7b4f56] active:scale-[0.99] text-white text-sm font-bold rounded-lg transition-all shadow-md"
            >
              Deposit now
            </button>
          </div>
        </form>
      ) : (
        /* STEP 2: One-Time TRC-20 Address & Proof Submission (Matching Screenshot_2026-06-07-12-48-41-52) */
        <div className="p-4 flex-1 flex flex-col items-center space-y-4">
          {isSubmitted ? (
            <div className="w-full bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-4 shadow-sm my-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Payment Voucher Submitted!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deposit of <strong className="text-slate-900">{amount} USDT</strong> has been sent to
                the administrator for verification.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2 text-left">
                <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Admin will verify TXID within 1-2 minutes. Switch to Admin Panel anytime to
                  approve with 1 click!
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onNavigateToRecords}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  View Deposit Records
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-center">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{amount}</span>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  Network - TRON(TRC-20)
                </p>
              </div>

              {/* Pinkish accent strip */}
              <div className="h-2 w-full bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-3/4 animate-pulse rounded-full" />
              </div>

              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-orange-600">One Time Address:</span>
                {currentUser?.isDemoAccount && activeStageNumber && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold border border-cyan-300">
                    Combo Stage {activeStageNumber}/4 (Unique TRC-20)
                  </span>
                )}
                {!currentUser?.isDemoAccount && realRotationInfo && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    {realRotationInfo.isCombo
                      ? `Combo Order #${realRotationInfo.comboStep} Payment • Address ${realRotationInfo.poolIndex}/${realRotationInfo.totalPool}`
                      : `Tx #${realRotationInfo.txNumber} • Address ${realRotationInfo.poolIndex} of ${realRotationInfo.totalPool} (Auto-Rotated)`}
                  </span>
                )}
              </div>

              {/* Dynamic QR Code matching active selected TRC-20 address */}
              <div className="flex justify-center py-1">
                <QRCodeSVG
                  value={activeDepositAddress}
                  size={160}
                  className="shadow-sm border border-slate-200"
                />
              </div>

              {/* Red-border TRC-20 Address Box matching screenshot */}
              <div className="border border-red-600 rounded-md p-2 bg-red-50/30 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-800 font-semibold break-all text-left">
                  {activeDepositAddress}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeDepositAddress)}
                  className="shrink-0 p-1 text-red-600 hover:text-red-800 flex items-center justify-center cursor-pointer"
                  title="Copy Address"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Optional sequential cycle switch for real user accounts if pool has multiple addresses */}
              {!currentUser?.isDemoAccount && (systemConfig.trc20AddressPool?.length || 1) > 1 && !realRotationInfo?.isCombo && (
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setManualCycleOffset((c) => c + 1)}
                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Cycle to next pool address (Pool of {realRotationInfo?.totalPool || 1})</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-red-600 animate-spin" />
                <span>Waiting for payment...</span>
              </div>

              {/* Tips */}
              <div className="text-left text-xs space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                <div className="font-bold text-slate-800 text-[11px] mb-1">Tips:</div>
                <p className="text-[11px]">
                  1. The recharge address is a <strong className="text-red-600">one-time address</strong>,
                  please do not leave it or transfer it repeatedly.
                </p>
                <p className="text-[11px]">
                  2. The minimum recharge amount is subject to the actual transfer amount, not less
                  than <strong className="text-red-600">{systemConfig.minDeposit} USDT</strong>.
                </p>
                <p className="text-[11px]">
                  3. After recharging, it will take about <strong className="text-red-600">1 to 2 minutes</strong> to
                  confirm the payment. Please wait patiently.
                </p>
              </div>

              {/* Submit TXID Proof */}
              <form onSubmit={handleConfirmVoucher} className="space-y-3 pt-2 text-left">
                <div>
                  <label className="text-[11px] font-black text-black block mb-1">
                    Transaction Hash (TXID) / Hash Proof:
                  </label>
                  <input
                    type="text"
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                    placeholder="Paste TRC-20 txid or leave blank for auto-hash"
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-black placeholder:text-black/70 bg-white border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  I Have Transferred - Submit Proof
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
