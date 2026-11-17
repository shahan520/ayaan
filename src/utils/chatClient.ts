import { ChatMessage, ChatThreadSummary } from '../types';

const isSameOriginFullStackHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.run.app') ||
    host.endsWith('.scf.usercontent.goog') ||
    host.endsWith('.googleusercontent.com') ||
    host.endsWith('.onrender.com')
  );
};

const getConfiguredApiBase = (): string => {
  if (isSameOriginFullStackHost()) {
    return '';
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL).trim().replace(/\/+$/, '');
  }
  return '';
};

const resolveChatApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getConfiguredApiBase();
  return base ? `${base}${cleanPath}` : cleanPath;
};

export const getChatWsUrl = (role: 'user' | 'admin', userUid?: string): string => {
  const params = new URLSearchParams({ role });
  if (userUid) {
    params.set('userUid', userUid);
  }

  const envBase = getConfiguredApiBase();
  let httpBase = envBase;
  if (!httpBase && typeof window !== 'undefined') {
    httpBase = window.location.origin;
  }

  const wsBase = httpBase.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  return `${wsBase}/ws/chat?${params.toString()}`;
};

const parseJsonResponse = async <T = any>(
  res: Response,
  fallbackErrorMessage: string,
  requestUrl: string
): Promise<T> => {
  if (res.status === 404) {
    const missingUrl = res.url || requestUrl;
    console.error(
      `[Customer Service Chat] 404 Not Found — missing chat endpoint at URL path: ${requestUrl} (resolved URL: ${missingUrl})`
    );
    throw new Error(
      `Customer service chat endpoint not found (404: ${requestUrl}). Please refresh the page and try again.`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!isJson) {
    const bodyText = await res.text().catch(() => '');
    const trimmed = bodyText.trimStart();
    const isHtml =
      trimmed.startsWith('<') || contentType.toLowerCase().includes('text/html');

    if (isHtml) {
      if (res.status >= 500) {
        throw new Error(
          'Customer service server is temporarily unavailable. Please try again in a moment.'
        );
      }
      throw new Error(
        `Received an unexpected HTML response from ${requestUrl}. Please refresh and try again.`
      );
    }

    throw new Error(
      res.ok
        ? 'Received an invalid non-JSON response from Customer Service.'
        : `${fallbackErrorMessage} (HTTP ${res.status})`
    );
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`${fallbackErrorMessage}. Invalid JSON received from server.`);
  }

  if (!res.ok) {
    throw new Error(
      (data && typeof data.message === 'string' && data.message) ||
        `${fallbackErrorMessage} (HTTP ${res.status})`
    );
  }

  return data as T;
};

export const fetchChatThreads = async (): Promise<{
  threads: ChatThreadSummary[];
  totalUnread: number;
}> => {
  const url = resolveChatApiUrl('/api/chat/threads');
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonResponse<{
    success?: boolean;
    threads?: ChatThreadSummary[];
    totalUnread?: number;
  }>(res, 'Failed to load chat threads', url);
  return {
    threads: Array.isArray(data.threads) ? data.threads : [],
    totalUnread: typeof data.totalUnread === 'number' ? data.totalUnread : 0,
  };
};

export const fetchChatMessages = async (userUid: string): Promise<ChatMessage[]> => {
  const url = resolveChatApiUrl(`/api/chat/messages/${encodeURIComponent(userUid)}`);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonResponse<{
    success?: boolean;
    messages?: ChatMessage[];
  }>(res, 'Failed to load conversation history', url);
  return Array.isArray(data.messages) ? data.messages : [];
};

export const sendChatMessage = async (payload: {
  id?: string;
  userUid: string;
  username: string;
  sender: 'user' | 'admin';
  adminName?: string;
  text: string;
  timestamp?: string;
}): Promise<ChatMessage> => {
  const url = resolveChatApiUrl('/api/chat/send');
  const clientTimestamp = payload.timestamp || new Date().toISOString();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      userId: payload.userUid,
      message: payload.text,
      timestamp: clientTimestamp,
    }),
  });
  const data = await parseJsonResponse<{
    success?: boolean;
    message?: ChatMessage | string;
    chatMessage?: ChatMessage;
  }>(res, 'Failed to send message', url);

  if (!data.success) {
    throw new Error(
      typeof data.message === 'string' ? data.message : 'Failed to send message'
    );
  }

  if (data.chatMessage && typeof data.chatMessage === 'object') {
    return data.chatMessage;
  }

  if (data.message && typeof data.message === 'object') {
    return data.message;
  }

  return {
    id: payload.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userUid: payload.userUid,
    username: payload.username,
    sender: payload.sender,
    adminName: payload.adminName,
    text: payload.text,
    timestamp: clientTimestamp,
    readByAdmin: payload.sender === 'admin',
    readByUser: payload.sender === 'user',
  };
};

export const markChatRead = async (
  userUid: string,
  reader: 'user' | 'admin'
): Promise<void> => {
  const url = resolveChatApiUrl('/api/chat/read');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ userUid, reader }),
    });
    if (res.status === 404) {
      console.error(
        `[Customer Service Chat] 404 Not Found — missing chat endpoint at URL path: ${url}`
      );
      return;
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('application/json')) {
      await res.json().catch(() => null);
    }
  } catch {
    // Non-critical background read-receipt sync
  }
};

export const connectChatWebSocket = (options: {
  role: 'user' | 'admin';
  userUid?: string;
  onMessage: (msg: ChatMessage) => void;
  onRead?: (userUid: string, reader: 'admin' | 'user') => void;
  onReconnect?: () => void;
}): (() => void) => {
  let ws: WebSocket | null = null;
  let closedByClient = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectAttempts = 0;
  let hasConnectedOnce = false;

  const connect = () => {
    if (closedByClient || typeof window === 'undefined') return;
    try {
      const url = getChatWsUrl(options.role, options.userUid);
      ws = new WebSocket(url);

      ws.onopen = () => {
        const isReconnection = hasConnectedOnce;
        hasConnectedOnce = true;
        reconnectAttempts = 0;

        if (isReconnection && options.onReconnect) {
          options.onReconnect();
        }

        if (pingTimer) clearInterval(pingTimer);
        pingTimer = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
            } catch {}
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'chat:message' && payload.message) {
            options.onMessage(payload.message as ChatMessage);
          } else if (payload?.type === 'chat:read' && payload.userUid && payload.reader) {
            options.onRead?.(String(payload.userUid), payload.reader);
          }
        } catch {}
      };

      ws.onclose = () => {
        if (pingTimer) {
          clearInterval(pingTimer);
          pingTimer = null;
        }
        if (!closedByClient) {
          reconnectAttempts += 1;
          const delay = Math.min(10000, 1000 * Math.pow(1.5, Math.min(reconnectAttempts, 5)));
          reconnectTimer = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        try {
          ws?.close();
        } catch {}
      };
    } catch {
      if (!closedByClient) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    }
  };

  connect();

  return () => {
    closedByClient = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (pingTimer) clearInterval(pingTimer);
    try {
      ws?.close();
    } catch {}
  };
};
