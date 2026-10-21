import { ArrowLeft, Check, CheckCircle2, Copy, Wallet } from 'lucide-react';
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

            <button
              onClick={() => {
                setWalletName(currentUser.wallet!.walletName);
                setWalletAddress(currentUser.wallet!.walletAddress);
                setAccountName(currentUser.wallet!.accountName);
                setIsEditing(true);
              }}
              className="w-full mt-2 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Update Wallet Address
            </button>
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

        {/* Form view matching Screenshot_2026-06-07-12-44-45-99 */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
              Bind Electronic Wallet (TRC-20)
            </h2>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-black block mb-1">Wallet name</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Please enter the wallet name (e.g. Binance / OKX)"
                className="w-full px-3 py-2.5 text-sm font-semibold text-black bg-white placeholder:text-black/75 border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-black block mb-1">Virtual Currency Protocol</label>
              <input
                type="text"
                value="TRON (TRC-20)"
                disabled
                className="w-full px-3 py-2.5 text-sm font-bold text-black bg-slate-100 border-2 border-slate-300 rounded-lg cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-black block mb-1">Wallet address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Please enter the e-wallet address (starts with T...)"
                className="w-full px-3 py-2.5 text-sm font-mono font-semibold text-black bg-white placeholder:text-black/75 border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-black block mb-1">Account holder name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Names"
                className="w-full px-3 py-2.5 text-sm font-semibold text-black bg-white placeholder:text-black/75 border-2 border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold text-sm rounded-lg transition-colors shadow-xs"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full py-2 text-slate-600 border border-slate-200 hover:bg-slate-50 font-medium text-sm rounded-lg transition-colors"
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
