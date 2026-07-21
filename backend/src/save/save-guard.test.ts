import { BadRequestException } from '@nestjs/common';
import { sanitizeAndValidateSave, GuardConfig } from './save-guard';

const STAFF_DEFS = [
  { id: 'intern', baseProfit: 0.2, maxCount: 500 },
  { id: 'trader', baseProfit: 2, maxCount: 500 },
  { id: 'miner', baseProfit: 20, maxCount: 500 },
  { id: 'quant', baseProfit: 250, maxCount: 500 },
];

const UPGRADE_DEFS = [
  { id: 'clickUpgradeLevel', maxLevel: 100 },
  { id: 'staffUpgradeLevel', maxLevel: 100 },
  { id: 'automationLevel', maxLevel: 100 },
  { id: 'pumpLuckLevel', maxLevel: 100 },
  { id: 'offlineLevel', maxLevel: 100 },
  { id: 'prestigeBoostLevel', maxLevel: 100 },
  { id: 'staffDiscountLevel', maxLevel: 100 },
  { id: 'megaHashLevel', maxLevel: 100 },
];

const CONFIG: GuardConfig = {
  staffDefs: STAFF_DEFS,
  upgradeDefs: UPGRADE_DEFS,
  pumpMultiplier: 10,
};

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

function assertThrows(fn: () => any, msg: string) {
  try {
    fn();
    console.error(`FAIL: expected exception but none thrown — ${msg}`);
    process.exit(1);
  } catch (e) {
    if (!(e instanceof BadRequestException)) {
      console.error(`FAIL: expected BadRequestException but got ${e} — ${msg}`);
      process.exit(1);
    }
  }
}

let passed = 0;

function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('save-guard.test.ts\n');

// --- Reject non-object / array / primitive ---
console.log('Rejection tests:');
test('rejects null', () => {
  assertThrows(() => sanitizeAndValidateSave(null, null, null, CONFIG, Date.now()), 'null');
});
test('rejects array', () => {
  assertThrows(() => sanitizeAndValidateSave(null, null, [], CONFIG, Date.now()), 'array');
});
test('rejects primitive number', () => {
  assertThrows(() => sanitizeAndValidateSave(null, null, 123, CONFIG, Date.now()), 'number');
});
test('rejects primitive string', () => {
  assertThrows(() => sanitizeAndValidateSave(null, null, 'abc', CONFIG, Date.now()), 'string');
});
test('rejects primitive boolean', () => {
  assertThrows(() => sanitizeAndValidateSave(null, null, true, CONFIG, Date.now()), 'boolean');
});

// --- NaN / Infinity / negative numeric coerce ---
console.log('\nNumeric sanitization:');
test('NaN cash becomes 0', () => {
  const { save } = sanitizeAndValidateSave(null, null, { cash: NaN }, CONFIG, Date.now());
  assert(save.cash === 0, `expected 0 got ${save.cash}`);
});
test('Infinity cash becomes 0', () => {
  const { save } = sanitizeAndValidateSave(null, null, { cash: Infinity }, CONFIG, Date.now());
  assert(save.cash === 0, `expected 0 got ${save.cash}`);
});
test('negative cash becomes 0', () => {
  const { save } = sanitizeAndValidateSave(null, null, { cash: -100 }, CONFIG, Date.now());
  assert(save.cash === 0, `expected 0 got ${save.cash}`);
});
test('string cash "500" coerced to 500', () => {
  const { save } = sanitizeAndValidateSave(null, null, { cash: '500' }, CONFIG, Date.now());
  assert(save.cash === 500, `expected 500 got ${save.cash}`);
});
test('non-numeric string cash becomes 0', () => {
  const { save } = sanitizeAndValidateSave(null, null, { cash: 'abc' }, CONFIG, Date.now());
  assert(save.cash === 0, `expected 0 got ${save.cash}`);
});

