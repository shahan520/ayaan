/**
 * Centralized API Configuration & Render Service Keep-Alive
 * Hardcodes/falls back to the live Render backend: https://ayaan-1nm6.onrender.com
 * Implements background warm-up / heartbeat pings to prevent Render's 15-minute idle sleep.
 */

export const RENDER_BACKEND_URL = 'https://ayaan-1nm6.onrender.com';

/**
 * Resolves full API URL for a given endpoint.
 * Directs traffic to the live Render backend (or custom VITE_API_BASE_URL if explicitly set).
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Allow custom environment override if defined
  const envBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
    ? String(import.meta.env.VITE_API_BASE_URL).trim().replace(/\/+$/, '')
    : '';

  if (envBase) {
    return `${envBase}${cleanEndpoint}`;
  }

  // Hardcode/fallback to the live Render backend
  return `${RENDER_BACKEND_URL}${cleanEndpoint}`;
};

/**
 * Background Heartbeat & Keep-Alive Warm-Up Manager
 * Sends periodic background ping requests to keep Render service awake.
 */
class RenderKeepAliveManager {
  private intervalId: any = null;
  private isWarmedUp: boolean = false;
  private pingIntervalMs: number = 8 * 60 * 1000; // Ping every 8 minutes (Render sleeps at 15m)

  public start() {
    if (typeof window === 'undefined') return;

    // Immediate warm-up ping on application load
    this.ping();

    // Setup recurring heartbeat
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.ping();
      }, this.pingIntervalMs);
    }
  }

  public async ping(): Promise<boolean> {
    try {
      const pingUrl = getApiUrl('/api/health');
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (response.ok) {
        this.isWarmedUp = true;
        return true;
      }
    } catch {
      // Background ping silently absorbs any transient network hiccups
    }
    return false;
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getStatus() {
    return {
      isWarmedUp: this.isWarmedUp,
      backendUrl: RENDER_BACKEND_URL,
    };
  }
}

export const renderKeepAlive = new RenderKeepAliveManager();
