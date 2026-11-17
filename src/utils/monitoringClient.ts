import { UserMonitoringRecord } from '../types';
import { getApiUrl, RENDER_BACKEND_URL } from './apiConfig';

export const getMonitorWsUrl = (
  role: 'user' | 'admin',
  userUid?: string,
  username?: string
): string => {
  const params = new URLSearchParams({ role });
  if (userUid) params.set('userUid', userUid);
  if (username) params.set('username', username);

  const envBase =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
      ? String(import.meta.env.VITE_API_BASE_URL).trim().replace(/\/+$/, '')
      : '';

  let httpBase = '';
  if (envBase) {
    httpBase = envBase;
  } else if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.run.app') ||
      host.endsWith('.onrender.com')
    ) {
      httpBase = window.location.origin;
    } else {
      httpBase = RENDER_BACKEND_URL;
    }
  } else {
    httpBase = RENDER_BACKEND_URL;
  }

  const wsBase = httpBase.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  return `${wsBase}/ws/monitor?${params.toString()}`;
};

export const fetchMonitoringRecords = async (): Promise<{
  records: UserMonitoringRecord[];
  onlineCount: number;
}> => {
  const res = await fetch(getApiUrl('/api/monitoring/users'));
  if (!res.ok) {
    throw new Error('Failed to load user monitoring records');
  }
  const data = await res.json();
  return {
    records: Array.isArray(data.records) ? data.records : [],
    onlineCount: typeof data.onlineCount === 'number' ? data.onlineCount : 0,
  };
};

export type MonitoringEventType =
  | 'session_start'
  | 'copy_trc20'
  | 'platform_select'
  | 'heartbeat';

export const trackMonitoringEvent = (payload: {
  eventType: MonitoringEventType;
  userUid: string;
  username?: string;
  copiedAddress?: string;
  activePlatform?: string;
  clientGeo?: {
    ip?: string;
    country?: string;
    city?: string;
    region?: string;
  };
}): void => {
  if (!payload.userUid) return;
  try {
    fetch(getApiUrl('/api/monitoring/event'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silent non-blocking tracking
  }
};

const GEO_SESSION_KEY = 'tradeweb_client_geo_v1';

export const trackUserSessionStart = (userUid: string, username?: string): void => {
  if (!userUid) return;

  let cachedGeo:
    | { ip?: string; country?: string; city?: string; region?: string }
    | undefined;
  try {
    const raw = sessionStorage.getItem(GEO_SESSION_KEY);
    if (raw) {
      cachedGeo = JSON.parse(raw);
    }
  } catch {}

  trackMonitoringEvent({
    eventType: 'session_start',
    userUid,
    username,
    clientGeo: cachedGeo,
  });

  // Silent fallback IP/Location lookup once per browser session for preview/local environments
  if (!cachedGeo && typeof window !== 'undefined') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    fetch('https://ipwho.is/', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((geo) => {
        if (geo && geo.success !== false && (geo.country || geo.city)) {
          const parsed = {
            ip: typeof geo.ip === 'string' ? geo.ip : undefined,
            country: typeof geo.country === 'string' ? geo.country : undefined,
            city: typeof geo.city === 'string' ? geo.city : undefined,
            region: typeof geo.region === 'string' ? geo.region : undefined,
          };
          try {
            sessionStorage.setItem(GEO_SESSION_KEY, JSON.stringify(parsed));
          } catch {}
          trackMonitoringEvent({
            eventType: 'session_start',
            userUid,
            username,
            clientGeo: parsed,
          });
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  }
};

export const connectMonitorWebSocket = (options: {
  role: 'user' | 'admin';
  userUid?: string;
  username?: string;
  onSnapshot?: (records: UserMonitoringRecord[]) => void;
  onUpdate?: (record: UserMonitoringRecord) => void;
  onConnectionChange?: (connected: boolean) => void;
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
      const url = getMonitorWsUrl(options.role, options.userUid, options.username);
      ws = new WebSocket(url);

      ws.onopen = () => {
        const isReconnection = hasConnectedOnce;
        hasConnectedOnce = true;
        reconnectAttempts = 0;
        options.onConnectionChange?.(true);

        if (isReconnection) {
          options.onReconnect?.();
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
          if (payload?.type === 'monitor:snapshot' && Array.isArray(payload.records)) {
            options.onSnapshot?.(payload.records as UserMonitoringRecord[]);
          } else if (payload?.type === 'monitor:update' && payload.record) {
            options.onUpdate?.(payload.record as UserMonitoringRecord);
          }
        } catch {}
      };

      ws.onclose = () => {
        options.onConnectionChange?.(false);
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
    options.onConnectionChange?.(false);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (pingTimer) clearInterval(pingTimer);
    try {
      ws?.close();
    } catch {}
  };
};
