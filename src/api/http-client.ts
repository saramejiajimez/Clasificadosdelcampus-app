import {
  clearSessionStorage,
  getAccessToken,
  getRefreshToken,
  saveTokensOnly,
} from '@/api/token-storage';

export class ApiClientError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  const raw =
    process.env.EXPO_PUBLIC_API_URL ??
    'https://clasificadosdelcampus-api.vercel.app';
  return raw.replace(/\/+$/, '');
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearSessionStorage();
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      await clearSessionStorage();
      return null;
    }
    const data = (await response.json()) as {
      token?: string;
      refreshToken?: string;
    };
    if (!data.token || !data.refreshToken) {
      await clearSessionStorage();
      return null;
    }
    await saveTokensOnly(data.token, data.refreshToken);
    return data.token;
  } catch {
    await clearSessionStorage();
    return null;
  }
}

async function buildAuthHeaders(
  options: RequestInit,
  requireAuth: boolean
): Promise<Headers> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (requireAuth) {
    const token = await getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = await buildAuthHeaders(options, requireAuth);
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && requireAuth) {
    const renewedToken = await tryRefreshToken();
    if (renewedToken) {
      headers.set('Authorization', `Bearer ${renewedToken}`);
      response = await fetch(url, { ...options, headers });
    }
  }

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      body.error ?? `Error HTTP ${response.status}`
    );
  }
  return body as T;
}
