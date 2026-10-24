import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  Package,
  Plus,
  ShieldAlert,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  onBack: () => void;
  onNavigateToWallet: () => void;
  onNavigateToRecords: () => void;
  onNavigateToMenu: () => void;
  onNavigateToDeposit?: () => void;
  onNavigateToService?: () => void;
}

export const WithdrawalPage: React.FC<Props> = ({
  onBack,
  onNavigateToWallet,
  onNavigateToRecords,
  onNavigateToMenu,
  onNavigateToDeposit,
  onNavigateToService,
}) => {
  const {
    currentUser,
    systemConfig,
    submitWithdrawal,
    bindWallet,
    setWithdrawalPassword,
    addCompletedTasks,
  } = useApp();

  const currentCycleTasks = currentUser?.currentCycleTasks ?? 0;
  const isTaskEligible = currentCycleTasks >= 25;
  const hasWallet = !!currentUser?.wallet;
  const hasWithdrawalPassword = !!currentUser?.withdrawalPassword;

  // Account lock & tax condition checks
  const isAccountLocked = !!currentUser?.isLockedAccount;
  const isTaxPending = (currentUser?.balance ?? 0) > 50000 && !currentUser?.taxPaid;

  const [showLockedModal, setShowLockedModal] = useState<boolean>(isAccountLocked);
  const [showTaxModal, setShowTaxModal] = useState<boolean>(!isAccountLocked && isTaxPending);

  // Initial workflow step determination
  // Step 1: "Set up your e-wallet" (image_996e19be.png)
  // Step 2: "Add E-Wallet" form (image_05a80938.png)
  // Step 3: "Set Withdrawal Password" (image_caeaecef.png)
  // Step 4: Main withdrawal form
  const determineInitialStep = (): 1 | 2 | 3 | 4 => {
    if (!hasWallet) return 1;
    if (!hasWithdrawalPassword) return 3;
    return 4;
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(determineInitialStep);

  // Step 0: Incomplete cycle check modal (if current cycle tasks < 25)
  const [showTaskModal, setShowTaskModal] = useState<boolean>(!isTaskEligible && !isAccountLocked && !isTaxPending);

  // Step 2 (Add E-Wallet) Form States matching image_05a80938.png
  const [walletName, setWalletName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [protocol, setProtocol] = useState<'TRC-20' | 'ERC-20' | 'BEP-20'>('TRC-20');
  const [walletError, setWalletError] = useState('');

  // Step 3 (Set Withdrawal Password) States matching image_caeaecef.png
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Step 4 (Main Withdrawal Form) States
  const [amount, setAmount] = useState<string>('');
  const [withdrawalPasswordInput, setWithdrawalPasswordInput] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // STEP 2 SUBMIT: Bind E-Wallet
  // --------------------------------------------------------------------------
  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    setWalletError('');

    if (!walletName.trim()) {
      setWalletError('Please enter wallet name.');
      return;
    }
    if (!accountName.trim()) {
      setWalletError('Please enter your name.');
      return;
    }
    if (!walletAddress.trim()) {
      setWalletError('Please enter wallet address.');
      return;
    }
    if (protocol === 'TRC-20' && (!walletAddress.trim().startsWith('T') || walletAddress.trim().length < 30)) {
      setWalletError('Invalid TRC-20 wallet address. TRC-20 addresses must start with "T".');
      return;
    }

    const res = bindWallet({
      walletName: walletName.trim(),
      protocol,
      walletAddress: walletAddress.trim(),
      accountName: accountName.trim(),
    });

    if (res.success) {
      // Step 3 redirect check: If withdrawal password is not set, redirect to Step 3
      if (!currentUser?.withdrawalPassword) {
        setCurrentStep(3);
      } else {
        setCurrentStep(4);
      }
    } else {
      setWalletError(res.message || 'Failed to bind electronic wallet.');
    }
  };

  // --------------------------------------------------------------------------
  // STEP 3 SUBMIT: Set Withdrawal Password
  // --------------------------------------------------------------------------
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Please enter a password with minimum 6 digits.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    const res = setWithdrawalPassword(newPassword);
    if (res.success) {
      // Proceed to main withdrawal screen (Step 4)
      setCurrentStep(4);
    } else {
      setPasswordError(res.message || 'Failed to set withdrawal password.');
    }
  };

  // --------------------------------------------------------------------------
  // STEP 4 SUBMIT: Process Withdrawal
  // --------------------------------------------------------------------------
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');

    // Rule 1: Account Lock Check
    if (currentUser?.isLockedAccount) {
      setShowLockedModal(true);
      return;
    }

    // Rule 2: Mandatory 25% Tax Check (> 50,000 USDT Balance)
    if ((currentUser?.balance ?? 0) > 50000 && !currentUser?.taxPaid) {
      setShowTaxModal(true);
      return;
    }

    // Rule 3: Incomplete Cycle Withdrawal Restriction (< 25 tasks in active work cycle)
    if ((currentUser?.currentCycleTasks ?? 0) < 25) {
      setWithdrawError('Please complete all 25 orders in your current task cycle before initiating a withdrawal.');
      setShowTaskModal(true);
      return;
    }

    // Wallet binding verification
    if (!currentUser?.wallet) {
      setCurrentStep(1);
      return;
    }

    // Withdrawal password verification
    if (!currentUser.withdrawalPassword) {
      setCurrentStep(3);
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num < systemConfig.minWithdrawal) {
      setWithdrawError(`Minimum withdrawal amount is ${systemConfig.minWithdrawal} USDT.`);
      return;
    }

    if (num > currentUser.balance) {
      setWithdrawError(
        `Insufficient balance. Available balance: ${currentUser.balance.toFixed(2)} USDT.`
      );
      return;
    }

    if (!withdrawalPasswordInput) {
      setWithdrawError('Please enter your 6-digit withdrawal password.');
      return;
    }

    const res = submitWithdrawal(num, withdrawalPasswordInput);
    if (res.success) {
      setWithdrawSuccess(true);
    } else {
      if (res.message === 'ACCOUNT_LOCKED') {
        setShowLockedModal(true);
      } else if (res.message === 'TAX_REQUIRED') {
        setShowTaxModal(true);
      } else if (
        res.message === 'TASK_COUNT_BELOW_25' ||
        res.message === 'Please complete all 25 orders in your current task cycle before initiating a withdrawal.'
      ) {
        setWithdrawError('Please complete all 25 orders in your current task cycle before initiating a withdrawal.');
        setShowTaskModal(true);
      } else if (res.message === 'NO_WALLET_SET') {
        setCurrentStep(1);
      } else if (res.message === 'NO_WITHDRAWAL_PASSWORD_SET') {
        setCurrentStep(3);
      } else {
        setWithdrawError(res.message || 'Withdrawal failed.');
      }
    }
  };

  // ==========================================================================
  // RENDER STEP 1: Set up your e-wallet (matching image_996e19be.png)
  // ==========================================================================
  if (currentStep === 1) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col font-sans select-none">
        {/* Top Header */}
        <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-200">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-slate-900 hover:text-black transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-900 text-base pr-4">
            Withdrawal
          </h1>
        </div>

        {/* Center Prompt Container matching image_996e19be.png */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto space-y-5">
          {/* Circular Container with Warm Golden Orange Package Icon */}
          <div className="w-20 h-20 rounded-full bg-amber-50/90 border border-amber-200/80 flex items-center justify-center text-[#d97706] shadow-xs">
            <Package className="w-10 h-10 stroke-[1.8]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-[#000000] tracking-tight">
              Set up your e-wallet
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
              Please bind an electronic wallet address before you can request a withdrawal.
            </p>
          </div>

          <button
            onClick={() => setCurrentStep(2)}
            className="w-full py-3.5 bg-[#d97706] hover:bg-[#b45309] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            + Add e-wallet
          </button>
        </div>

        {/* Task Condition Check Modal if opened */}
        {showTaskModal && renderTaskModal()}
      </div>
    );
  }

  // ==========================================================================
  // RENDER STEP 2: Add E-Wallet Form (matching image_05a80938.png)
  // ==========================================================================
  if (currentStep === 2) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col font-sans select-none">
        {/* Top Header */}
        <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-200">
          <button
            onClick={() => setCurrentStep(1)}
            className="p-1 -ml-1 text-slate-900 hover:text-black transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-900 text-base pr-4">
            Add E-Wallet
          </h1>
        </div>

        <form onSubmit={handleSaveWallet} className="p-4 flex-1 flex flex-col space-y-4 max-w-md mx-auto w-full">
          {walletError && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-950 font-bold text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{walletError}</span>
            </div>
          )}

          {/* Form Fields Card matching image_05a80938.png */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 p-4 space-y-4">
            {/* Field 1: Wallet name */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-500 block">
                Wallet name
              </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter wallet name"
                className="w-full py-2.5 text-sm font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl px-3 focus:outline-hidden focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
              />
            </div>

            {/* Field 2: Names */}
            <div className="space-y-1.5 pt-3">
              <label className="text-xs font-semibold text-slate-500 block">
                Names
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter your name"
                className="w-full py-2.5 text-sm font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl px-3 focus:outline-hidden focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
              />
            </div>

            {/* Field 3: Wallet address */}
            <div className="space-y-1.5 pt-3">
              <label className="text-xs font-semibold text-slate-500 block">
                Wallet address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="w-full py-2.5 text-sm font-mono font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl px-3 focus:outline-hidden focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
              />
            </div>

            {/* Field 4: Virtual Currency Protocol Pills */}
            <div className="space-y-2 pt-3">
              <label className="text-xs font-semibold text-slate-500 block">
                Virtual Currency Protocol
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['TRC-20', 'ERC-20', 'BEP-20'] as const).map((proto) => (
                  <button
                    key={proto}
                    type="button"
                    onClick={() => setProtocol(proto)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      protocol === proto
                        ? 'border-[#d97706] bg-amber-50/70 text-[#d97706] shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {proto}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons matching image_05a80938.png */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#d97706] hover:bg-[#b45309] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-black transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        </form>

        {showTaskModal && renderTaskModal()}
      </div>
    );
  }

  // ==========================================================================
  // RENDER STEP 3: Set Withdrawal Password (matching image_caeaecef.png)
  // ==========================================================================
  if (currentStep === 3) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col font-sans select-none">
        {/* Top Header */}
        <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-200">
          <button
            onClick={() => setCurrentStep(hasWallet ? 4 : 2)}
            className="p-1 -ml-1 text-slate-900 hover:text-black transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-900 text-base pr-4">
            Set Withdrawal Password
          </h1>
        </div>

        <form onSubmit={handleSavePassword} className="p-4 flex-1 flex flex-col space-y-4 max-w-md mx-auto w-full">
          {/* Header Subtitle Text */}
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            For your account's security, please set a withdrawal password before making any withdrawal.
          </p>

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-950 font-bold text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Field 1: New withdrawal password */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">
              New withdrawal password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter a password (min 6 digits)"
                className="w-full pl-9 pr-10 py-2.5 text-sm font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Field 2: Confirm password */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">
              Confirm password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Re-enter password"
                className="w-full pl-9 pr-10 py-2.5 text-sm font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Button matching image_caeaecef.png */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#d97706] hover:bg-[#b45309] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </form>

        {showTaskModal && renderTaskModal()}
      </div>
    );
  }

  // ==========================================================================
  // RENDER STEP 4: Main Withdrawal Page (Strictly Preserving Red/Burgundy Theme)
  // ==========================================================================
  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans select-none pb-20">
      {/* Top App Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-slate-900 hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <h1 className="flex-1 text-center font-bold text-[#000000] text-base pr-4">
          Withdrawal
        </h1>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-4 max-w-md mx-auto w-full">
        {/* Payment Method Selected Card */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
            Payment Method
          </label>
          <div className="inline-block relative border-2 border-[#7a0a14] rounded-xl p-2.5 bg-white text-center shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#26A17B]/10 flex items-center justify-center text-[#26A17B] font-black text-xs mx-auto mb-1">
              ₮
            </div>
            <span className="text-xs font-black text-[#000000] block">Virtual Currency (USDT)</span>
            <div className="absolute bottom-0 right-0 w-0 h-0 border-b-14 border-b-[#7a0a14] border-l-14 border-l-transparent">
              <Check className="w-2.5 h-2.5 text-white absolute bottom-0 right-0 -mb-0.5 -mr-0.5" />
            </div>
          </div>
        </div>

        {/* Receiving Wallet Address Card */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
            Receiving Wallet Address
          </label>
          {currentUser?.wallet ? (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#7a0a14]" />
                  <span className="font-black text-xs text-[#000000]">
                    {currentUser.wallet.walletName}
                  </span>
                  <span className="text-[10px] bg-red-100 text-[#7a0a14] font-black px-1.5 py-0.2 rounded-xs">
                    {currentUser.wallet.protocol}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-[#7a0a14] hover:underline font-bold cursor-pointer"
                >
                  Change
                </button>
              </div>
              <p className="font-mono text-xs text-[#000000] font-semibold break-all bg-slate-50 p-2 rounded-xl border border-slate-200">
                {currentUser.wallet.walletAddress}
              </p>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Account: {currentUser.wallet.accountName}</span>
                <span>Bound: {currentUser.wallet.boundAt.substring(0, 10)}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full py-3 bg-red-50 border-2 border-dashed border-red-300 rounded-2xl text-xs font-bold text-[#7a0a14] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Bind Electronic Wallet</span>
            </button>
          )}
        </div>

        {/* Withdrawal Form or Success confirmation */}
        {withdrawSuccess ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-4 shadow-md my-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-black text-[#000000]">Withdrawal Request Submitted</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-[#000000] space-y-1 text-left">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Requested Amount:</span>
                <span className="font-mono font-black text-[#7a0a14] text-sm">{amount} USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Amount Deducted:</span>
                <span className="font-bold text-emerald-700">Immediately Deducted</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Status in History:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md text-[11px]">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Your withdrawal request has been sent to the Admin console. The administrator will review and accept the payout shortly.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onNavigateToRecords}
                className="flex-1 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors cursor-pointer"
              >
                View History
              </button>
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2.5 border border-slate-300 text-black text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleWithdraw}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
          >
            {withdrawError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-950 font-bold text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>{withdrawError}</span>
              </div>
            )}

            {/* Amount input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Withdrawal Amount
                </label>
                <span className="text-xs text-slate-600 font-semibold">
                  Available:{' '}
                  <strong className="text-[#000000] font-black">
                    {currentUser?.balance.toFixed(2)} USDT
                  </strong>
                </span>
              </div>
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#7a0a14] focus-within:border-[#7a0a14]">
                <span className="text-sm font-black text-[#000000] mr-2">USDT</span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${systemConfig.minWithdrawal} USDT`}
                  className="w-full text-sm font-bold text-[#000000] placeholder:text-slate-400 focus:outline-hidden bg-white"
                />
                <button
                  type="button"
                  onClick={() => setAmount(currentUser?.balance.toString() || '0')}
                  className="text-xs text-[#7a0a14] font-black hover:underline shrink-0 pl-2 cursor-pointer"
                >
                  ALL
                </button>
              </div>
            </div>

            {/* Withdrawal Password input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Withdrawal Password
                </label>
                {!currentUser?.withdrawalPassword ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-[11px] text-[#7a0a14] font-bold hover:underline cursor-pointer"
                  >
                    Click to Set Password
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded hover:underline cursor-pointer"
                  >
                    Change Password
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  value={withdrawalPasswordInput}
                  onChange={(e) => setWithdrawalPasswordInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit withdrawal password"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#7a0a14] focus:border-[#7a0a14]"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs font-semibold text-slate-600 space-y-1 border border-slate-200">
              <p>• Minimum withdrawal: <strong className="text-[#000000]">{systemConfig.minWithdrawal} USDT</strong></p>
              <p>• Immediate deduction on submit; status set to <strong className="text-[#000000]">"Pending"</strong></p>
              <p>• Verified payouts processed via TRC-20 payment gateway</p>
              <p>
                • Active Cycle Orders:{' '}
                <strong className={currentCycleTasks >= 25 ? 'text-emerald-700' : 'text-amber-800'}>
                  {currentCycleTasks >= 25
                    ? '25/25 Completed (Withdrawal Unlocked)'
                    : `${currentCycleTasks}/25 Completed (Withdrawal Restricted)`}
                </strong>
              </p>
            </div>

            {currentCycleTasks < 25 && (
              <div
                onClick={() => setShowTaskModal(true)}
                className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-semibold">
                    Cycle incomplete: <strong>{currentCycleTasks}/25</strong> orders completed
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#7a0a14] underline">Details</span>
              </div>
            )}

            {/* Red / Burgundy Theme Primary Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#7a0a14] hover:bg-[#5e070e] active:scale-[0.99] text-white font-black text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              Withdraw now
            </button>
          </form>
        )}
      </div>

      {showTaskModal && renderTaskModal()}
      {showLockedModal && renderLockedModal()}
      {showTaxModal && renderTaxModal()}
    </div>
  );

  // Helper renderer for Account Locked Modal
  function renderLockedModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in select-none">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center space-y-4 border border-rose-300">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-800 mx-auto flex items-center justify-center border border-rose-200">
            <Lock className="w-8 h-8 text-[#7a0a14]" />
          </div>

          <div>
            <h3 className="font-black text-[#000000] text-lg">Withdrawal Access Locked</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Risk Control & Security Verification
            </p>
          </div>

          <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 text-left space-y-2 text-xs">
            <p className="text-slate-800 font-medium leading-relaxed">
              Your account withdrawal access is temporarily locked by system risk control.
            </p>
            <div className="p-2 bg-white rounded-xl border border-rose-200/80 font-mono text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Account UID:</span>
                <span className="font-bold text-black">{currentUser?.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="font-bold text-black">{currentUser?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-rose-700">Withdrawal Restricted</span>
              </div>
            </div>
            <p className="text-[11px] text-rose-950 font-bold">
              Please contact Customer Service for Admin approval and identity clearance before requesting withdrawals.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowLockedModal(false);
                if (onNavigateToService) onNavigateToService();
                else onBack();
              }}
              className="w-full py-3 rounded-xl bg-[#7a0a14] hover:bg-[#5e070e] text-white text-xs font-black transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Headphones className="w-4 h-4 text-white" />
              <span>Contact Customer Service</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowLockedModal(false);
                onBack();
              }}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-black cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper renderer for 25% Tax Notice Modal (> 50,000 USDT Balance)
  function renderTaxModal() {
    const bal = currentUser?.balance ?? 0;
    const taxDue = Number((bal * 0.25).toFixed(2));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in select-none">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center space-y-4 border border-amber-300">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 mx-auto flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-8 h-8 text-[#7a0a14]" />
          </div>

          <div>
            <h3 className="font-black text-[#000000] text-lg">Mandatory Tax Notice</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider border border-amber-300">
              25% Statutory Tax Required
            </span>
          </div>

          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 text-left space-y-2.5 text-xs">
            <p className="text-slate-700 font-medium leading-relaxed">
              According to international digital asset tax compliance regulations, accounts with total balances exceeding <strong>50,000 USDT</strong> must settle a <strong>25% tax payment</strong> before any withdrawal can be processed.
            </p>

            <div className="p-2.5 bg-white rounded-xl border border-amber-200 font-mono text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Account Balance:</span>
                <span className="font-bold text-black">{bal.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between items-center text-rose-700">
                <span className="text-slate-700 font-sans font-bold">Required 25% Tax:</span>
                <span className="font-black text-sm">{taxDue.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-sans">Tax Clearance Status:</span>
                <span className="font-bold text-amber-700">Pending Settlement</span>
              </div>
            </div>

            <p className="text-[11px] text-amber-950 font-semibold leading-tight">
              Please recharge the tax amount via TRC-20 deposit or contact Customer Service to obtain Admin clearance approval.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {onNavigateToDeposit && (
              <button
                type="button"
                onClick={() => {
                  setShowTaxModal(false);
                  onNavigateToDeposit();
                }}
                className="w-full py-3 rounded-xl bg-[#7a0a14] hover:bg-[#5e070e] text-white text-xs font-black transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-white" />
                <span>Recharge Tax ({taxDue.toFixed(2)} USDT)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowTaxModal(false);
                if (onNavigateToService) onNavigateToService();
                else onBack();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5 text-slate-700" />
              <span>Contact Customer Service</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTaxModal(false);
                onBack();
              }}
              className="w-full py-1 text-xs font-bold text-slate-500 hover:text-black cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper renderer for Incomplete Task Cycle Modal (< 25 tasks in active cycle)
  function renderTaskModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in select-none">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center space-y-4 border border-amber-300">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center border border-amber-300">
            <ShieldAlert className="w-8 h-8 text-amber-700" />
          </div>

          <div>
            <h3 className="font-black text-[#000000] text-lg">Task Cycle Incomplete</h3>
            <p className="text-sm font-black text-[#7a0a14] mt-2 px-2 leading-snug">
              Please complete all 25 orders in your current task cycle before initiating a withdrawal.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-black text-[#000000]">
              <span>Current Cycle Progress:</span>
              <span className="font-mono text-sm text-[#7a0a14] font-black">
                {currentCycleTasks} / 25
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#7a0a14] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (currentCycleTasks / 25) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-600 font-semibold">
              You need {Math.max(0, 25 - currentCycleTasks)} more completed orders in this cycle to unlock withdrawal.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowTaskModal(false);
                onNavigateToMenu();
              }}
              className="w-full py-3 rounded-xl bg-[#7a0a14] hover:bg-[#5e070e] text-white text-xs font-black transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Go to Tasks (Menu)</span>
            </button>

            {/* Fast Simulation helper */}
            <button
              type="button"
              onClick={() => {
                addCompletedTasks(5);
                if (currentCycleTasks + 5 >= 25) {
                  setShowTaskModal(false);
                }
              }}
              className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-700" />
              <span>+5 Cycle Tasks (Simulation Shortcut)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTaskModal(false);
                onBack();
              }}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-black cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
};
