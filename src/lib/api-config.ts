// src/lib/api-config.ts

function readCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

async function refreshCsrf() {
  // trigga middleware att sätta csrf_token om saknas/ogiltig
  await fetch('/', { method: 'GET', credentials: 'include' });
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});

  // 🚨 CRITICAL: Only set content-type for JSON, NOT for FormData
  // FormData needs multipart/form-data boundary set by browser
  if (!headers.has('content-type') && init.body) {
    // Check if body is FormData - if so, let browser set Content-Type with boundary
    if (!(init.body instanceof FormData)) {
      headers.set('content-type', 'application/json');
    }
    // If FormData, don't set Content-Type - browser will set multipart/form-data with boundary
  }

  // Läs CSRF från cookie (double-submit)
  const csrf = readCookie('csrf_token');
  if (csrf) headers.set('x-csrf-token', csrf);

  const doFetch = () =>
    fetch(input, {
      ...init,
      headers,
      credentials: 'include', // VIKTIGT: skicka auth-cookies
    });

  let res = await doFetch();

  // Auto-retry en gång vid 403 (möjligen pga saknad/fel csrf)
  if (res.status === 403) {
    await refreshCsrf();
    const csrf2 = readCookie('csrf_token');
    if (csrf2) headers.set('x-csrf-token', csrf2);
    res = await doFetch();
  }

  return res;
}

/**
 * Get the appropriate base URL for API calls
 * @returns Base URL for API endpoints
 */
export function getApiBaseUrl(): string {
  // Server-side rendering: always use relative paths
  if (typeof window === 'undefined') {
    return ''
  }

  // Client-side: environment-specific URLs
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    // Development: use localhost with correct port
    return 'http://localhost:3005'
  }

  // Production/Preview: use current origin (same-origin requests)
  return window.location.origin
}

/**
 * Create full API URL for a given endpoint
 * @param endpoint - API endpoint path (e.g., '/api/players')
 * @returns Full URL for the API call
 */
export function createApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl()

  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  return `${baseUrl}${normalizedEndpoint}`
}

/**
 * Environment info for debugging
 */
export function getApiEnvironmentInfo() {
  return {
    baseUrl: getApiBaseUrl(),
    environment: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined',
    origin: typeof window !== 'undefined' ? window.location.origin : 'SSR'
  }
}