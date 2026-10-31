/**
 * API Configuration Utility
 * Supports Vercel deployments, custom backend environments, and local development.
 *
 * Configurable via:
 * - import.meta.env.VITE_API_BASE_URL (or VITE_API_URL)
 * - Defaults to relative paths (empty string) for same-domain or Vercel serverless proxy.
 */

export const getApiBaseUrl = (): string => {
  try {
    const envUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
      '';

    return typeof envUrl === 'string' ? envUrl.trim().replace(/\/+$/, '') : '';
  } catch {
    return '';
  }
};

/**
 * Builds a full URL for an API endpoint.
 *
 * @param endpoint The route path, e.g. '/api/auth/register'
 * @returns Fully qualified URL or origin-relative path
 */
export const getApiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
};
