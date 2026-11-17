import {
  CheckCheck,
  Clock,
  Headphones,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  User as UserIcon,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage, ChatThreadSummary, User } from '../../types';
import {
  connectChatWebSocket,
  fetchChatMessages,
  fetchChatThreads,
  markChatRead,
  sendChatMessage,
} from '../../utils/chatClient';

interface Props {
  users: User[];
  adminName: string;
  onUnreadCountChange?: (totalUnread: number) => void;
}

const formatChatTime = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const now = new Date();
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const AdminSupportChat: React.FC<Props> = ({
  users,
  adminName,
  onUnreadCountChange,
}) => {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [replyText, setReplyText] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const selectedUidRef = useRef<string | null>(null);
  selectedUidRef.current = selectedUserUid;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const loadThreads = useCallback(async () => {
    try {
      const { threads: fetchedThreads, totalUnread } = await fetchChatThreads();
      setChatError(null);
      setThreads(fetchedThreads);
      onUnreadCountChange?.(totalUnread);

      // Auto-select the most recent conversation if none selected yet
      if (!selectedUidRef.current && fetchedThreads.length > 0) {
        setSelectedUserUid(fetchedThreads[0].userUid);
      }
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : 'Unable to load customer conversations right now.'
      );
    } finally {
      setIsLoadingThreads(false);
    }
  }, [onUnreadCountChange]);

  const loadConversation = useCallback(async (uid: string) => {
    setIsLoadingMessages(true);
    try {
      const history = await fetchChatMessages(uid);
      setChatError(null);
      setMessages(history);

      // Mark unread user messages in this thread as read by admin
      const hasUnreadFromUser = history.some((m) => m.sender === 'user' && !m.readByAdmin);
      if (hasUnreadFromUser) {
        await markChatRead(uid, 'admin');
        setThreads((prev) => {
          const next = prev.map((t) =>
            t.userUid === uid ? { ...t, unreadCount: 0 } : t
          );
          const totalUnread = next.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
          onUnreadCountChange?.(totalUnread);
          return next;
        });
      }
      scrollToBottom();
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : 'Unable to load conversation messages. Please try again.'
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }, [onUnreadCountChange]);

  // Initial thread load
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Load messages whenever selected user changes
  useEffect(() => {
    if (selectedUserUid) {
      loadConversation(selectedUserUid);
    } else {
      setMessages([]);
    }
  }, [selectedUserUid, loadConversation]);

  // Real-time WebSocket subscription for Admin Support Desk
  useEffect(() => {
    const disconnect = connectChatWebSocket({
      role: 'admin',
      onMessage: (incoming) => {
        const incomingUid = String(incoming.userUid);
        const isCurrentlyViewing = selectedUidRef.current === incomingUid;

        // 1. Update active conversation messages idempotently
        if (isCurrentlyViewing) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          scrollToBottom();

          if (incoming.sender === 'user') {
            markChatRead(incomingUid, 'admin');
          }
        }

        // 2. Update thread summary list & sort by most recent message
        setThreads((prev) => {
          const userObj = users.find((u) => String(u.uid) === incomingUid);
          const existing = prev.find((t) => t.userUid === incomingUid);
          const shouldIncrementUnread =
            incoming.sender === 'user' && !incoming.readByAdmin && !isCurrentlyViewing;

          const updatedThread: ChatThreadSummary = existing
            ? {
                ...existing,
                username: userObj?.username || incoming.username || existing.username,
                vipLevel: userObj?.vipLevel ?? existing.vipLevel,
                balance: typeof userObj?.balance === 'number' ? userObj.balance : existing.balance,
                lastMessage: incoming.text,
                lastSender: incoming.sender,
                lastTimestamp: incoming.timestamp,
                unreadCount: isCurrentlyViewing
                  ? 0
                  : existing.unreadCount + (shouldIncrementUnread ? 1 : 0),
                totalMessages: existing.totalMessages + 1,
              }
            : {
                userUid: incomingUid,
                username: userObj?.username || incoming.username || `User_${incomingUid}`,
                vipLevel: userObj?.vipLevel ?? 0,
                avatarUrl: userObj?.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png',
                balance: typeof userObj?.balance === 'number' ? userObj.balance : 0,
                lastMessage: incoming.text,
                lastSender: incoming.sender,
                lastTimestamp: incoming.timestamp,
                unreadCount: shouldIncrementUnread ? 1 : 0,
                totalMessages: 1,
              };

          const others = prev.filter((t) => t.userUid !== incomingUid);
          const next = [updatedThread, ...others].sort((a, b) =>
            String(b.lastTimestamp || '').localeCompare(String(a.lastTimestamp || ''))
          );
          const totalUnread = next.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
          onUnreadCountChange?.(totalUnread);
          return next;
        });
      },
      onRead: (uid, reader) => {
        if (reader === 'admin') {
          setThreads((prev) => {
            const next = prev.map((t) =>
              t.userUid === uid ? { ...t, unreadCount: 0 } : t
            );
            const totalUnread = next.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
            onUnreadCountChange?.(totalUnread);
            return next;
          });
        } else if (reader === 'user' && selectedUidRef.current === uid) {
          setMessages((prev) =>
            prev.map((m) => (m.sender === 'admin' ? { ...m, readByUser: true } : m))
          );
        }
      },
      onReconnect: () => {
        loadThreads();
        if (selectedUidRef.current) {
          loadConversation(selectedUidRef.current);
        }
      },
    });

    return disconnect;
  }, [users, loadThreads, loadConversation, onUnreadCountChange]);

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return threads.filter((t) => {
      if (filterMode === 'unread' && t.unreadCount <= 0) return false;
      if (!q) return true;
      return (
        t.username.toLowerCase().includes(q) ||
        t.userUid.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [threads, searchQuery, filterMode]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.userUid === selectedUserUid) || null,
    [threads, selectedUserUid]
  );

  const selectedUserObj = useMemo(
    () => users.find((u) => String(u.uid) === String(selectedUserUid)) || null,
    [users, selectedUserUid]
  );

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = replyText.trim();
    if (!cleanText || !selectedUserUid || isSending) return;

    const clientMsgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const targetUsername =
      selectedUserObj?.username || selectedThread?.username || `User_${selectedUserUid}`;

    const optimisticMsg: ChatMessage = {
      id: clientMsgId,
      userUid: selectedUserUid,
      username: targetUsername,
      sender: 'admin',
      adminName,
      text: cleanText,
      timestamp: new Date().toISOString(),
      readByAdmin: true,
      readByUser: false,
    };

    setChatError(null);
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyText('');
    scrollToBottom();
    setIsSending(true);

    try {
      const saved = await sendChatMessage({
        id: clientMsgId,
        userUid: selectedUserUid,
        username: targetUsername,
        sender: 'admin',
        adminName,
        text: cleanText,
      });

      setMessages((prev) => prev.map((m) => (m.id === clientMsgId ? saved : m)));
      setThreads((prev) => {
        const existing = prev.find((t) => t.userUid === selectedUserUid);
        const updated: ChatThreadSummary = existing
          ? {
              ...existing,
              lastMessage: saved.text,
              lastSender: 'admin',
              lastTimestamp: saved.timestamp,
              unreadCount: 0,
            }
          : {
              userUid: selectedUserUid,
              username: targetUsername,
              vipLevel: selectedUserObj?.vipLevel ?? 0,
              balance: selectedUserObj?.balance ?? 0,
              lastMessage: saved.text,
              lastSender: 'admin',
              lastTimestamp: saved.timestamp,
              unreadCount: 0,
              totalMessages: 1,
            };
        return [updated, ...prev.filter((t) => t.userUid !== selectedUserUid)];
      });
    } catch (err) {
      // Rollback optimistic message on error and show friendly error banner
      setMessages((prev) => prev.filter((m) => m.id !== clientMsgId));
      setReplyText(cleanText);
      setChatError(
        err instanceof Error
          ? err.message
          : 'Unable to send reply. Please check connection and try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const totalUnreadAll = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[calc(100vh-210px)] min-h-[540px]">
      {/* Section Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-900/40 border border-red-700/50 flex items-center justify-center text-red-400">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Customer Service Live Chat</span>
              {totalUnreadAll > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  {totalUnreadAll} Unread
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Real-time two-way messaging synchronized with User App Service Desk
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            loadThreads();
            if (selectedUserUid) loadConversation(selectedUserUid);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Main Split View: Left Threads List | Right Conversation */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* LEFT PANE: User Conversations List */}
        <div className="md:col-span-4 lg:col-span-4 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col min-h-0 bg-slate-950/60">
          {/* Search & Filter */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, UID, or message..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-red-700 text-white border-red-600'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                All Chats ({threads.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                  filterMode === 'unread'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Unread ({threads.filter((t) => t.unreadCount > 0).length})
              </button>
            </div>
          </div>

          {/* Threads Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
            {isLoadingThreads ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading customer conversations...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">
                  {filterMode === 'unread'
                    ? 'No unread user messages.'
                    : 'No customer support messages yet.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  When a user messages from the Service tab, their thread will appear here automatically.
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedUserUid === thread.userUid;
                const hasUnread = thread.unreadCount > 0;
                return (
                  <button
                    key={thread.userUid}
                    type="button"
                    onClick={() => setSelectedUserUid(thread.userUid)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/40 border-l-2 border-l-red-500'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                        {thread.avatarUrl ? (
                          <img
                            src={thread.avatarUrl}
                            alt={thread.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-xs text-white truncate">
                            {thread.username}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 shrink-0">
                            #{thread.userUid}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatChatTime(thread.lastTimestamp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                          className={`text-[11px] truncate ${
                            hasUnread ? 'text-white font-semibold' : 'text-slate-400'
                          }`}
                        >
                          {thread.lastSender === 'admin' ? 'You: ' : ''}
                          {thread.lastMessage}
                        </p>
                        {hasUnread && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Full Conversation History & Admin Reply Composer */}
        <div className="md:col-span-8 lg:col-span-8 flex flex-col min-h-0 bg-slate-900/40">
          {!selectedUserUid ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <Headphones className="w-12 h-12 opacity-30" />
              <h3 className="text-sm font-bold text-slate-300">
                Select a Customer Conversation
              </h3>
              <p className="text-xs max-w-sm">
                Choose any user from the left panel to inspect their message history and send real-time support replies.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {selectedThread?.avatarUrl ? (
                      <img
                        src={selectedThread.avatarUrl}
                        alt={selectedThread.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white truncate">
                        {selectedUserObj?.username || selectedThread?.username || `User_${selectedUserUid}`}
                      </h3>
                      <span className="text-[10px] font-mono bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700">
                        UID: {selectedUserUid}
                      </span>
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        VIP {selectedUserObj?.vipLevel ?? selectedThread?.vipLevel ?? 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Balance:{' '}
                      <span className="text-emerald-400 font-mono font-bold">
                        {(selectedUserObj?.balance ?? selectedThread?.balance ?? 0).toFixed(2)} USDT
                      </span>
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Connected
                </span>
              </div>

              {/* Conversation Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 bg-slate-900/50">
                {isLoadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Loading conversation history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No messages in this conversation yet. Send a message below to start chatting.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-slate-400">
                            {isAdmin ? msg.adminName || adminName : msg.username}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatChatTime(msg.timestamp)}
                          </span>
                        </div>
                        <div
                          className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap break-words ${
                            isAdmin
                              ? 'bg-red-700 text-white rounded-br-xs border border-red-600'
                              : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700'
                          }`}
                        >
                          {msg.text}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-500">
                            {msg.readByUser ? (
                              <>
                                <CheckCheck className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Seen by user</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>Delivered</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {chatError && (
                <div className="px-4 py-2 bg-rose-950/80 border-t border-rose-800/70 text-rose-200 text-xs font-medium flex items-center justify-between gap-2">
                  <span>{chatError}</span>
                  <button
                    type="button"
                    onClick={() => setChatError(null)}
                    className="text-rose-300 hover:text-white font-bold px-1 cursor-pointer"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Admin Reply Input Box */}
              <form
                onSubmit={handleSendReply}
                className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selectedUserObj?.username || selectedThread?.username || selectedUserUid}...`}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-4 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Send'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
