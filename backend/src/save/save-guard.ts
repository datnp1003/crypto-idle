import { BadRequestException } from '@nestjs/common';

export interface StaffDef {
  id: string;
  baseProfit: number;
  maxCount: number;
}

export interface UpgradeDef {
  id: string;
  maxLevel: number;
}

export interface GuardConfig {
  staffDefs: StaffDef[];
  upgradeDefs: UpgradeDef[];
  pumpMultiplier: number;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toFiniteNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function sanitizeAndValidateSave(
  prevSave: Record<string, any> | null,
  prevUpdatedAt: Date | null,
  incomingSave: any,
  config: GuardConfig,
  now: number,
): { save: Record<string, any> } {
  if (!isPlainObject(incomingSave)) {
    throw new BadRequestException('Save must be a plain object');
  }

  const { staffDefs, upgradeDefs, pumpMultiplier } = config;
  const staffMap = new Map(staffDefs.map(s => [s.id, s]));

  const clean: Record<string, any> = {};

  const rawCash = toFiniteNumber(incomingSave.cash);
  clean.cash = rawCash !== undefined ? Math.max(0, rawCash) : 0;

  const rawLifetime = toFiniteNumber(incomingSave.lifetimeCash);
  clean.lifetimeCash = rawLifetime !== undefined ? Math.max(0, rawLifetime) : 0;

  const rawPrestige = toFiniteNumber(incomingSave.prestigePoints);
  clean.prestigePoints = rawPrestige !== undefined ? Math.max(0, rawPrestige) : 0;

  const incomingStaff = isPlainObject(incomingSave.staff) ? incomingSave.staff : {};
  clean.staff = {};
  for (const [id, count] of Object.entries(incomingStaff)) {
    if (!staffMap.has(id)) continue;
    const n = toFiniteNumber(count);
    if (n === undefined) continue;
    const def = staffMap.get(id)!;
    clean.staff[id] = clamp(Math.max(0, Math.floor(n)), 0, def.maxCount);
  }

  for (const def of upgradeDefs) {
    const raw = toFiniteNumber(incomingSave[def.id]);
    clean[def.id] = raw !== undefined ? clamp(Math.max(0, Math.floor(raw)), 0, def.maxLevel) : 0;
  }

  const rawEventUntil = toFiniteNumber(incomingSave.eventUntil);
  clean.eventUntil = rawEventUntil !== undefined ? Math.max(0, rawEventUntil) : 0;
  const rawLastOnline = toFiniteNumber(incomingSave.lastOnlineTime);
  clean.lastOnlineTime = rawLastOnline !== undefined ? Math.max(0, rawLastOnline) : now;

  if (prevSave) {
    const prevLifetime = toFiniteNumber(prevSave.lifetimeCash) ?? 0;
    if (clean.lifetimeCash < prevLifetime) {
      clean.lifetimeCash = prevLifetime;
    }
    const prevPrestige = toFiniteNumber(prevSave.prestigePoints) ?? 0;
    if (clean.prestigePoints < prevPrestige) {
      clean.prestigePoints = prevPrestige;
    }
  }

  if (prevSave && prevUpdatedAt) {
    const prevStaff = isPlainObject(prevSave.staff) ? prevSave.staff : {};
    const prevCash = toFiniteNumber(prevSave.cash) ?? 0;
    const prevStaffUpgrade = toFiniteNumber(prevSave.staffUpgradeLevel) ?? 0;
    const prevAutoUpgrade = toFiniteNumber(prevSave.automationLevel) ?? 0;
    const prevPrestige = toFiniteNumber(prevSave.prestigePoints) ?? 0;
    const prevEventUntil = toFiniteNumber(prevSave.eventUntil) ?? 0;

    let baseProfitPerSec = 0;
    for (const [id, count] of Object.entries(prevStaff)) {
      const def = staffMap.get(id);
      if (!def) continue;
      const n = toFiniteNumber(count) ?? 0;
      baseProfitPerSec += n * def.baseProfit;
    }

    const staffBonus = 1 + prevStaffUpgrade * 0.05;
    const autoBonus = 1 + prevAutoUpgrade * 0.10;
    const prestigeMult = 1 + prevPrestige * 0.10;
    const eventMult = prevEventUntil > now ? pumpMultiplier : 1;
    const maxProfitPerSec = baseProfitPerSec * staffBonus * autoBonus * prestigeMult * eventMult;

    const elapsedMs = Math.max(0, now - prevUpdatedAt.getTime());
    const elapsedSec = elapsedMs / 1000;

    const BURST = 4;
    const CLICK_BUFFER = 1e6;
    const allowedGain = maxProfitPerSec * elapsedSec * BURST + CLICK_BUFFER;

    if (clean.cash - prevCash > allowedGain) {
      clean.cash = Math.max(0, prevCash + allowedGain);
    }
  }

  return { save: clean };
}
