import assert from 'node:assert/strict';
import {
  levelCost, clickValue, activeEventMultiplier, staffProfitPerSecond,
  profitPerSecond, upgradeCost, prestigeMultiplier, staffCost, maxAffordableLevels,
  maxAffordableStaff, nextPrestigeRequirement, canPrestige, prestigeGain,
  PRESTIGE_THRESHOLD, PUMP_MULTIPLIER, PUMP_DURATION_MS
} from './economy.js';
import { STAFF, UPGRADES } from '../data/crypto-staff.js';
import { defaultUpgrades } from '../core/game-state.js';
import { MONEY_SUFFIXES, idleSuffix, formatMoneyValue } from '../data/number-format.js';

// --- levelCost (formula: base * growth^level * max(1, level)) ---
assert.equal(levelCost(50, 1.25, 0), 50, 'levelCost level 0 = baseCost');
assert.equal(levelCost(50, 1.25, 1), 62, 'levelCost level 1 = base*growth');
assert.equal(levelCost(50, 1.25, 2), 156, 'levelCost level 2 = base*growth^2*2');
assert.equal(levelCost(50, 1.25, 10), 4656, 'levelCost level 10 = base*growth^10*10');
assert.equal(levelCost(100, 1.5, 0), 100, 'levelCost level 0 = baseCost (different params)');
assert.equal(levelCost(25, 1.15, 3), Math.floor(25 * Math.pow(1.15, 3) * 3), 'levelCost arbitrary');

// --- staffCost ---
assert.equal(staffCost({ baseCost: 25, costGrowth: 1.25 }, 2), 78, 'staffCost count 2');

// --- clickValue + prestigeMultiplier ---
assert.equal(clickValue({ clickUpgradeLevel: 0, prestigePoints: 0 }), 1, 'clickValue base');
assert.equal(clickValue({ clickUpgradeLevel: 1, prestigePoints: 0 }), 2, 'clickValue level 1');
assert.equal(clickValue({ clickUpgradeLevel: 4, prestigePoints: 0 }), 16, 'clickValue level 4');
assert.equal(clickValue({ clickUpgradeLevel: 4, prestigePoints: 4 }), 22.4, 'clickValue level 4 + prestige 4');
assert.equal(clickValue({ clickUpgradeLevel: 0, prestigePoints: 1 }), 1.1, 'clickValue with prestige');
assert.equal(prestigeMultiplier(0), 1, 'prestigeMultiplier 0');
assert.equal(prestigeMultiplier(4), 1.4, 'prestigeMultiplier 4 pts');
assert.ok(UPGRADES.find(u => u.id === 'clickUpgradeLevel').description.includes('x2'), 'Diamond Hands description includes x2');

// --- staffProfitPerSecond ---
const stateNoUpgrades = { staffUpgradeLevel: 0, staff: { intern: 1, trader: 0, miner: 0, quant: 0 } };
assert.ok(Math.abs(staffProfitPerSecond(stateNoUpgrades, STAFF) - 0.2) < 0.0001, '1 intern = 0.2/s');

const stateWithStaffUpgrade = { staffUpgradeLevel: 2, staff: { intern: 10, trader: 0, miner: 0, quant: 0 } };
// 10 * 0.2 = 2, * (1 + 2*0.05) = 2 * 1.1 = 2.2
assert.ok(Math.abs(staffProfitPerSecond(stateWithStaffUpgrade, STAFF) - 2.2) < 0.0001, 'staffUpgrade bonus');

// --- profitPerSecond with automation + pump ---
const fullState = {
  staffUpgradeLevel: 0,
  automationLevel: 5,
  prestigePoints: 0,
  eventUntil: 0,
  staff: { intern: 1, trader: 0, miner: 0, quant: 0 }
};
// 0.2 * (1 + 5*0.1) * 1 * 1 = 0.2 * 1.5 = 0.3
assert.ok(Math.abs(profitPerSecond(fullState, STAFF) - 0.3) < 0.0001, 'automation bonus');

const pumpState = { ...fullState, eventUntil: Date.now() + 60000 };
// 0.2 * 1.5 * 1 * 10 = 3.0
assert.ok(Math.abs(profitPerSecond(pumpState, STAFF) - 3.0) < 0.0001, 'pump event multiplier');

