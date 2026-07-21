export interface StaffModule {
  id: string;
  name: string;
  baseCost: number;
  baseProfit: number;
  costGrowth: number;
  maxCount: number;
  icon: string;
  sortOrder: number;
  enabled: boolean;
}

export interface UpgradeModule {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  costFormula: string;
  maxLevel: number;
  icon: string;
  sortOrder: number;
  enabled: boolean;
}

export interface GameSetting {
  key: string;
  valueJson: string;
}

export interface GameConfigResponse {
  staff: StaffModule[];
  upgrades: UpgradeModule[];
  settings: Record<string, unknown>;
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

export async function getGameConfig(): Promise<GameConfigResponse> {
  return apiRequest<GameConfigResponse>('/api/config');
}

export async function listStaff(includeDisabled = true): Promise<StaffModule[]> {
  const q = includeDisabled ? '?includeDisabled=true' : '';
  return apiRequest<StaffModule[]>(`/api/admin/staff${q}`);
}

export async function updateStaff(id: string, payload: Partial<StaffModule>): Promise<StaffModule> {
  return apiRequest<StaffModule>(`/api/admin/staff/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function setStaffEnabled(id: string, enabled: boolean): Promise<StaffModule> {
  return apiRequest<StaffModule>(`/api/admin/staff/${id}/enabled`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

export async function listUpgrades(includeDisabled = true): Promise<UpgradeModule[]> {
  const q = includeDisabled ? '?includeDisabled=true' : '';
  return apiRequest<UpgradeModule[]>(`/api/admin/upgrades${q}`);
}

export async function updateUpgrade(id: string, payload: Partial<UpgradeModule>): Promise<UpgradeModule> {
  return apiRequest<UpgradeModule>(`/api/admin/upgrades/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function setUpgradeEnabled(id: string, enabled: boolean): Promise<UpgradeModule> {
  return apiRequest<UpgradeModule>(`/api/admin/upgrades/${id}/enabled`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

export async function listSettings(): Promise<GameSetting[]> {
  return apiRequest<GameSetting[]>('/api/admin/settings');
}

export async function updateSetting(key: string, value: unknown): Promise<GameSetting> {
  return apiRequest<GameSetting>(`/api/admin/settings/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
}
