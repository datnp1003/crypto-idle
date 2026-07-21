import { STAFF, UPGRADES, SETTINGS } from '../data/game-config.js';
import { canPrestige, prestigeGain, staffCost, upgradeCost, maxAffordableLevels, maxAffordableStaff } from './economy.js';

const SAVE_KEY = 'crypto_idle_save_v1';

function defaultStaff() {
  const s = {};
  for (const def of STAFF) s[def.id] = 0;
  return s;
}

function mergeStaff(saved) {
  const base = defaultStaff();
  for (const id of Object.keys(base)) {
    if (typeof saved[id] !== 'number') saved[id] = 0;
  }
  return saved;
}

export function defaultUpgrades() {
  const u = {};
  for (const def of UPGRADES) u[def.id] = 0;
  return u;
}

function mergeUpgrades(saved) {
  const base = defaultUpgrades();
  for (const id of Object.keys(base)) {
    if (typeof saved[id] !== 'number') saved[id] = 0;
  }
  return saved;
}

const defaultState = {
  cash: 0,
  lifetimeCash: 0,
  ...defaultUpgrades(),
  staff: defaultStaff(),
  prestigePoints: 0,
  eventUntil: 0,
  lastOnlineTime: Date.now()
};

class GameState {
  constructor() {
    const loaded = this.load();
    if (loaded) {
      const mergedUpgrades = mergeUpgrades(loaded);
      this.state = { ...defaultState, ...loaded, ...mergedUpgrades, staff: mergeStaff(loaded.staff || {}) };
    } else {
      this.state = { ...defaultState, lastOnlineTime: Date.now() };
    }
    this.listeners = [];
  }

  load() {
    try {
      const save = localStorage.getItem(SAVE_KEY);
      return save ? JSON.parse(save) : null;
    } catch (e) {
      console.error('Failed to load save:', e);
      return null;
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }

  reset() {
    this.state = { ...defaultState, staff: defaultStaff(), lastOnlineTime: Date.now() };
    this.save();
    this.notify();
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.save();
    this.notify();
  }

  addCash(amount) {
    if (amount <= 0) return;
    this.state.cash += amount;
    this.state.lifetimeCash += amount;
    this.save();
    this.notify();
  }

  spendCash(amount) {
    if (amount < 0 || this.state.cash < amount) return false;
    this.state.cash -= amount;
    this.save();
    this.notify();
    return true;
  }

  buyStaffCount(staffDef, limit = 1) {
    const count = this.state.staff[staffDef.id] || 0;
    const maxCount = staffDef.maxCount || 500;
    const result = maxAffordableStaff({
      cash: this.state.cash,
      count,
      maxCount,
      baseCost: staffDef.baseCost,
      costGrowth: staffDef.costGrowth,
      limit
    });
    if (result.count <= 0) return false;
    this.state.cash -= result.totalCost;
    this.state.staff[staffDef.id] = count + result.count;
    this.save();
    this.notify();
    return result;
  }

  buyStaff(staffDef) {
    return this.buyStaffCount(staffDef, 1);
  }

  buyUpgradeLevels(upgradeDef, limit = 1) {
    const level = this.state[upgradeDef.id] || 0;
    const result = maxAffordableLevels({
      cash: this.state.cash,
      level,
      maxLevel: upgradeDef.maxLevel,
      baseCost: upgradeDef.baseCost,
      costGrowth: upgradeDef.costGrowth,
      limit,
      upgradeDef,
    });
    if (result.levels <= 0) return false;
    this.state.cash -= result.totalCost;
    this.state[upgradeDef.id] = result.nextLevel;
    this.save();
    this.notify();
    return result;
  }

  buyUpgrade(upgradeDef) {
    return this.buyUpgradeLevels(upgradeDef, 1);
  }

  triggerPump(now = Date.now()) {
    this.state.eventUntil = now + SETTINGS.pumpDurationMs;
    this.save();
    this.notify();
  }

  prestige() {
    if (!canPrestige(this.state)) return false;
    const gain = prestigeGain(this.state);
    this.state.prestigePoints += gain;
    this.state.cash = 0;
    this.state.lifetimeCash = 0;
    for (const def of UPGRADES) {
      this.state[def.id] = 0;
    }
    this.state.staff = defaultStaff();
    this.state.eventUntil = 0;
    this.state.lastOnlineTime = Date.now();
    this.save();
    this.notify();
    return gain;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const gameState = new GameState();
