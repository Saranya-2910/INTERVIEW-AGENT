const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/api/v1`;

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('aia_auth_token') || sessionStorage.getItem('aia_auth_token');
}

export function setStoredToken(token: string, remember: boolean = true): void {
  if (remember) {
    localStorage.setItem('aia_auth_token', token);
  } else {
    sessionStorage.setItem('aia_auth_token', token);
  }
}

export function clearStoredToken(): void {
  localStorage.removeItem('aia_auth_token');
  sessionStorage.removeItem('aia_auth_token');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorInfo = data?.error || {
      code: 'REQUEST_FAILED',
      message: response.statusText || 'Request failed',
    };
    throw new ApiError(response.status, errorInfo.code, errorInfo.message, errorInfo.details);
  }

  return data as T;
}
