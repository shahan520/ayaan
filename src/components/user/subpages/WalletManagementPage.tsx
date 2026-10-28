import { ArrowLeft, Check, CheckCircle2, Copy, Lock, Wallet } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  onBack: () => void;
}

export const WalletManagementPage: React.FC<Props> = ({ onBack }) => {
  const { currentUser, bindWallet } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!walletName.trim()) {
      setError('Please enter a wallet name.');
      return;
    }
    if (!walletAddress.trim()) {
      setError('Please enter a TRC-20 wallet address.');
      return;
    }
    if (!walletAddress.trim().startsWith('T') || walletAddress.trim().length < 30) {
      setError('Invalid TRC-20 address format. Address must begin with "T".');
      return;
    }
    if (!accountName.trim()) {
      setError('Please enter account holder name.');
      return;
    }

    const res = bindWallet({
      walletName: walletName.trim(),
      protocol: 'TRC-20',
      walletAddress: walletAddress.trim(),
      accountName: accountName.trim(),
    });

    if (res.success) {
      setIsEditing(false);
      setWalletName('');
      setWalletAddress('');
      setAccountName('');
    } else {
      setError(res.message || 'Binding failed');
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Top App Bar */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-800 text-base pr-4">
          Wallet management
        </h1>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Category Pill */}
        <div>
          <span className="inline-block px-3 py-1 bg-[#5c3439] text-white text-xs font-medium rounded-md shadow-xs">
            virtual currency
          </span>
        </div>

        {/* Existing Bound Wallet Card */}
        {currentUser?.wallet && !isEditing ? (
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {currentUser.wallet.walletName}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Protocol: {currentUser.wallet.protocol}
                  </span>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bound
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Address</span>
                <button
                  onClick={() => handleCopy(currentUser.wallet!.walletAddress)}
                  className="text-red-700 hover:text-red-800 flex items-center gap-1 font-medium"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-800 break-all select-all">
                {currentUser.wallet.walletAddress}
              </p>
            </div>

            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Account: {currentUser.wallet.accountName}</span>
              <span>Bound: {currentUser.wallet.boundAt.substring(0, 10)}</span>
            </div>

            {/* ADMIN-ONLY TRC-20 ADDRESS RESET: Direct client change removed */}
            <div className="mt-3 p-3.5 bg-amber-50/90 rounded-xl border border-amber-200/90 text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>TRC-20 Address Locked</span>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  Admin-Only Reset
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                For asset protection and anti-tamper security, your receiving TRC-20 withdrawal address is locked after initial setup. If you made an error during setup, please contact Customer Service or an Administrator to request an address reset.
              </p>
            </div>
          </div>
        ) : null}

        {/* Add/Edit e-wallet form or button */}
        {!currentUser?.wallet && !isEditing ? (
          <div className="space-y-3">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 bg-[#694248] hover:bg-[#7b4f56] text-white text-sm font-medium rounded-lg transition-colors shadow-xs"
            >
              Add e-wallet
            </button>
            <p className="text-xs text-slate-400">Tips: Bind at most 1 group accounts.</p>
          </div>
        ) : null}

        {/* Form view matching image_05a80938.png */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs divide-y divide-slate-100 space-y-4">
            <h2 className="font-bold text-[#000000] text-sm pb-1">
              Add E-Wallet
            </h2>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1.5 pt-3">
              <label className="text-xs font-semibold text-slate-500 block">Wallet name</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter wallet name"
                className="w-full px-3 py-2.5 text-sm font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
              />
            </div>

            <div className="space-y-1.5 pt-3">
              <label className="text-xs font-semibold text-slate-500 block">Names</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2.5 text-sm font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
              />
            </div>

            <div className="space-y-1.5 pt-3">
              <label className="text-xs font-semibold text-slate-500 block">Wallet address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="w-full px-3 py-2.5 text-sm font-mono font-bold text-[#000000] placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706]"
              />
            </div>

            <div className="space-y-2 pt-3">
              <label className="text-xs font-semibold text-slate-500 block">
                Virtual Currency Protocol
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="py-2 text-xs font-bold rounded-xl border border-[#d97706] bg-amber-50/70 text-[#d97706] shadow-2xs"
                >
                  TRC-20
                </button>
                <button
                  type="button"
                  className="py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                >
                  ERC-20
                </button>
                <button
                  type="button"
                  className="py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                >
                  BEP-20
                </button>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#d97706] hover:bg-[#b45309] text-white font-black text-sm rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full py-2 text-slate-500 hover:text-black font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
