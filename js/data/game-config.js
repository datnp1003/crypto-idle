import { STAFF as FALLBACK_STAFF, UPGRADES as FALLBACK_UPGRADES } from './crypto-staff.js';

export let STAFF = [...FALLBACK_STAFF];
export let UPGRADES = [...FALLBACK_UPGRADES];

export const SETTINGS = {
  prestigeThreshold: 1_000_000,
  pumpMultiplier: 10,
  pumpDurationMs: 60 * 60 * 1000,
};

/**
 * Load game config from /api/config.
 * On success, mutates STAFF/UPGRADES in-place so all live bindings update.
 * On failure, falls back to static data with a console.warn.
 *
 * @param {Function} [fetchImpl] - fetch implementation (default: globalThis.fetch)
 * @returns {Promise<boolean>} true if API config was loaded successfully
 */
export async function loadGameConfig(fetchImpl) {
  const _fetch = fetchImpl || (typeof globalThis !== 'undefined' && globalThis.fetch);
  if (!_fetch) {
    console.warn('[game-config] fetch unavailable, using static fallback');
    return false;
  }

  try {
    const res = await _fetch('/api/config');
    if (!res.ok) {
      console.warn(`[game-config] /api/config returned ${res.status}, using static fallback`);
      return false;
    }
    const data = await res.json();

    if (Array.isArray(data.staff) && data.staff.length > 0) {
      STAFF = data.staff.map(s => ({
        id: s.id,
        name: s.name,
        baseCost: s.baseCost,
        baseProfit: s.baseProfit,
        costGrowth: s.costGrowth,
        maxCount: s.maxCount,
      }));
    }

    if (Array.isArray(data.upgrades) && data.upgrades.length > 0) {
      UPGRADES = data.upgrades.map(u => ({
        id: u.id,
        name: u.name,
        baseCost: u.baseCost,
        costGrowth: u.costGrowth,
        costFormula: u.costFormula,
        maxLevel: u.maxLevel,
        description: u.description,
      }));
    }

    if (data.settings && typeof data.settings === 'object') {
      if (data.settings.prestigeThreshold != null) {
        SETTINGS.prestigeThreshold = data.settings.prestigeThreshold;
      }
      if (data.settings.pumpMultiplier != null) {
        SETTINGS.pumpMultiplier = data.settings.pumpMultiplier;
      }
      if (data.settings.pumpDurationMs != null) {
        SETTINGS.pumpDurationMs = data.settings.pumpDurationMs;
      }
    }

    console.info('[game-config] loaded from /api/config');
    return true;
  } catch (e) {
    console.warn('[game-config] failed to load /api/config:', e.message || e);
    return false;
  }
}