// --- upgrade max level ---
for (const u of UPGRADES) {
  assert.equal(u.maxLevel, 100, `${u.id} maxLevel 100`);
}

// --- UPGRADES count and id format ---
assert.ok(UPGRADES.length >= 8, `UPGRADES.length >= 8 (got ${UPGRADES.length})`);
for (const u of UPGRADES) {
  assert.ok(u.id.endsWith('Level'), `${u.id} endsWith('Level')`);
}

// --- defaultUpgrades helper ---
const upgrades = defaultUpgrades();
assert.equal(Object.keys(upgrades).length, UPGRADES.length, 'defaultUpgrades has all ids');
for (const def of UPGRADES) {
  assert.ok(def.id in upgrades, `defaultUpgrades contains ${def.id}`);
  assert.equal(upgrades[def.id], 0, `defaultUpgrades ${def.id} === 0`);
}

// --- prestige gain (new rebalanced formula) ---
const thresholdState = { lifetimeCash: PRESTIGE_THRESHOLD, prestigePoints: 0 };
const { prestigeGain: pg1 } = await import('./economy.js');
assert.equal(pg1(thresholdState), 1, 'prestige gain 1M with 0 points');

const fourXState = { lifetimeCash: PRESTIGE_THRESHOLD * 10, prestigePoints: 0 };
assert.equal(pg1(fourXState), 2, 'prestige gain 10M with 0 points');

const hundredXState = { lifetimeCash: PRESTIGE_THRESHOLD * 100, prestigePoints: 0 };
assert.equal(pg1(hundredXState), 3, 'prestige gain 100M with 0 points');

// --- nextPrestigeRequirement ---
const { nextPrestigeRequirement: npr } = await import('./economy.js');
assert.equal(npr({ prestigePoints: 0 }), 1_000_000, 'nextPrestigeRequirement 0 points');
assert.equal(npr({ prestigePoints: 1 }), 10_000_000, 'nextPrestigeRequirement 1 point');
assert.equal(npr({ prestigePoints: 2 }), 100_000_000, 'nextPrestigeRequirement 2 points');
assert.equal(npr({ prestigePoints: 400 }), Infinity, 'nextPrestigeRequirement huge points caps to Infinity');

// --- canPrestige with new requirement ---
const { canPrestige: cp } = await import('./economy.js');
assert.equal(cp({ lifetimeCash: Infinity, prestigePoints: 400 }), false, 'canPrestige false when requirement overflows');
assert.equal(cp({ lifetimeCash: 1_000_000, prestigePoints: 0 }), true, 'canPrestige at 1M with 0 points');
assert.equal(cp({ lifetimeCash: 1_000_000, prestigePoints: 1 }), false, 'canPrestige at 1M with 1 point');
assert.equal(cp({ lifetimeCash: 10_000_000, prestigePoints: 1 }), true, 'canPrestige at 10M with 1 point');

// --- prestigeGain edge cases ---
assert.equal(pg1({ lifetimeCash: 1_000_000, prestigePoints: 1 }), 0, 'prestigeGain 1M with 1 point (not eligible)');
assert.equal(pg1({ lifetimeCash: 10_000_000, prestigePoints: 1 }), 1, 'prestigeGain 10M with 1 point');
assert.equal(pg1({ lifetimeCash: 100_000_000, prestigePoints: 1 }), 2, 'prestigeGain 100M with 1 point');
assert.equal(pg1({ lifetimeCash: Infinity, prestigePoints: 400 }), 0, 'prestigeGain infinite edge does not return NaN');

// --- constants ---
assert.equal(PRESTIGE_THRESHOLD, 1_000_000, 'PRESTIGE_THRESHOLD');
assert.equal(PUMP_MULTIPLIER, 10, 'PUMP_MULTIPLIER');
assert.equal(PUMP_DURATION_MS, 3_600_000, 'PUMP_DURATION_MS');

// --- STAFF count ---
assert.ok(STAFF.length >= 12, `STAFF.length >= 12 (got ${STAFF.length})`);