// --- Staff counts clamp ---
console.log('\nStaff clamping:');
test('staff counts clamped to maxCount', () => {
  const { save } = sanitizeAndValidateSave(null, null, { staff: { intern: 9999 } }, CONFIG, Date.now());
  assert(save.staff.intern === 500, `expected 500 got ${save.staff.intern}`);
});
test('negative staff becomes 0', () => {
  const { save } = sanitizeAndValidateSave(null, null, { staff: { intern: -10 } }, CONFIG, Date.now());
  assert(save.staff.intern === 0, `expected 0 got ${save.staff.intern}`);
});
test('unknown staff ids dropped', () => {
  const { save } = sanitizeAndValidateSave(null, null, { staff: { hacker: 5, intern: 1 } }, CONFIG, Date.now());
  assert(!('hacker' in save.staff), 'hacker should not exist');
  assert(save.staff.intern === 1, `expected 1 got ${save.staff.intern}`);
});
test('fractional staff floored', () => {
  const { save } = sanitizeAndValidateSave(null, null, { staff: { intern: 2.7 } }, CONFIG, Date.now());
  assert(save.staff.intern === 2, `expected 2 got ${save.staff.intern}`);
});

// --- Upgrade level clamping ---
console.log('\nUpgrade level clamping:');
test('upgrade levels clamped to maxLevel', () => {
  const { save } = sanitizeAndValidateSave(null, null, { clickUpgradeLevel: 999 }, CONFIG, Date.now());
  assert(save.clickUpgradeLevel === 100, `expected 100 got ${save.clickUpgradeLevel}`);
});
test('negative upgrade becomes 0', () => {
  const { save } = sanitizeAndValidateSave(null, null, { clickUpgradeLevel: -5 }, CONFIG, Date.now());
  assert(save.clickUpgradeLevel === 0, `expected 0 got ${save.clickUpgradeLevel}`);
});
test('missing upgrades default to 0', () => {
  const { save } = sanitizeAndValidateSave(null, null, {}, CONFIG, Date.now());
  assert(save.clickUpgradeLevel === 0, `expected 0 got ${save.clickUpgradeLevel}`);
  assert(save.staffUpgradeLevel === 0, `expected 0 got ${save.staffUpgradeLevel}`);
});

// --- Monotonic ---
console.log('\nMonotonic enforcement:');
test('prestige cannot decrease', () => {
  const prev = { cash: 1000, lifetimeCash: 5000, prestigePoints: 5, staff: {}, eventUntil: 0 };
  const { save } = sanitizeAndValidateSave(prev, new Date(1000), {
    cash: 1000, lifetimeCash: 5000, prestigePoints: 2,
  }, CONFIG, 2000);
  assert(save.prestigePoints === 5, `expected 5 got ${save.prestigePoints}`);
});
test('lifetimeCash cannot decrease', () => {
  const prev = { cash: 1000, lifetimeCash: 5000, prestigePoints: 0, staff: {}, eventUntil: 0 };
  const { save } = sanitizeAndValidateSave(prev, new Date(1000), {
    cash: 1000, lifetimeCash: 2000, prestigePoints: 0,
  }, CONFIG, 2000);
  assert(save.lifetimeCash === 5000, `expected 5000 got ${save.lifetimeCash}`);
});
test('cash CAN decrease (spending)', () => {
  const prev = { cash: 5000, lifetimeCash: 10000, prestigePoints: 0, staff: {}, eventUntil: 0 };
  const { save } = sanitizeAndValidateSave(prev, new Date(1000), {
    cash: 100, lifetimeCash: 10000, prestigePoints: 0,
  }, CONFIG, 2000);
  assert(save.cash === 100, `expected 100 got ${save.cash}`);
});
test('prestige increase allowed', () => {
  const prev = { cash: 1000, lifetimeCash: 5000, prestigePoints: 5, staff: {}, eventUntil: 0 };
  const { save } = sanitizeAndValidateSave(prev, new Date(1000), {
    cash: 1000, lifetimeCash: 5000, prestigePoints: 6,
  }, CONFIG, 2000);
  assert(save.prestigePoints === 6, `expected 6 got ${save.prestigePoints}`);
});

