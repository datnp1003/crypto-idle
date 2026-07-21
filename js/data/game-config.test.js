import assert from 'node:assert/strict';
import { STAFF, UPGRADES, SETTINGS, loadGameConfig } from './game-config.js';
import { STAFF as STATIC_STAFF, UPGRADES as STATIC_UPGRADES } from './crypto-staff.js';

// --- Initial values match static fallback ---
assert.ok(Array.isArray(STAFF), 'STAFF is array');
assert.ok(Array.isArray(UPGRADES), 'UPGRADES is array');
assert.equal(STAFF.length, STATIC_STAFF.length, 'STAFF length matches fallback');
assert.equal(UPGRADES.length, STATIC_UPGRADES.length, 'UPGRADES length matches fallback');

for (let i = 0; i < STATIC_STAFF.length; i++) {
  assert.deepEqual(STAFF[i], STATIC_STAFF[i], `STAFF[${i}] matches fallback`);
}
for (let i = 0; i < STATIC_UPGRADES.length; i++) {
  assert.deepEqual(UPGRADES[i], STATIC_UPGRADES[i], `UPGRADES[${i}] matches fallback`);
}

// --- SETTINGS has expected keys ---
assert.equal(SETTINGS.prestigeThreshold, 1_000_000, 'default prestigeThreshold');
assert.equal(SETTINGS.pumpMultiplier, 10, 'default pumpMultiplier');
assert.equal(SETTINGS.pumpDurationMs, 3_600_000, 'default pumpDurationMs');

// --- loadGameConfig with mock fetch succeeds ---
const mockStaff = [
  { id: 'intern', name: 'API Intern', baseCost: 25, baseProfit: 0.3, costGrowth: 1.25, maxCount: 500 },
];
const mockUpgrades = [
  { id: 'clickUpgradeLevel', name: 'API Diamond', baseCost: 100, costGrowth: 1.25, costFormula: 'double', maxLevel: 100, description: 'API desc' },
];
const mockSettings = { prestigeThreshold: 500_000, pumpDurationMs: 1800_000 };

function mockFetch(url) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ staff: mockStaff, upgrades: mockUpgrades, settings: mockSettings }),
  });
}

const loaded = await loadGameConfig(mockFetch);
assert.equal(loaded, true, 'loadGameConfig returns true on success');
assert.equal(STAFF.length, 1, 'STAFF updated to API data');
assert.equal(STAFF[0].name, 'API Intern', 'STAFF name from API');
assert.equal(STAFF[0].baseProfit, 0.3, 'STAFF baseProfit from API');
assert.equal(UPGRADES.length, 1, 'UPGRADES updated to API data');
assert.equal(UPGRADES[0].name, 'API Diamond', 'UPGRADES name from API');
assert.equal(SETTINGS.prestigeThreshold, 500_000, 'SETTINGS updated from API');
assert.equal(SETTINGS.pumpDurationMs, 1800_000, 'SETTINGS pumpDurationMs updated');

// --- loadGameConfig falls back on fetch error ---
function failFetch() { return Promise.reject(new Error('network')); }

const result = await loadGameConfig(failFetch);
assert.equal(result, false, 'loadGameConfig returns false on fetch error');
// STAFF/UPGRADES should still be the last successful values (API data from above)
assert.equal(STAFF.length, 1, 'STAFF unchanged after fetch error');

// --- loadGameConfig falls back on non-ok response ---
function notOkFetch() { return Promise.resolve({ ok: false, status: 500 }); }

const result2 = await loadGameConfig(notOkFetch);
assert.equal(result2, false, 'loadGameConfig returns false on non-ok response');

// --- loadGameConfig falls back when no fetch ---
async function testNoFetch() {
  // Temporarily remove fetch from globalThis
  const orig = globalThis.fetch;
  delete globalThis.fetch;
  const result3 = await loadGameConfig();
  assert.equal(result3, false, 'loadGameConfig returns false when no fetch');
  globalThis.fetch = orig;
}
await testNoFetch();

// --- loadGameConfig handles empty arrays gracefully (keeps existing data) ---
function emptyStaffFetch() {
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ staff: [], upgrades: [] }) });
}
const result4 = await loadGameConfig(emptyStaffFetch);
assert.equal(result4, true, 'loadGameConfig returns true even with empty arrays');
// Should keep previous API data since empty arrays are filtered out
assert.equal(STAFF.length, 1, 'STAFF keeps previous data when empty array received');

// --- STAFF/UPGRADES are live bindings (reassignment propagates) ---
function restoreFetch() {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ staff: STATIC_STAFF, upgrades: STATIC_UPGRADES, settings: { prestigeThreshold: 1_000_000, pumpDurationMs: 3_600_000 } }),
  });
}
await loadGameConfig(restoreFetch);
assert.equal(STAFF.length, STATIC_STAFF.length, 'STAFF restored to fallback after restore');
assert.equal(UPGRADES.length, STATIC_UPGRADES.length, 'UPGRADES restored to fallback after restore');

console.log('ok');
