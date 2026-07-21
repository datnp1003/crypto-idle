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

export interface GameConfigResponse {
  staff: StaffModule[];
  upgrades: UpgradeModule[];
  settings: Record<string, unknown>;
}

export async function getGameConfig(): Promise<GameConfigResponse> {
  const res = await fetch('/api/config', { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`API returned ${res.status}`);
  }
  return res.json();
}