// --- idleSuffix ---
assert.equal(idleSuffix(0), 'K', 'idleSuffix(0) = K');
assert.equal(idleSuffix(10), 'Dc', 'idleSuffix(10) = Dc');
assert.equal(idleSuffix(11), 'aa', 'idleSuffix(11) = aa');
assert.equal(idleSuffix(12), 'ab', 'idleSuffix(12) = ab');
assert.equal(idleSuffix(36), 'az', 'idleSuffix(36) = az');
assert.equal(idleSuffix(37), 'ba', 'idleSuffix(37) = ba');

// --- formatMoneyValue ---
assert.equal(formatMoneyValue(-5), '$0', 'negative -> $0');
assert.equal(formatMoneyValue(NaN), '$0', 'NaN -> $0');
assert.equal(formatMoneyValue(500), '$500', '500 -> $500');
assert.equal(formatMoneyValue(1200), '$1.2K', '1200 -> $1.2K');
assert.equal(formatMoneyValue(1e9), '$1B', '1e9 -> $1B');
assert.equal(formatMoneyValue(1.23e36), '$1.23aa', '1.23e36 -> $1.23aa');
assert.equal(formatMoneyValue(1.23e39), '$1.23ab', '1.23e39 -> $1.23ab');
assert.equal(formatMoneyValue(Infinity), '$∞', 'Infinity formats without hanging');

// rate mode small values
assert.equal(formatMoneyValue(0.2, { rate: true }), '$0.2', 'rate 0.2');
assert.equal(formatMoneyValue(3.5, { rate: true }), '$3.5', 'rate 3.5');
assert.equal(formatMoneyValue(12.3, { rate: true }), '$12.3', 'rate 12.3');
assert.equal(formatMoneyValue(50, { rate: true }), '$50', 'rate 50 integer');

// --- Diamond Hands costFormula='double' ---
const diamondDef = UPGRADES.find(u => u.id === 'clickUpgradeLevel');
assert.equal(diamondDef.costFormula, 'double', 'Diamond Hands has costFormula double');
assert.equal(diamondDef.baseCost, 100, 'Diamond Hands baseCost 100');
assert.equal(upgradeCost(diamondDef, 0), 100, 'Diamond Hands cost level 0 = 100');
assert.equal(upgradeCost(diamondDef, 1), 200, 'Diamond Hands cost level 1 = 200');
assert.equal(upgradeCost(diamondDef, 2), 400, 'Diamond Hands cost level 2 = 400');
assert.equal(upgradeCost(diamondDef, 10), 102400, 'Diamond Hands cost level 10 = 102400');

// Diamond Hands maxAffordableLevels with upgradeDef
const rDH = maxAffordableLevels({ cash: 700, level: 0, maxLevel: 100, baseCost: 100, costGrowth: 1.25, limit: 10, upgradeDef: diamondDef });
// level 0=100, 1=200, 2=400 → sum=700, buys 3
assert.equal(rDH.levels, 3, 'Diamond Hands maxAffordable: buys 3 with 700');
assert.equal(rDH.totalCost, 700, 'Diamond Hands maxAffordable: totalCost 700');
assert.equal(rDH.nextLevel, 3, 'Diamond Hands maxAffordable: nextLevel 3');

// Non-Diamond upgrade still uses generic formula
const bullDef = UPGRADES.find(u => u.id === 'staffUpgradeLevel');
const bullCost = upgradeCost(bullDef, 2);
const bullExpected = levelCost(bullDef.baseCost, bullDef.costGrowth, 2);
assert.equal(bullCost, bullExpected, 'Bull Market Training cost level 2 uses generic formula');

// --- maxAffordableLevels ---

// level 0, limit 1, cash 50: cost=50, can buy 1
const r1 = maxAffordableLevels({ cash: 50, level: 0, maxLevel: 100, baseCost: 50, costGrowth: 1.25, limit: 1 });
assert.equal(r1.levels, 1, 'maxAffordable: level 0 limit 1 buys 1');
assert.equal(r1.totalCost, 50, 'maxAffordable: cost 50');
assert.equal(r1.nextLevel, 1, 'maxAffordable: nextLevel 1');

// level 0, limit 1, cash 25: cost 50 > 25, buys 0
const r2 = maxAffordableLevels({ cash: 25, level: 0, maxLevel: 100, baseCost: 50, costGrowth: 1.25, limit: 1 });
assert.equal(r2.levels, 0, 'maxAffordable: cash 25 buys 0');
assert.equal(r2.totalCost, 0, 'maxAffordable: no cost');

