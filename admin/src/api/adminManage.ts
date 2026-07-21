export interface PlayerRow {
  id: number;
  email: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
  hasSave: boolean;
}

export interface PlayerDetail {
  id: number;
  email: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
  save: any | null;
  saveUpdatedAt: string | null;
}

export interface AdminRow {
  id: number;
  email: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditItem {
  id: number;
  actorUserId: number | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detailsJson: string | null;
  createdAt: string;
}

export interface AuditPage {
  items: AuditItem[];
  total: number;
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

function jsonBody(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function listPlayers(): Promise<PlayerRow[]> {
  return apiRequest<PlayerRow[]>('/api/admin/players');
}

export function getPlayer(id: number): Promise<PlayerDetail> {
  return apiRequest<PlayerDetail>(`/api/admin/players/${id}`);
}

export function resetPlayerSave(id: number): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/api/admin/players/${id}/save`, { method: 'DELETE' });
}

export function setPlayerDisabled(id: number, disabled: boolean): Promise<PlayerRow> {
  return apiRequest<PlayerRow>(`/api/admin/players/${id}/disabled`, jsonBody('PATCH', { disabled }));
}

export function listAdmins(): Promise<AdminRow[]> {
  return apiRequest<AdminRow[]>('/api/admin/admins');
}

export function createAdmin(email: string, password: string): Promise<AdminRow> {
  return apiRequest<AdminRow>('/api/admin/admins', jsonBody('POST', { email, password }));
}

export function setAdminDisabled(id: number, disabled: boolean): Promise<AdminRow> {
  return apiRequest<AdminRow>(`/api/admin/admins/${id}/disabled`, jsonBody('PATCH', { disabled }));
}

export function listAudit(limit: number, offset: number): Promise<AuditPage> {
  return apiRequest<AuditPage>(`/api/admin/audit?limit=${limit}&offset=${offset}`);
}
