/**
 * Central API client for talking to the FastAPI backend.
 * Handles base URL, JWT token storage, and request/response handling.
 */

const API_BASE_URL = 'http://localhost:8000/api';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach Authorization header (default true)
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // No content responses (e.g. some DELETE calls)
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(
      typeof message === 'string' ? message : JSON.stringify(message),
      response.status
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'POST', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'PUT', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
};
