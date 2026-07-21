export interface AuthUser {
  id: number;
  email: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
}

interface ApiError {
  message: string;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...options });
  const data = await res.json();
  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return data as T;
}

function postJson<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/api/admin/auth/login', { email, password });
}

export async function logout(): Promise<{ ok: true }> {
  return postJson<{ ok: true }>('/api/admin/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/admin/me');
}
