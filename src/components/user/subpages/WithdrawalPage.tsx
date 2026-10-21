import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  Plus,
  ShieldAlert,
  Wallet,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { SetWithdrawalPasswordModal } from './SetWithdrawalPasswordModal';

interface Props {
  onBack: () => void;
  onNavigateToWallet: () => void;
  onNavigateToRecords: () => void;
  onNavigateToMenu: () => void;
}

export const WithdrawalPage: React.FC<Props> = ({
  onBack,
  onNavigateToWallet,
  onNavigateToRecords,
  onNavigateToMenu,
}) => {
  const { currentUser, systemConfig, submitWithdrawal, addCompletedTasks } = useApp();

  const completedTasks = currentUser?.completedTasksCount ?? 0;
  const isTaskEligible = completedTasks >= 25;
  const hasWallet = !!currentUser?.wallet;
  const hasWithdrawalPassword = !!currentUser?.withdrawalPassword;

  // Step 1: Task check popup (shown if tasks < 25)
  const [showTaskModal, setShowTaskModal] = useState<boolean>(!isTaskEligible);

  // Step 2: Wallet check modal (shown if tasks >= 25 but no wallet)
  const [showWalletModal, setShowWalletModal] = useState<boolean>(isTaskEligible && !hasWallet);

  // Step 3: Password check modal
  const [showPasswordRequiredModal, setShowPasswordRequiredModal] = useState<boolean>(
    isTaskEligible && hasWallet && !hasWithdrawalPassword
  );
  const [showSetPasswordModal, setShowSetPasswordModal] = useState<boolean>(false);

  // Step 4: Form state
  const [amount, setAmount] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Step 1 check
    if ((currentUser?.completedTasksCount ?? 0) < 25) {
      setShowTaskModal(true);
      return;
    }

    // Step 2 check
    if (!currentUser?.wallet) {
      setShowWalletModal(true);
      return;
    }

    // Step 3 check
    if (!currentUser.withdrawalPassword) {
      setShowPasswordRequiredModal(true);
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num < systemConfig.minWithdrawal) {
      setError(`Minimum withdrawal amount is ${systemConfig.minWithdrawal} USDT.`);
      return;
    }

    if (num > currentUser.balance) {
      setError(
        `Insufficient balance. Current available balance is ${currentUser.balance.toFixed(2)} USDT.`
      );
      return;
    }

    if (!password) {
      setError('Please enter your withdrawal password.');
      return;
    }

    const res = submitWithdrawal(num, password);
    if (res.success) {
      setSuccess(true);
    } else {
      if (res.message === 'TASK_COUNT_BELOW_25') {
        setShowTaskModal(true);
      } else if (res.message === 'NO_WALLET_SET') {
        setShowWalletModal(true);
      } else if (res.message === 'NO_WITHDRAWAL_PASSWORD_SET') {
        setShowPasswordRequiredModal(true);
      } else {
        setError(res.message || 'Withdrawal failed.');
      }
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans">
      {/* Top App Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-black hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="flex-1 text-center font-bold text-black text-base pr-4">Withdrawal</h1>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Security Progress Status Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-black flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-red-700" />
              Withdrawal Security Checks
            </span>
            <span className="text-[11px] font-bold text-black">
              {completedTasks >= 25 && hasWallet && hasWithdrawalPassword
                ? 'Ready (4/4 Passed)'
                : `${[completedTasks >= 25, hasWallet, hasWithdrawalPassword].filter(Boolean).length}/3 Cleared`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            {/* Step 1 indicator */}
            <button
              type="button"
              onClick={() => {
                if (completedTasks < 25) setShowTaskModal(true);
              }}
              className={`p-1.5 rounded-lg border text-left flex flex-col ${
                completedTasks >= 25
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-700 font-bold">Step 1: Tasks</span>
              <span className="truncate">
                {completedTasks >= 25 ? '✓ 25+ Completed' : `${completedTasks}/25 Tasks`}
              </span>
            </button>

            {/* Step 2 indicator */}
            <button
              type="button"
              onClick={() => {
                if (!hasWallet) onNavigateToWallet();
              }}
              className={`p-1.5 rounded-lg border text-left flex flex-col ${
                hasWallet
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-red-50 border-red-300 text-red-950 font-bold'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-700 font-bold">Step 2: Wallet</span>
              <span className="truncate">{hasWallet ? '✓ TRC-20 Bound' : 'Not Bound'}</span>
            </button>

            {/* Step 3 indicator */}
            <button
              type="button"
              onClick={() => {
                if (!hasWithdrawalPassword) setShowSetPasswordModal(true);
              }}
              className={`p-1.5 rounded-lg border text-left flex flex-col ${
                hasWithdrawalPassword
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-red-50 border-red-300 text-red-950 font-bold'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-700 font-bold">Step 3: Password</span>
              <span className="truncate">{hasWithdrawalPassword ? '✓ Protected' : 'Not Set'}</span>
            </button>
          </div>
        </div>

        {/* Payment Method Selected Card */}
        <div className="space-y-1">
          <label className="text-xs font-black text-black uppercase tracking-wide block">
            Payment Method
          </label>
          <div className="inline-block relative border-2 border-red-700 rounded-lg p-2.5 bg-white text-center shadow-xs">
            <div className="w-8 h-8 rounded-full bg-[#26A17B]/10 flex items-center justify-center text-[#26A17B] font-bold text-xs mx-auto mb-1">
              ₮
            </div>
            <span className="text-xs font-black text-black block">virtual currency (USDT)</span>
            <div className="absolute bottom-0 right-0 w-0 h-0 border-b-14 border-b-red-700 border-l-14 border-l-transparent">
              <Check className="w-2.5 h-2.5 text-white absolute bottom-0 right-0 -mb-0.5 -mr-0.5" />
            </div>
          </div>
        </div>

        {/* Bound Wallet or "+ Add e-wallet" */}
        <div className="space-y-1">
          <label className="text-xs font-black text-black uppercase tracking-wide block">
            Receiving Wallet Address
          </label>
          {!currentUser?.wallet ? (
            <div className="py-4 px-4 bg-white rounded-xl border-2 border-dashed border-red-400 flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-xs font-black text-black">
                No electronic wallet bound yet
              </p>
              <button
                type="button"
                onClick={onNavigateToWallet}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-white font-bold text-xs bg-red-700 hover:bg-red-800 rounded-full transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Bind Electronic Wallet (TRC-20)</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-3.5 rounded-xl border-2 border-slate-300 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-red-700" />
                  <span className="font-bold text-xs text-black">
                    {currentUser.wallet.walletName}
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-900 font-black px-1.5 py-0.5 rounded-sm">
                    TRC-20
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToWallet}
                  className="text-xs text-red-700 hover:text-red-900 font-bold underline"
                >
                  Change
                </button>
              </div>
              <p className="font-mono text-xs text-black font-semibold break-all bg-slate-100 p-2 rounded-md border border-slate-200">
                {currentUser.wallet.walletAddress}
              </p>
            </div>
          )}
        </div>

        {/* Withdrawal Form or Success confirmation */}
        {success ? (
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 text-center space-y-3 shadow-md my-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-black text-black">Withdrawal Request Submitted</h2>
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-black space-y-1 text-left">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Requested Amount:</span>
                <span className="font-mono font-black text-red-700 text-sm">
                  {amount} USDT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Amount Deducted:</span>
                <span className="font-bold text-black">Immediately deducted</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Status in History:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md text-[11px]">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              </div>
            </div>
            <p className="text-xs text-black font-medium leading-relaxed">
              Your withdrawal request has been sent to the Admin console. The administrator will review and accept the payout shortly.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onNavigateToRecords}
                className="flex-1 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
              >
                View Withdrawal History
              </button>
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2.5 border-2 border-slate-300 text-black text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleWithdraw}
            className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-xs space-y-4"
          >
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-300 text-red-950 font-bold text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Amount input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-black text-black uppercase tracking-wide">
                  Withdrawal Amount
                </label>
                <span className="text-xs text-black font-semibold">
                  Available: <strong className="text-black font-black">{currentUser?.balance.toFixed(2)} USDT</strong>
                </span>
              </div>
              <div className="flex items-center bg-white border-2 border-slate-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-red-700 focus-within:border-red-700">
                <span className="text-sm font-black text-black mr-2">USDT</span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${systemConfig.minWithdrawal} USDT`}
                  className="w-full text-sm font-bold text-black placeholder:text-black/70 focus:outline-hidden bg-white"
                />
                <button
                  type="button"
                  onClick={() => setAmount(currentUser?.balance.toString() || '0')}
                  className="text-xs text-red-700 font-black hover:underline shrink-0 pl-2"
                >
                  ALL
                </button>
              </div>
            </div>

            {/* Withdrawal Password input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-black text-black uppercase tracking-wide">
                  Withdrawal Password
                </label>
                {!currentUser?.withdrawalPassword ? (
                  <button
                    type="button"
                    onClick={() => setShowSetPasswordModal(true)}
                    className="text-[11px] text-red-700 font-bold hover:underline"
                  >
                    Click to Set Password
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    Password Set
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4 text-black" />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit withdrawal password"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-bold text-black placeholder:text-black/70 bg-white border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700 focus:border-red-700"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="bg-slate-100 p-3 rounded-lg text-xs font-semibold text-black space-y-1 border border-slate-200">
              <p>• Minimum withdrawal: <strong className="text-black font-black">{systemConfig.minWithdrawal} USDT</strong></p>
              <p>• Immediate deduction on submit; status will be set to <strong className="text-black font-black">"Pending"</strong></p>
              <p>• If Admin accepts, status becomes <strong className="text-emerald-800 font-black">"Completed"</strong></p>
              <p>• If Admin rejects, status becomes <strong className="text-red-700 font-black">"Rejected"</strong> and funds are refunded</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#694248] hover:bg-[#7b4f56] active:scale-[0.99] text-white font-black text-sm rounded-lg transition-colors shadow-sm"
            >
              Withdraw now
            </button>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STEP 1 POPUP: Task Check (< 25 completed tasks)                          */}
      {/* Exact copy: "Please complete 25 tasks first before withdrawing."         */}
      {/* ========================================================================= */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4 border-2 border-amber-300">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center border-2 border-amber-300">
              <ShieldAlert className="w-8 h-8 text-amber-700" />
            </div>

            <div>
              <h3 className="font-black text-black text-lg">Task Requirement</h3>
              <p className="text-sm font-black text-red-700 mt-2 px-2 leading-snug">
                Please complete 25 tasks first before withdrawing.
              </p>
            </div>

            <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-black">
                <span>Task Completion Progress:</span>
                <span className="font-mono text-sm text-red-700">
                  {completedTasks} / 25
                </span>
              </div>
              <div className="w-full bg-slate-300 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-700 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (completedTasks / 25) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-700 font-semibold">
                You need {Math.max(0, 25 - completedTasks)} more completed order tasks to unlock withdrawal.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowTaskModal(false);
                  onNavigateToMenu();
                }}
                className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-black transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Go to Tasks (Menu)</span>
              </button>

              {/* Fast test / demo simulation helper */}
              <button
                type="button"
                onClick={() => {
                  addCompletedTasks(5);
                  if (completedTasks + 5 >= 25) {
                    setShowTaskModal(false);
                  }
                }}
                className="w-full py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-black transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                <span>+5 Tasks (Simulation Shortcut)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTaskModal(false);
                  onBack();
                }}
                className="w-full py-2 text-xs font-bold text-slate-600 hover:text-black"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2 POPUP: Wallet Check (No wallet bound)                              */}
      {/* Force redirect to "Bind Electronic Wallet (TRC-20)" page to save address */}
      {/* ========================================================================= */}
      {showWalletModal && !showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4 border-2 border-red-300">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center border-2 border-red-300">
              <Wallet className="w-8 h-8 text-red-700" />
            </div>

            <div>
              <h3 className="font-black text-black text-lg">Electronic Wallet Required</h3>
              <p className="text-xs font-bold text-black mt-2 leading-relaxed">
                You have not bound an electronic wallet yet. Please bind your TRC-20 wallet address to proceed with withdrawal.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(false);
                  onNavigateToWallet();
                }}
                className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-black transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Bind Electronic Wallet (TRC-20)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(false);
                  onBack();
                }}
                className="w-full py-2 text-xs font-bold text-slate-600 hover:text-black"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3 POPUP: Withdrawal Password Check (No password set)                 */}
      {/* "Withdrawal password - Sorry! You have not set a withdrawal password."    */}
      {/* ========================================================================= */}
      {showPasswordRequiredModal && !showTaskModal && !showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4 border-2 border-slate-300">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center border border-amber-300">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="font-black text-black text-base">Withdrawal password</h3>
            <p className="text-xs font-black text-black leading-relaxed">
              Sorry! You have not set a withdrawal password.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordRequiredModal(false)}
                className="flex-1 py-2.5 rounded-lg border-2 border-slate-300 text-black text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordRequiredModal(false);
                  setShowSetPasswordModal(true);
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#694248] hover:bg-[#7b4f56] text-white text-xs font-black transition-colors shadow-xs"
              >
                To set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Withdrawal Password Modal */}
      <SetWithdrawalPasswordModal
        isOpen={showSetPasswordModal}
        onClose={() => setShowSetPasswordModal(false)}
        onSuccess={() => {
          setShowSetPasswordModal(false);
        }}
      />
    </div>
  );
};
