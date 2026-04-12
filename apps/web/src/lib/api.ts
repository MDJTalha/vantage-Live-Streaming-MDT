/**
 * Centralized API fetch wrapper with automatic token refresh.
 * H-07 FIX: Handles 401 responses by refreshing the access token
 * and retrying the original request.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipRetry?: boolean;
}

/**
 * Attempt to refresh the access token using the refresh token.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken || !API_URL) return null;

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh failed — clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.accessToken;
    if (newAccessToken) {
      localStorage.setItem('accessToken', newAccessToken);
    }
    return newAccessToken;
  } catch {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
}

/**
 * Centralized API fetch with automatic token refresh on 401.
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    skipAuth = false,
    skipRetry = false,
    headers: customHeaders = {},
    ...restOptions
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Attach auth token if available and not skipping auth
  if (!skipAuth) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  // H-07 FIX: Handle 401 with automatic token refresh
  if (response.status === 401 && !skipRetry && !skipAuth) {
    if (isRefreshing && refreshPromise) {
      // Another request is already refreshing — wait for it
      const newToken = await refreshPromise;
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...restOptions, headers });
      }
      return response;
    }

    isRefreshing = true;
    refreshPromise = refreshAccessToken();

    try {
      const newToken = await refreshPromise;
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...restOptions, headers });
      }
      // Refresh failed — return original 401
      return response;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  return response;
}

/**
 * Convenience method for authenticated GET requests.
 */
export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiFetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status}`);
  }
  const data = await response.json();
  return data.data ?? data;
}

/**
 * Convenience method for authenticated POST requests.
 */
export async function apiPost<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `POST ${url} failed: ${response.status}`);
  }
  const data = await response.json();
  return data.data ?? data;
}

/**
 * Convenience method for authenticated PATCH requests.
 */
export async function apiPatch<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await apiFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `PATCH ${url} failed: ${response.status}`);
  }
  const data = await response.json();
  return data.data ?? data;
}

/**
 * Convenience method for authenticated DELETE requests.
 */
export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiFetch(url, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`DELETE ${url} failed: ${response.status}`);
  }
  const data = await response.json();
  return data.data ?? data;
}

export function getApiBaseUrl(): string {
  if (!API_URL && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL is not configured in production');
  }
  return API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
}
