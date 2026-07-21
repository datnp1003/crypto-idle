import assert from 'node:assert/strict';

let mockResponses = [];
let fetchCalls = [];

globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, opts });
  const resp = mockResponses.shift();
  if (!resp) return { ok: false, status: 404, json: async () => ({}) };
  return resp;
};

function ok(body) {
  return { ok: true, status: 200, json: async () => body };
}
function notOk(status) {
  return { ok: false, status };
}

const mod = await import('./cloud-save.js');
const { getMe, login, register, logout, fetchSave, pushSave, isLoggedIn, getEmail } = mod;

// --- getMe happy path ---
fetchCalls = [];
mockResponses = [ok({ id: 1, email: 'a@b.com' })];
const me = await getMe();
assert.deepEqual(me, { id: 1, email: 'a@b.com' });
assert.equal(fetchCalls.length, 1);
assert.ok(fetchCalls[0].url.endsWith('/me'));
assert.equal(fetchCalls[0].opts.credentials, 'include');

// --- getMe 401 ---
mockResponses = [notOk(401)];
assert.equal(await getMe(), null);

// --- getMe network error ---
mockResponses = [];
// apiFetch catches errors, returns null
assert.equal(await getMe(), null);

// --- login happy ---
mockResponses = [ok({ id: 2, email: 'x@y.com' })];
const lr = await login('x@y.com', 'pw');
assert.deepEqual(lr, { id: 2, email: 'x@y.com' });
assert.ok(isLoggedIn());
assert.equal(getEmail(), 'x@y.com');

// --- login 401 ---
mockResponses = [notOk(401)];
assert.equal(await login('bad@b.com', 'wrong'), null);
assert.ok(isLoggedIn()); // still logged in from previous success

// --- register happy ---
mockResponses = [ok({ id: 3, email: 'n@ew.com' })];
const rr = await register('n@ew.com', 'pw');
assert.deepEqual(rr, { id: 3, email: 'n@ew.com' });
assert.equal(getEmail(), 'n@ew.com');

// --- register fail ---
mockResponses = [notOk(409)];
assert.equal(await register('dup@x.com', 'pw'), null);

// --- logout ---
mockResponses = [ok({ ok: true })];
assert.equal(await logout(), true);
assert.equal(isLoggedIn(), false);
assert.equal(getEmail(), null);

// --- fetchSave happy ---
mockResponses = [ok({ save: { cash: 500 }, updatedAt: '2024-01-01' })];
const fs = await fetchSave();
assert.equal(fs.save.cash, 500);
assert.equal(fetchCalls[fetchCalls.length - 1].url.endsWith('/save'), true);
assert.equal(fetchCalls[fetchCalls.length - 1].opts.method, undefined); // GET

// --- fetchSave 401 → guest ---
mockResponses = [notOk(401)];
const fs401 = await fetchSave();
assert.deepEqual(fs401, { guest: true });

// --- fetchSave null (network) ---
mockResponses = [];
assert.equal(await fetchSave(), null);

// --- pushSave happy ---
fetchCalls = [];
mockResponses = [ok({ save: { cash: 999 }, updatedAt: '2024-02-02' })];
const ps = await pushSave({ cash: 999 });
assert.equal(ps.save.cash, 999);
assert.equal(fetchCalls[fetchCalls.length - 1].opts.method, 'PUT');
assert.ok(typeof fetchCalls[fetchCalls.length - 1].opts.body === 'string');

// --- pushSave 401 → guest ---
mockResponses = [notOk(401)];
assert.deepEqual(await pushSave({ cash: 1 }), { guest: true });

// --- pushSave network → null ---
mockResponses = [];
assert.equal(await pushSave({}), null);

// --- no-fetch guest fallback ---
const origFetch = globalThis.fetch;
delete globalThis.fetch;

assert.equal(await getMe(), null);
assert.equal(await login('a@b.com', 'p'), null);
assert.equal(await register('a@b.com', 'p'), null);
assert.equal(await fetchSave(), null);
assert.equal(await pushSave({}), null);
assert.equal(await logout(), false);

globalThis.fetch = origFetch;

console.log('ok');
