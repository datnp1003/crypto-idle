export const PRESTIGE_THRESHOLD = 1_000_000;
export const PUMP_MULTIPLIER = 10;
export const PUMP_DURATION_MS = 60 * 60 * 1000;

export function levelCost(baseCost, growth, level) {
  return Math.floor(baseCost * Math.pow(growth, level) * Math.max(1, level));
}

export function prestigeMultiplier(prestigePoints) {
  return 1 + prestigePoints * 0.10;
}

export function activeEventMultiplier(state, now = Date.now()) {
  return state.eventUntil > now ? 10 : 1;
}

export function clickValue(state) {
  return Math.pow(2, state.clickUpgradeLevel || 0) * prestigeMultiplier(state.prestigePoints || 0);
}

export function staffCost(staffDef, count) {
  return levelCost(staffDef.baseCost, staffDef.costGrowth, count);
}

export function upgradeCost(upgradeDef, level) {
  if (upgradeDef.id === 'clickUpgradeLevel' || upgradeDef.costFormula === 'double') {
    return Math.floor(Math.pow(2, level) * 100);
  }
  return levelCost(upgradeDef.baseCost, upgradeDef.costGrowth, level);
}

export function maxAffordableLevels({ cash, level, maxLevel, baseCost, costGrowth, limit = Infinity, upgradeDef }) {
  let totalCost = 0;
  let count = 0;
  let current = level;
  const maxCount = Math.min(limit, maxLevel - level);
  while (count < maxCount) {
    const cost = upgradeDef ? upgradeCost(upgradeDef, current) : levelCost(baseCost, costGrowth, current);
    if (totalCost + cost > cash) break;
    totalCost += cost;
    current++;
    count++;
  }
  return { levels: count, totalCost, nextLevel: level + count };
}

export function maxAffordableStaff({ cash, count, maxCount, baseCost, costGrowth, limit = Infinity }) {
  let totalCost = 0;
  let bought = 0;
  let current = count;
  const cap = Math.min(limit, maxCount - count);
  while (bought < cap) {
    const cost = staffCost({ baseCost, costGrowth }, current);
    if (totalCost + cost > cash) break;
    totalCost += cost;
    current++;
    bought++;
  }
  return { count: bought, totalCost, nextCount: count + bought };
}

export function staffProfitPerSecond(state, staffDefs) {
  let total = 0;
  for (const def of staffDefs) {
    const count = state.staff[def.id] || 0;
    total += count * def.baseProfit;
  }
  return total * (1 + state.staffUpgradeLevel * 0.05);
}

export function profitPerSecond(state, staffDefs, now = Date.now()) {
  const sps = staffProfitPerSecond(state, staffDefs);
  return sps * (1 + state.automationLevel * 0.10) * prestigeMultiplier(state.prestigePoints) * activeEventMultiplier(state, now);
}

export function nextPrestigeRequirement(stateOrPoints) {
  const points = (typeof stateOrPoints === 'number')
    ? stateOrPoints
    : (stateOrPoints.prestigePoints || 0);
  const requirement = PRESTIGE_THRESHOLD * Math.pow(10, points);
  return Number.isFinite(requirement) ? requirement : Infinity;
}

export function canPrestige(state) {
  const requirement = nextPrestigeRequirement(state);
  return Number.isFinite(requirement) && state.lifetimeCash >= requirement;
}

export function prestigeGain(state) {
  if (!canPrestige(state)) return 0;
  const gain = Math.floor(Math.log10(state.lifetimeCash / nextPrestigeRequirement(state)) + 1);
  return Number.isFinite(gain) ? Math.max(1, gain) : 0;
}