// level 0, cash 50+62+156=268, limit 10: buys 3 levels (cost 50,62,156)
const r3 = maxAffordableLevels({ cash: 268, level: 0, maxLevel: 100, baseCost: 50, costGrowth: 1.25, limit: 10 });
assert.equal(r3.levels, 3, 'maxAffordable: buys 3 with 268');
assert.equal(r3.totalCost, 268, 'maxAffordable: total cost 268');
assert.equal(r3.nextLevel, 3, 'maxAffordable: nextLevel 3');

// level 0, cash 268, limit 2: buys 2 (cost 50+62=112)
const r4 = maxAffordableLevels({ cash: 268, level: 0, maxLevel: 100, baseCost: 50, costGrowth: 1.25, limit: 2 });
assert.equal(r4.levels, 2, 'maxAffordable: limit 2 buys 2');
assert.equal(r4.totalCost, 112, 'maxAffordable: total cost 112');
assert.equal(r4.nextLevel, 2, 'maxAffordable: nextLevel 2');

// maxLevel cap: level 99, maxLevel 100, huge cash, limit Infinity buys 1
const r5 = maxAffordableLevels({ cash: 1e15, level: 99, maxLevel: 100, baseCost: 50, costGrowth: 1.25, limit: Infinity });
assert.equal(r5.levels, 1, 'maxAffordable: maxLevel cap buys 1');
assert.equal(r5.nextLevel, 100, 'maxAffordable: nextLevel hits maxLevel');

// --- STAFF maxCount ---
assert.ok(STAFF.every(s => s.maxCount === 500), 'all STAFF have maxCount 500');

// --- maxAffordableStaff ---

// cash 25, count 0, limit 1: buys 1, cost 25, nextCount 1
const ms1 = maxAffordableStaff({ cash: 25, count: 0, maxCount: 500, baseCost: 25, costGrowth: 1.25, limit: 1 });
assert.equal(ms1.count, 1, 'maxAffordableStaff: buys 1');
assert.equal(ms1.totalCost, 25, 'maxAffordableStaff: cost 25');
assert.equal(ms1.nextCount, 1, 'maxAffordableStaff: nextCount 1');

// cash 10, count 0, limit 1: buys 0
const ms2 = maxAffordableStaff({ cash: 10, count: 0, maxCount: 500, baseCost: 25, costGrowth: 1.25, limit: 1 });
assert.equal(ms2.count, 0, 'maxAffordableStaff: cash 10 buys 0');
assert.equal(ms2.totalCost, 0, 'maxAffordableStaff: no cost');

// cash 25+31+78=134, limit 10: buys 3, totalCost 134, nextCount 3
const ms3 = maxAffordableStaff({ cash: 134, count: 0, maxCount: 500, baseCost: 25, costGrowth: 1.25, limit: 10 });
assert.equal(ms3.count, 3, 'maxAffordableStaff: limit 10 buys 3');
assert.equal(ms3.totalCost, 134, 'maxAffordableStaff: totalCost 134');
assert.equal(ms3.nextCount, 3, 'maxAffordableStaff: nextCount 3');

// same cash 134, limit 2: buys 2, totalCost 56, nextCount 2
const ms4 = maxAffordableStaff({ cash: 134, count: 0, maxCount: 500, baseCost: 25, costGrowth: 1.25, limit: 2 });
assert.equal(ms4.count, 2, 'maxAffordableStaff: limit 2 buys 2');
assert.equal(ms4.totalCost, 56, 'maxAffordableStaff: totalCost 56');
assert.equal(ms4.nextCount, 2, 'maxAffordableStaff: nextCount 2');

// count 499, maxCount 500, huge cash, limit Infinity: buys 1 only
const ms5 = maxAffordableStaff({ cash: 1e60, count: 499, maxCount: 500, baseCost: 25, costGrowth: 1.25, limit: Infinity });
assert.equal(ms5.count, 1, 'maxAffordableStaff: maxCount cap buys 1');
assert.equal(ms5.nextCount, 500, 'maxAffordableStaff: nextCount hits 500');

console.log('ok');
