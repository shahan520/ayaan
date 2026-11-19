import { CheckCheck, ChevronRight, HelpCircle, Loader2, MessageSquare, Paperclip, Send, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ChatMessage } from '../../../types';
import {
  connectChatWebSocket,
  fetchChatMessages,
  markChatRead,
  resolveChatMediaUrl,
  sendChatMessage,
  uploadChatImage,
} from '../../../utils/chatClient';

const formatMessageTime = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ServiceTab: React.FC = () => {
  const { currentUser, systemConfig } = useApp();
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'help' | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    imageUrl: string;
    fileName: string;
  } | null>(null);
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const activeDrawerRef = useRef(activeDrawer);
  activeDrawerRef.current = activeDrawer;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  const loadHistory = useCallback(async () => {
    if (!currentUser?.uid) return;
    setIsLoadingChat(true);
    try {
      const history = await fetchChatMessages(currentUser.uid);
      setChatError(null);
      setMessages(history);
      if (activeDrawerRef.current === 'chat') {
        const hasUnread = history.some((m) => m.sender === 'admin' && !m.readByUser);
        if (hasUnread) {
          await markChatRead(currentUser.uid, 'user');
          setMessages((prev) =>
            prev.map((m) => (m.sender === 'admin' ? { ...m, readByUser: true } : m))
          );
        }
        scrollToBottom();
      }
    } catch (err) {
      if (activeDrawerRef.current === 'chat') {
        setChatError(
          err instanceof Error
            ? err.message
            : 'Unable to load chat history right now. Please try again.'
        );
      }
    } finally {
      setIsLoadingChat(false);
    }
  }, [currentUser?.uid, scrollToBottom]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    loadHistory();

    const disconnect = connectChatWebSocket({
      role: 'user',
      userUid: currentUser.uid,
      onMessage: (msg) => {
        if (String(msg.userUid) !== String(currentUser.uid)) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (activeDrawerRef.current === 'chat') {
          if (msg.sender === 'admin') {
            markChatRead(currentUser.uid, 'user');
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, readByUser: true } : m))
            );
          }
          scrollToBottom();
        }
      },
      onRead: (uid, reader) => {
        if (String(uid) !== String(currentUser.uid)) return;
        if (reader === 'admin') {
          setMessages((prev) =>
            prev.map((m) => (m.sender === 'user' ? { ...m, readByAdmin: true } : m))
          );
        }
      },
      onReconnect: () => {
        loadHistory();
      },
    });

    return () => disconnect();
  }, [currentUser?.uid, loadHistory, scrollToBottom]);

  useEffect(() => {
    if (activeDrawer === 'chat' && currentUser?.uid) {
      loadHistory();
    }
  }, [activeDrawer, currentUser?.uid, loadHistory]);

  const unreadAdminCount = useMemo(
    () => messages.filter((m) => m.sender === 'admin' && !m.readByUser).length,
    [messages]
  );

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !currentUser) return;

    setChatError(null);
    setIsUploadingImage(true);
    try {
      const uploaded = await uploadChatImage(file);
      setPendingAttachment(uploaded);
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'Unable to upload image. Please try again.'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if ((!text && !pendingAttachment) || !currentUser || isSending || isUploadingImage) return;

    setChatError(null);
    setIsSending(true);
    const clientMsgId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const saved = await sendChatMessage({
        id: clientMsgId,
        userUid: currentUser.uid,
        username: currentUser.username,
        sender: 'user',
        text,
        imageUrl: pendingAttachment?.imageUrl,
        imageName: pendingAttachment?.fileName,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) return prev;
        return [...prev, saved];
      });
      setInputText('');
      setPendingAttachment(null);
      scrollToBottom();
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
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
    <div className="min-h-full w-full bg-[#fdf2f2] flex flex-col pb-20">
      {/* Top Header */}
      <div className="pt-8 pb-4 px-6 md:px-10 text-center w-full">
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

      {/* Navigation Options Grid */}
      <div className="px-4 md:px-8 py-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
        <button
          onClick={() => setActiveDrawer('chat')}
          className="w-full bg-white p-4 md:p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-700 flex items-center justify-center relative">
              <MessageSquare className="w-5 h-5" />
              {unreadAdminCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadAdminCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <span className="font-semibold text-slate-800 text-sm block">Online customer service</span>
              {unreadAdminCount > 0 && (
                <span className="text-[11px] font-medium text-red-600">
                  {unreadAdminCount} new {unreadAdminCount === 1 ? 'reply' : 'replies'} from support
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>

        <button
          onClick={() => setActiveDrawer('help')}
          className="w-full bg-white p-4 md:p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6">
          <div className="w-full max-w-lg h-[560px] max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
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
                className="text-white/80 hover:text-white text-xs px-2 py-1 rounded bg-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              {/* Persistent Greeting Card */}
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] p-2.5 rounded-xl bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs">
                  Hello {currentUser?.username || 'Trader'}! Welcome to WorldexaGlobal Official Customer
                  Service. Send a message below and an administrator will respond directly here.
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">Official Support</span>
              </div>

              {isLoadingChat && messages.length === 0 && (
                <div className="text-center text-slate-400 py-4 text-[11px]">
                  Loading conversation history...
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {m.sender === 'admin' && (
                    <span className="text-[10px] font-semibold text-slate-500 mb-0.5 px-1">
                      {m.adminName || 'Customer Support'}
                    </span>
                  )}
                  <div
                    className={`max-w-[82%] p-2.5 rounded-xl whitespace-pre-wrap break-words ${
                      m.sender === 'user'
                        ? 'bg-[#8b0000] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {m.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewLightboxUrl(resolveChatMediaUrl(m.imageUrl))}
                        className="block rounded-lg overflow-hidden border border-black/15 hover:opacity-95 transition-opacity cursor-pointer"
                        title="Click to view full image"
                      >
                        <img
                          src={resolveChatMediaUrl(m.imageUrl)}
                          alt={m.imageName || 'Uploaded screenshot'}
                          className="max-w-full max-h-56 object-contain bg-black/5"
                        />
                      </button>
                    )}
                    {m.text && <div className={m.imageUrl ? 'mt-1.5' : ''}>{m.text}</div>}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 px-1">
                    <span>{formatMessageTime(m.timestamp)}</span>
                    {m.sender === 'user' && (
                      <CheckCheck
                        className={`w-3 h-3 ${
                          m.readByAdmin ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {chatError && (
              <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-red-700 text-[11px] font-medium flex items-center justify-between gap-2">
                <span>{chatError}</span>
                <button
                  type="button"
                  onClick={() => setChatError(null)}
                  className="text-red-500 hover:text-red-800 font-bold px-1 cursor-pointer"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Pending Attachment Preview Chip */}
            {(pendingAttachment || isUploadingImage) && (
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                {isUploadingImage ? (
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8b0000]" />
                    <span>Uploading image...</span>
                  </div>
                ) : (
                  pendingAttachment && (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={resolveChatMediaUrl(pendingAttachment.imageUrl)}
                          alt={pendingAttachment.fileName}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800 truncate">
                            {pendingAttachment.fileName}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            Image attached · Ready to send
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingAttachment(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Remove attachment"
                        aria-label="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )
                )}
              </div>
            )}

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                onChange={handleFileSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!currentUser || isSending || isUploadingImage}
                title="Attach photo or screenshot (JPEG, PNG)"
                aria-label="Attach photo or screenshot"
                className="p-2 text-slate-500 hover:text-[#8b0000] hover:bg-red-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about deposits, VIP tasks, or withdrawals..."
                disabled={!currentUser || isSending}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-700 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={
                  !currentUser ||
                  (!inputText.trim() && !pendingAttachment) ||
                  isSending ||
                  isUploadingImage
                }
                className="p-2 bg-[#8b0000] text-white rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {previewLightboxUrl && (
        <div
          onClick={() => setPreviewLightboxUrl(null)}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] flex flex-col items-center gap-3"
          >
            <button
              type="button"
              onClick={() => setPreviewLightboxUrl(null)}
              className="self-end p-2 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewLightboxUrl}
              alt="Full view"
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain bg-black"
            />
          </div>
        </div>
      )}

      {/* HELP DRAWER */}
      {activeDrawer === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6">
          <div className="w-full max-w-lg max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
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