// --- Rate cap ---
console.log('\nRate cap:');
test('absurd cash jump clamped with small elapsed', () => {
  const prev = {
    cash: 1000, lifetimeCash: 1000, prestigePoints: 0,
    staff: { intern: 1 }, eventUntil: 0,
    staffUpgradeLevel: 0, automationLevel: 0,
  };
  const prevUpdatedAt = new Date(1000);
  const now = 2000;
  const { save } = sanitizeAndValidateSave(prev, prevUpdatedAt, {
    cash: 100_000_000, lifetimeCash: 100_000_000, prestigePoints: 0,
    staff: { intern: 1 }, eventUntil: 0,
  }, CONFIG, now);
  assert(save.cash < 100_000_000, `should be clamped below 1e8, got ${save.cash}`);
  assert(save.cash > 0, `should be > 0, got ${save.cash}`);
  console.log(`    (clamped to ${save.cash})`);
});
test('legit small gain passes unchanged', () => {
  const prev = {
    cash: 1000, lifetimeCash: 1000, prestigePoints: 0,
    staff: { intern: 5 }, eventUntil: 0,
    staffUpgradeLevel: 0, automationLevel: 0,
  };
  const prevUpdatedAt = new Date(1000);
  const now = 2000;
  const { save } = sanitizeAndValidateSave(prev, prevUpdatedAt, {
    cash: 1001, lifetimeCash: 1001, prestigePoints: 0,
    staff: { intern: 5 }, eventUntil: 0,
  }, CONFIG, now);
  assert(save.cash === 1001, `expected 1001 got ${save.cash}`);
});
test('large elapsed allows large gain', () => {
  const prev = {
    cash: 1000, lifetimeCash: 1000, prestigePoints: 0,
    staff: { trader: 10 }, eventUntil: 0,
    staffUpgradeLevel: 0, automationLevel: 0,
  };
  const prevUpdatedAt = new Date(0);
  const now = 50_000_000;
  const { save } = sanitizeAndValidateSave(prev, prevUpdatedAt, {
    cash: 2_000_000, lifetimeCash: 2_000_000, prestigePoints: 0,
    staff: { trader: 10 }, eventUntil: 0,
  }, CONFIG, now);
  assert(save.cash === 2_000_000, `expected 2_000_000 got ${save.cash}`);
});
test('no prev save allows any amount', () => {
  const { save } = sanitizeAndValidateSave(null, null, {
    cash: 999_999_999, lifetimeCash: 999_999_999, prestigePoints: 0,
  }, CONFIG, Date.now());
  assert(save.cash === 999_999_999, `expected 999_999_999 got ${save.cash}`);
});
test('rate cap with pump event multiplies allowed gain', () => {
  const future = Date.now() + 100000;
  const prev = {
    cash: 1000, lifetimeCash: 1000, prestigePoints: 0,
    staff: { intern: 10 }, eventUntil: future,
    staffUpgradeLevel: 0, automationLevel: 0,
  };
  const prevUpdatedAt = new Date(Date.now() - 5000);
  const { save } = sanitizeAndValidateSave(prev, prevUpdatedAt, {
    cash: 100_000, lifetimeCash: 100_000, prestigePoints: 0,
    staff: { intern: 10 }, eventUntil: future,
  }, CONFIG, Date.now());
  assert(save.cash === 100_000, `pump allows large gain, expected 100_000 got ${save.cash}`);
});

// --- Unknown fields dropped ---
console.log('\nField filtering:');
test('unknown fields are not included in clean save', () => {
  const { save } = sanitizeAndValidateSave(null, null, {
    cash: 100, hackerField: 999, cheatFlag: true,
  }, CONFIG, Date.now());
  assert(!('hackerField' in save), 'hackerField should be dropped');
  assert(!('cheatFlag' in save), 'cheatFlag should be dropped');
  assert(save.cash === 100, `expected 100 got ${save.cash}`);
});

console.log(`\nAll ${passed} tests passed.`);
