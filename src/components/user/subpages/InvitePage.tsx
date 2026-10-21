import { ArrowLeft, Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { QRCodeSVG } from '../../common/QRCodeSVG';

interface Props {
  onBack: () => void;
}

export const InvitePage: React.FC<Props> = ({ onBack }) => {
  const { currentUser } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const code = currentUser?.inviteCode || currentUser?.uid || '925886';
  const shareUrl = `https://qudaizi.com/#/register?code=${code}`;

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* Top App Bar matching Screenshot_2026-06-07-12-45-58-69 */}
      <div className="bg-white sticky top-0 z-20 flex items-center px-4 py-3 border-b border-slate-100">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-slate-800 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-900 text-base pr-4">
          Invite friends
        </h1>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6">
        {/* Invitation Code Section */}
        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-medium">My invitation code</p>
          <div
            onClick={() => copyToClipboard(code, 'code')}
            className="cursor-pointer group inline-flex items-center gap-2 hover:opacity-90"
            title="Click to copy code"
          >
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-wider">{code}</h2>
            <span className="text-xs text-red-600 font-medium group-hover:underline">
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600 inline" /> : 'Copy'}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="py-2">
          <QRCodeSVG value={shareUrl} size={180} className="border border-slate-100 shadow-sm" />
          <p className="text-[11px] text-orange-500 mt-2 font-medium">
            Long press to save the QR code
          </p>
        </div>

        {/* Share Link Card matching screenshot */}
        <div className="w-full max-w-sm bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">Share link</span>
            <button
              onClick={() => copyToClipboard(shareUrl, 'link')}
              className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <p className="font-mono text-xs text-slate-700 break-all select-all">{shareUrl}</p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          Friends must register with your unique code to become your downline. You will earn continuous
          commissions on their matched orders!
        </div>
      </div>
    </div>
  );
};
