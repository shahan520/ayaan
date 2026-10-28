import { ArrowLeft, ChevronRight, HelpCircle, MessageSquare, Send, User } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export const ServiceTab: React.FC = () => {
  const { currentUser, systemConfig } = useApp();
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'help' | null>(null);

  // Live chat messages state
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: `Hello ${currentUser?.username || 'Trader'}! Welcome to QuDaizi Official Customer Service. How may I assist you with your TRC-20 deposit, withdrawal, or VIP tasks today?`,
      time: '12:00',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: nowTime }]);
    setInputText('');

    // Simulated authentic support replies
    setTimeout(() => {
      let reply = "Thank you for reaching out. Your request has been queued. Our financial operations team will review your account immediately.";
      const lower = userMsg.toLowerCase();
      if (lower.includes('deposit') || lower.includes('recharge')) {
        reply = `For deposits: please send USDT via TRON TRC-20 only to our official address: ${systemConfig.trc20DepositAddress}. Once sent, submit your TXID for instant credit!`;
      } else if (lower.includes('wallet') || lower.includes('address') || lower.includes('reset')) {
        reply = "For security and anti-tamper protection, receiving TRC-20 wallet addresses are locked after initial setup. Our Administrators can manually reset or update your bound address in the Admin Panel if an error was made.";
      } else if (lower.includes('withdraw') || lower.includes('password')) {
        reply = "For withdrawals: ensure your electronic wallet is bound and you have set your withdrawal password. Processing time is usually 10-30 minutes.";
      } else if (lower.includes('code') || lower.includes('invite')) {
        reply = "Each member can invite friends through their 6-digit invitation code found in the 'Mine' or 'Invitation' section. You earn up to 3 tiers of order commissions!";
      } else if (lower.includes('vip') || lower.includes('order')) {
        reply = "VIP 1 (Amazon) requires 20-498 USDT (4% commission). VIP 2 (Alibaba) requires 499-899 USDT (8%). VIP 3 (Aliexpress) requires >=899 USDT (12%).";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
  };

  const faqItems = [
    {
      q: 'Can I change my bound TRC-20 withdrawal address?',
      a: 'To safeguard user funds from unauthorized redirection, receiving TRC-20 addresses are locked after initial setup. If you made a typo or require an address change, contact Customer Service so an Administrator can unlock and reset your address.',
    },
    {
      q: 'How do I complete a TRC-20 USDT deposit?',
      a: 'Go to the "Mine" tab and click "Deposit". Choose TRC-20, enter the amount, and copy our one-time TRC-20 address or scan the QR code. Once transferred from your crypto exchange (Binance, OKX, TrustWallet), enter your TXID and submit proof.',
    },
    {
      q: 'Why am I required to set a withdrawal password?',
      a: 'Withdrawal password is an isolated security layer safeguarding your funds against unauthorized transactions. You will be prompted to set this password upon your first withdrawal.',
    },
    {
      q: 'How does VIP Order Grabbing work?',
      a: 'Navigate to "Menu". Select the VIP tier matching your current USDT account balance (VIP 1 Amazon, VIP 2 Alibaba, or VIP 3 Aliexpress). Click "Grab the order immediately". Then go to "Record" and click "Submit order" to earn your commission.',
    },
    {
      q: 'What is the minimum withdrawal amount?',
      a: `The minimum withdrawal threshold is ${systemConfig.minWithdrawal} USDT. Requests are audited and processed to your bound TRC-20 wallet address.`,
    },
  ];

  return (
    <div className="min-h-full bg-[#fdf2f2] flex flex-col pb-20">
      {/* Top Header matching Screenshot_2026-06-07-12-50-50-80 */}
      <div className="pt-8 pb-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Service Center</h1>
        <p className="text-xs text-slate-500 mt-1">Online customer service time 07:00-23:00 (UK)</p>
      </div>

      {/* Cute Support Agent Illustration */}
      <div className="px-6 py-2 flex justify-center">
        <div className="w-64 h-56 relative flex items-center justify-center">
          <img
            src="/assets/aistudio/a4.e7293f5f_d901c643.png"
            alt="Customer Service Agent"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Navigation Options List matching Screenshot */}
      <div className="px-4 py-4 space-y-3 flex-1">
        <button
          onClick={() => setActiveDrawer('chat')}
          className="w-full bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Online customer service</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>

        <button
          onClick={() => setActiveDrawer('help')}
          className="w-full bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Help & FAQ</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>
      </div>

      {/* LIVE CHAT DRAWER */}
      {activeDrawer === 'chat' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="w-full max-w-sm h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Chat Header */}
            <div className="bg-[#8b0000] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white p-1 overflow-hidden">
                  <img
                    src="/assets/aistudio/a4.e7293f5f_d901c643.png"
                    alt="Agent"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Live Support Desk</h3>
                  <span className="text-[10px] text-emerald-300 font-medium">● Online Agent</span>
                </div>
              </div>
              <button
                onClick={() => setActiveDrawer(null)}
                className="text-white/80 hover:text-white text-xs px-2 py-1 rounded bg-white/10"
              >
                Close
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[82%] p-2.5 rounded-xl ${
                      m.sender === 'user'
                        ? 'bg-[#8b0000] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about deposits, VIP tasks, or withdrawals..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-700"
              />
              <button
                type="submit"
                className="p-2 bg-[#8b0000] text-white rounded-lg hover:bg-red-900 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HELP DRAWER */}
      {activeDrawer === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="w-full max-w-sm max-h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Frequently Asked Questions</h3>
              <button
                onClick={() => setActiveDrawer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {faqItems.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900">{item.q}</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
