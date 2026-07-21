/**
 * js/ui/crypto-screen.js
 *
 * Crypto Idle — single-screen UI controller.
 * Depends on core APIs (game-state, idle, economy, crypto-staff).
 * Degrades gracefully when core is not yet wired.
 */

import { gameState }   from '../core/game-state.js';
import { idle }        from '../core/idle.js';
import { STAFF, UPGRADES } from '../data/game-config.js';
import {
  clickValue,
  staffCost,
  upgradeCost,
  profitPerSecond,
  prestigeMultiplier,
  prestigeGain,
  canPrestige,
  nextPrestigeRequirement,
  activeEventMultiplier,
  maxAffordableLevels,
} from '../core/economy.js';
import { formatMoneyValue } from '../data/number-format.js';

/* ── Money formatter ──────────────────────────────────────────────── */
/**
 * Compact dollar formatter — delegates to formatMoneyValue.
 * @param {number} n
 * @returns {string}
 */
function fmt(n) { return formatMoneyValue(n); }

/**
 * Rate formatter for profit/s display — delegates to formatMoneyValue.
 * @param {number} n
 * @returns {string}
 */
function fmtRate(n) { return formatMoneyValue(n, { rate: true }); }

/**
 * Format seconds as  "2h 34m" / "45m" / "12s".
 * @param {number} ms  Milliseconds
 * @returns {string}
 */
function fmtTime(ms) {
  const s = Math.ceil(ms / 1000);
  if (s >= 3600) return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
  if (s >= 60)   return Math.floor(s / 60) + 'm';
  return s + 's';
}

/* ── State helpers ────────────────────────────────────────────────── */
/**
 * Read live state from gameState — works whether core exposes
 * .state directly or uses get() only.
 * @returns {object}
 */
function currentState() {
  // Prefer direct .state property (present in current core)
  if (gameState.state && typeof gameState.state === 'object') {
    return gameState.state;
  }
  // Fallback: reconstruct from getters if .state is private
  return {
    cash:               gameState.get('cash')               ?? 0,
    lifetimeCash:       gameState.get('lifetimeCash')       ?? 0,
    clickUpgradeLevel:  gameState.get('clickUpgradeLevel')  ?? 0,
    staffUpgradeLevel:  gameState.get('staffUpgradeLevel')  ?? 0,
    automationLevel:    gameState.get('automationLevel')    ?? 0,
    staff:              gameState.get('staff')              ?? {},
    prestigePoints:     gameState.get('prestigePoints')     ?? 0,
    eventUntil:         gameState.get('eventUntil')         ?? 0,
    lastOnlineTime:     gameState.get('lastOnlineTime')     ?? 0,
  };
}

/* ── Emoji map for staff ──────────────────────────────────────────── */
const STAFF_ICONS = {
  intern:    '🎓',
  trader:    '📊',
  miner:     '⛏️',
  quant:     '🤖',
  node:      '🖥️',
  defi:      '🌾',
  nft:       '🖼️',
  exchange:  '🏦',
  whale:     '🐋',
  launchpad: '🚀',
  hedge:     '💼',
  chain:     '⛓️',
};

const UPGRADE_ICONS = {
  clickUpgradeLevel: '💎',
  staffUpgradeLevel: '📈',
  automationLevel:   '⚙️',
};

/* ── Staff buy-mode global state ──────────────────────────────────── */
/**
 * Global staff buy multiplier mode.
 * Values: 1 (×1), 10 (×10), Infinity (MAX).
 * Applied to ALL staff buy buttons simultaneously.
 * @type {number}
 */
let _staffBuyMode = 1;

/** Staff max count — core will add maxCount per def; fallback = 500. */
const STAFF_MAX_COUNT = 500;

/**
 * Local read-only fallback: compute how many of a staff type can be
 * afforded up to `limit`, capped at STAFF_MAX_COUNT.
 * Uses the same staffCost loop as core — pure calculation, no side effects.
 *
 * @param {object} state
 * @param {object} def      - staff definition
 * @param {number} limit    - max to buy (1, 10, or Infinity)
 * @returns {{ count: number, totalCost: number }}
 */
function _maxAffordableStaff(state, def, limit) {
  // Use core helper if available (future-proof)
  if (typeof gameState.maxAffordableStaff === 'function') {
    return gameState.maxAffordableStaff(def, limit);
  }
  const owned   = (state.staff && state.staff[def.id]) || 0;
  const maxCount = (def.maxCount != null) ? def.maxCount : STAFF_MAX_COUNT;
  const cap     = Math.min(limit === Infinity ? maxCount : limit, maxCount - owned);
  let totalCost = 0;
  let count     = 0;
  let current   = owned;
  while (count < cap) {
    const cost = staffCost(def, current);
    if (totalCost + cost > state.cash) break;
    totalCost += cost;
    current++;
    count++;
  }
  return { count, totalCost };
}

/**
 * Execute a staff purchase using the selected buy mode.
 * Delegates to gameState.buyStaffCount (bulk) when available;
 * falls back to repeated buyStaff calls for compatibility.
 *
 * @param {object} def   - staff definition
 * @param {number} n     - number to buy (from _maxAffordableStaff)
 * @param {HTMLButtonElement} btn
 */
function _doBuyStaff(def, n, btn) {
  if (n <= 0) { flashBtn(btn); return; }
  if (typeof gameState.buyStaffCount === 'function') {
    const ok = gameState.buyStaffCount(def, n);
    if (!ok) flashBtn(btn);
  } else if (typeof gameState.buyStaff === 'function') {
    // Fallback: buy one at a time (x1 always works; bulk degrades gracefully)
    let bought = 0;
    for (let i = 0; i < n; i++) {
      if (!gameState.buyStaff(def)) break;
      bought++;
    }
    if (bought === 0) flashBtn(btn);
  } else {
    console.warn('[crypto-screen] gameState.buyStaff(Count) not available');
    btn.disabled = true;
  }
}

/* ── DOM cache ────────────────────────────────────────────────────── */
let _els = null;

function getEls() {
  if (_els) return _els;
  _els = {
    cash:            document.getElementById('cash'),
    profitRate:      document.getElementById('profit-rate'),
    clickValueEl:    document.getElementById('click-value'),
    clickValueHint:  document.getElementById('click-value-hint'),
    prestigeMult:    document.getElementById('prestige-multiplier'),
    pumpStatus:      document.getElementById('pump-status'),
    staffList:       document.getElementById('staff-list'),
    upgradeList:     document.getElementById('upgrade-list'),
    prestigeBtn:     document.getElementById('prestige-reset'),
    claimOffline:    document.getElementById('claim-offline'),
    tradeClick:      document.getElementById('trade-click'),
  };
  return _els;
}

/* ── Tab navigation ───────────────────────────────────────────────── */
/**
 * Wire up Staff / Upgrades tab switching.
 * Uses DOM classes only — no router.
 */
function initTabs() {
  const tabStaff    = document.getElementById('tab-staff');
  const tabUpgrades = document.getElementById('tab-upgrades');
  const panelStaff  = document.getElementById('panel-staff');
  const panelUpgrades = document.getElementById('panel-upgrades');

  if (!tabStaff || !tabUpgrades || !panelStaff || !panelUpgrades) return;

  function activate(tab) {
    const isStaff = tab === 'staff';
    tabStaff.classList.toggle('active',    isStaff);
    tabUpgrades.classList.toggle('active', !isStaff);
    tabStaff.setAttribute('aria-selected',    String(isStaff));
    tabUpgrades.setAttribute('aria-selected', String(!isStaff));
    panelStaff.classList.toggle('hidden',    !isStaff);
    panelUpgrades.classList.toggle('hidden', isStaff);
  }

  tabStaff.addEventListener('click',    () => activate('staff'));
  tabUpgrades.addEventListener('click', () => activate('upgrades'));

  // Default: staff tab active
  activate('staff');
}

/* ── Staff section header: inject segmented control ──────────────── */
/**
 * Inject the ×1 / ×10 / MAX segmented control into the Staff section
 * heading row (runs once on first render; idempotent).
 */
function ensureStaffModeControl() {
  const heading = document.getElementById('staff-heading');
  if (!heading || heading.querySelector('.staff-mode-group')) return; // already injected

  const group = document.createElement('div');
  group.className = 'staff-mode-group';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Staff buy quantity');

  const modes = [
    { label: '×1',  value: 1,        cls: 'smode-x1'  },
    { label: '×10', value: 10,       cls: 'smode-x10' },
    { label: 'MAX', value: Infinity, cls: 'smode-max' },
  ];

  modes.forEach(({ label, value, cls }) => {
    const btn = document.createElement('button');
    btn.className = 'staff-mode-btn ' + cls;
    btn.textContent = label;
    btn.dataset.modeValue = value === Infinity ? 'Infinity' : String(value);
    btn.setAttribute('aria-pressed', String(_staffBuyMode === value));
    btn.addEventListener('click', () => {
      _staffBuyMode = value;
      // Update pressed state on all sibling buttons
      group.querySelectorAll('.staff-mode-btn').forEach(b => {
        const bVal = b.dataset.modeValue === 'Infinity' ? Infinity : Number(b.dataset.modeValue);
        const active = bVal === _staffBuyMode;
        b.setAttribute('aria-pressed', String(active));
        b.classList.toggle('active', active);
      });
      // Re-render staff to update all buy button labels immediately
      try { renderStaff(currentState()); } catch (_) {}
    });
    group.appendChild(btn);
  });

  heading.appendChild(group);

  // Set initial active state
  _syncStaffModeButtons(group);
}

/**
 * Sync aria-pressed / .active class on all staff mode buttons.
 * @param {HTMLElement} group
 */
function _syncStaffModeButtons(group) {
  group.querySelectorAll('.staff-mode-btn').forEach(btn => {
    const val = btn.dataset.modeValue === 'Infinity' ? Infinity : Number(btn.dataset.modeValue);
    const active = val === _staffBuyMode;
    btn.setAttribute('aria-pressed', String(active));
    btn.classList.toggle('active', active);
  });
}

/* ── Render staff section ─────────────────────────────────────────── */
function renderStaff(state) {
  const { staffList } = getEls();
  if (!staffList) return;

  // Ensure the segmented control exists in the heading
  ensureStaffModeControl();

  // Build diff-friendly map of existing cards
  const existingCards = {};
  staffList.querySelectorAll('[data-staff-id]').forEach(el => {
    existingCards[el.dataset.staffId] = el;
  });

  STAFF.forEach(def => {
    const owned    = (state.staff && state.staff[def.id]) || 0;
    const maxCount = (def.maxCount != null) ? def.maxCount : STAFF_MAX_COUNT;
    const atMax    = owned >= maxCount;
    const pps      = owned * def.baseProfit;

    let card = existingCards[def.id];
    if (!card) {
      // Create fresh card
      card = document.createElement('div');
      card.className = 'staff-card';
      card.setAttribute('data-staff-id', def.id);
      card.setAttribute('role', 'listitem');

      const icon = document.createElement('div');
      icon.className = 'staff-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = STAFF_ICONS[def.id] || '👤';

      const info = document.createElement('div');
      info.className = 'staff-info';

      // Name row: name + inline count pill
      const nameRow = document.createElement('div');
      nameRow.className = 'staff-name-row';

      const name = document.createElement('span');
      name.className = 'staff-name';
      name.textContent = def.name;

      const countPill = document.createElement('span');
      countPill.className = 'staff-count-pill';
      countPill.dataset.role = 'count';
      countPill.setAttribute('aria-label', `Owned: ${owned} / ${maxCount}`);

      nameRow.append(name, countPill);

      const meta = document.createElement('div');
      meta.className = 'staff-meta';

      const profitSpan = document.createElement('span');
      profitSpan.className = 'green';
      profitSpan.dataset.role = 'profit';

      const costSpan = document.createElement('span');
      costSpan.dataset.role = 'cost';

      meta.append(profitSpan, costSpan);
      info.append(nameRow, meta);

      const btn = document.createElement('button');
      btn.className = 'buy-btn';
      btn.dataset.role = 'buy';
      btn.addEventListener('click', () => {
        const s   = currentState();
        const res = _maxAffordableStaff(s, def, _staffBuyMode);
        _doBuyStaff(def, res.count, btn);
      });

      card.append(icon, info, btn);
      staffList.appendChild(card);
    }

    // Update dynamic parts
    const profitSpan = card.querySelector('[data-role="profit"]');
    const costSpan   = card.querySelector('[data-role="cost"]');
    const countPill  = card.querySelector('[data-role="count"]');
    const btn        = card.querySelector('[data-role="buy"]');

    if (profitSpan) profitSpan.textContent = fmtRate(pps) + '/s';

    // cost span always shows next-single-cost for reference
    const nextCost = staffCost(def, owned);
    if (costSpan) costSpan.textContent = 'Next: ' + fmt(nextCost);

    // Inline count pill: "11/500"
    if (countPill) {
      countPill.textContent = owned + '/' + maxCount;
      countPill.setAttribute('aria-label', `Owned: ${owned} / ${maxCount}`);
    }

    // Buy button — label and disabled state depend on _staffBuyMode
    if (btn) {
      if (atMax) {
        btn.textContent = 'MAX';
        btn.disabled    = true;
        btn.setAttribute('aria-label', `${def.name} — max staff reached (${maxCount})`);
      } else {
        const res = _maxAffordableStaff(state, def, _staffBuyMode);
        const n   = res.count;

        if (_staffBuyMode === 1) {
          // x1 mode: show next single cost
          btn.textContent = fmt(nextCost);
          btn.disabled    = n === 0;
          btn.setAttribute('aria-label',
            n > 0
              ? `Hire 1 ${def.name} for ${fmt(nextCost)}`
              : `Cannot afford ${def.name}`);
        } else if (_staffBuyMode === 10) {
          // x10 mode: show ×N $total
          if (n > 0) {
            btn.textContent = `×${n} ${fmt(res.totalCost)}`;
            btn.disabled    = false;
            btn.setAttribute('aria-label',
              `Hire ${n} ${def.name} for ${fmt(res.totalCost)}`);
          } else {
            btn.textContent = '×10';
            btn.disabled    = true;
            btn.setAttribute('aria-label', `Cannot afford any ${def.name}`);
          }
        } else {
          // MAX mode
          if (n > 0) {
            btn.textContent = `MAX +${n}`;
            btn.disabled    = false;
            btn.setAttribute('aria-label',
              `Hire ${n} ${def.name} (max affordable) for ${fmt(res.totalCost)}`);
          } else {
            btn.textContent = 'MAX';
            btn.disabled    = true;
            btn.setAttribute('aria-label', `Cannot afford any ${def.name}`);
          }
        }
      }
    }
  });
}

/* ── Upgrade buy-mode global state ───────────────────────────────── */
/**
 * Global upgrade buy multiplier mode.
 * Values: 1 (×1), 10 (×10), Infinity (MAX).
 * Applied to ALL upgrade buy buttons simultaneously.
 * @type {number}
 */
let _upgradeBuyMode = 1;

/* ── Upgrade section header: inject global mode control ──────────── */
/**
 * Inject the ×1 / ×10 / MAX segmented control into the Upgrades section
 * heading row (runs once on first render; idempotent).
 */
function ensureUpgradeModeControl() {
  const heading = document.getElementById('upgrade-heading');
  if (!heading || heading.querySelector('.upgrade-mode-group')) return; // already injected

  const group = document.createElement('div');
  group.className = 'upgrade-mode-group';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Upgrade buy quantity');

  const modes = [
    { label: '×1',  value: 1,        cls: 'umode-x1'  },
    { label: '×10', value: 10,       cls: 'umode-x10' },
    { label: 'MAX', value: Infinity, cls: 'umode-max' },
  ];

  modes.forEach(({ label, value, cls }) => {
    const btn = document.createElement('button');
    btn.className = 'upgrade-mode-btn-global ' + cls;
    btn.textContent = label;
    btn.dataset.modeValue = value === Infinity ? 'Infinity' : String(value);
    btn.setAttribute('aria-pressed', String(_upgradeBuyMode === value));
    btn.addEventListener('click', () => {
      _upgradeBuyMode = value;
      // Update pressed state on all sibling buttons
      group.querySelectorAll('.upgrade-mode-btn-global').forEach(b => {
        const bVal = b.dataset.modeValue === 'Infinity' ? Infinity : Number(b.dataset.modeValue);
        const active = bVal === _upgradeBuyMode;
        b.setAttribute('aria-pressed', String(active));
        b.classList.toggle('active', active);
      });
      // Re-render upgrades to update all buy button labels immediately
      try { renderUpgrades(currentState()); } catch (_) {}
    });
    group.appendChild(btn);
  });

  heading.appendChild(group);

  // Set initial active state
  _syncUpgradeModeButtons(group);
}

/**
 * Sync aria-pressed / .active class on all upgrade mode buttons.
 * @param {HTMLElement} group
 */
function _syncUpgradeModeButtons(group) {
  group.querySelectorAll('.upgrade-mode-btn-global').forEach(btn => {
    const val = btn.dataset.modeValue === 'Infinity' ? Infinity : Number(btn.dataset.modeValue);
    const active = val === _upgradeBuyMode;
    btn.setAttribute('aria-pressed', String(active));
    btn.classList.toggle('active', active);
  });
}

/* ── Upgrade buy-mode helpers ─────────────────────────────────────── */
/**
 * Compute affordable levels for a given limit (1, 10, or Infinity).
 * Uses maxAffordableLevels from economy (pure read-only).
 * @param {object} state
 * @param {object} def   - upgrade definition
 * @param {number} limit - max levels to consider
 * @returns {{ levels: number, totalCost: number, nextLevel: number }}
 */
function _buyModeCalc(state, def, limit) {
  const level = state[def.id] || 0;
  return maxAffordableLevels({
    cash:       state.cash,
    level,
    maxLevel:   def.maxLevel,
    baseCost:   def.baseCost,
    costGrowth: def.costGrowth,
    limit,
    upgradeDef: def,
  });
}

/**
 * Attempt to purchase `limit` levels via gameState.buyUpgradeLevels,
 * falling back to buyUpgrade (x1 only) if the bulk method is absent.
 * @param {object} def   - upgrade definition
 * @param {number} limit - 1, 10, or Infinity
 * @param {HTMLButtonElement} flashTarget - button to flash on failure
 */
function _doBuyUpgrade(def, limit, flashTarget) {
  if (typeof gameState.buyUpgradeLevels === 'function') {
    const result = gameState.buyUpgradeLevels(def, limit);
    if (!result || result.levels <= 0) flashBtn(flashTarget);
  } else if (limit === 1 && typeof gameState.buyUpgrade === 'function') {
    const ok = gameState.buyUpgrade(def);
    if (!ok) flashBtn(flashTarget);
  } else {
    console.warn('[crypto-screen] gameState.buyUpgradeLevels not available');
    flashBtn(flashTarget);
  }
}

/* ── Render upgrades section ──────────────────────────────────────── */
function renderUpgrades(state) {
  const { upgradeList } = getEls();
  if (!upgradeList) return;

  // Ensure the global mode control exists in the heading
  ensureUpgradeModeControl();

  const existingCards = {};
  upgradeList.querySelectorAll('[data-upgrade-id]').forEach(el => {
    existingCards[el.dataset.upgradeId] = el;
  });

  UPGRADES.forEach(def => {
    const level  = state[def.id] || 0;
    const maxed  = level >= def.maxLevel;
    const pct    = (level / def.maxLevel) * 100;

    let card = existingCards[def.id];
    if (!card) {
      /* ── Build card DOM (once) ── */
      card = document.createElement('div');
      card.className = 'upgrade-card';
      card.setAttribute('data-upgrade-id', def.id);
      card.setAttribute('role', 'listitem');

      const icon = document.createElement('div');
      icon.className = 'upgrade-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = UPGRADE_ICONS[def.id] || '⬆️';

      const info = document.createElement('div');
      info.className = 'upgrade-info';

      const nameEl = document.createElement('div');
      nameEl.className = 'upgrade-name';
      nameEl.textContent = def.name;

      const descEl = document.createElement('div');
      descEl.className = 'upgrade-desc';
      descEl.textContent = def.description;

      const progressWrap = document.createElement('div');
      progressWrap.className = 'upgrade-progress';

      const progressFill = document.createElement('div');
      progressFill.className = 'upgrade-progress-fill';
      progressFill.dataset.role = 'fill';
      progressWrap.appendChild(progressFill);

      const levelEl = document.createElement('div');
      levelEl.className = 'upgrade-level';
      levelEl.dataset.role = 'level';

      info.append(nameEl, descEl, progressWrap, levelEl);

      /* ── Single buy button (label changes based on global mode) ── */
      const buyBtn = document.createElement('button');
      buyBtn.className = 'upgrade-buy-btn';
      buyBtn.dataset.role = 'buy';
      buyBtn.setAttribute('aria-label', `Buy ${def.name}`);
      buyBtn.addEventListener('click', () => _doBuyUpgrade(def, _upgradeBuyMode, buyBtn));

      card.append(icon, info, buyBtn);
      upgradeList.appendChild(card);
    }

    /* ── Update dynamic parts every render tick ── */
    card.classList.toggle('maxed', maxed);

    const fill   = card.querySelector('[data-role="fill"]');
    const lvlEl  = card.querySelector('[data-role="level"]');
    const buyBtn = card.querySelector('[data-role="buy"]');

    if (fill)  fill.style.width = pct + '%';
    if (lvlEl) {
      lvlEl.innerHTML = `Level <span class="gold">${level}</span> / ${def.maxLevel}`;
    }

    /* ── Update buy button label based on global _upgradeBuyMode ── */
    if (buyBtn) {
      if (maxed) {
        buyBtn.textContent = 'MAXED';
        buyBtn.disabled    = true;
        buyBtn.classList.add('maxed-label');
        buyBtn.setAttribute('aria-label', `${def.name} — max level reached`);
        return;
      }

      buyBtn.classList.remove('maxed-label');

      if (_upgradeBuyMode === 1) {
        /* x1 — cost of next single level */
        const cost1 = upgradeCost(def, level);
        const can1  = state.cash >= cost1;
        buyBtn.textContent = fmt(cost1);
        buyBtn.disabled    = !can1;
        buyBtn.setAttribute('aria-label', `Buy 1 level of ${def.name} for ${fmt(cost1)}`);
      } else if (_upgradeBuyMode === 10) {
        /* x10 — up to 10 levels, show total cost or disable */
        const r10 = _buyModeCalc(state, def, 10);
        if (r10.levels > 0) {
          buyBtn.textContent = `×${r10.levels} ${fmt(r10.totalCost)}`;
          buyBtn.disabled    = false;
          buyBtn.setAttribute('aria-label',
            `Buy ${r10.levels} level${r10.levels !== 1 ? 's' : ''} of ${def.name} for ${fmt(r10.totalCost)}`);
        } else {
          buyBtn.textContent = '×10';
          buyBtn.disabled    = true;
          buyBtn.setAttribute('aria-label', `Cannot afford any levels of ${def.name}`);
        }
      } else {
        /* MAX — all affordable levels */
        const rMax = _buyModeCalc(state, def, Infinity);
        if (rMax.levels > 0) {
          buyBtn.textContent = `MAX +${rMax.levels}`;
          buyBtn.disabled    = false;
          buyBtn.setAttribute('aria-label',
            `Buy ${rMax.levels} max level${rMax.levels !== 1 ? 's' : ''} of ${def.name} for ${fmt(rMax.totalCost)}`);
        } else {
          buyBtn.textContent = 'MAX';
          buyBtn.disabled    = true;
          buyBtn.setAttribute('aria-label', `Cannot afford any levels of ${def.name}`);
        }
      }
    }
  });
}

/* ── Render header metrics ────────────────────────────────────────── */
function renderHeader(state) {
  const els = getEls();
  const now = Date.now();
  const pps = profitPerSecond(state, STAFF, now);
  const cv  = clickValue(state);
  const pm  = prestigeMultiplier(state.prestigePoints);
  const aem = activeEventMultiplier(state, now);

  if (els.cash)         els.cash.textContent       = fmt(state.cash);
  if (els.profitRate)   els.profitRate.textContent  = fmtRate(pps) + '/s';
  if (els.clickValueEl) els.clickValueEl.textContent = fmt(cv);
  if (els.clickValueHint) els.clickValueHint.textContent = '+' + fmt(cv) + ' per click';
  if (els.prestigeMult) els.prestigeMult.textContent = '×' + pm.toFixed(2);

  // Pump status
  if (els.pumpStatus) {
    const pumpActive = state.eventUntil > now;

    // Trigger airdrop animation exactly once on inactive→active transition.
    if (pumpActive && !_prevEventActive) {
      spawnAirdrop();
    }
    _prevEventActive = pumpActive;

    if (pumpActive) {
      const remaining = state.eventUntil - now;
      els.pumpStatus.textContent = '×10 ' + fmtTime(remaining);
      els.pumpStatus.classList.add('active');
      els.pumpStatus.closest('.metric-card').style.borderColor = 'var(--clr-green-dim)';
    } else {
      els.pumpStatus.textContent = 'Inactive';
      els.pumpStatus.classList.remove('active');
      els.pumpStatus.closest('.metric-card').style.borderColor = '';
    }
  }
}

/* ── Render prestige button ───────────────────────────────────────── */
function renderPrestige(state) {
  const { prestigeBtn } = getEls();
  if (!prestigeBtn) return;

  const can  = canPrestige(state);
  const gain = prestigeGain(state);
  const req  = nextPrestigeRequirement(state);
  if (can) {
    prestigeBtn.textContent = `Reset for +${gain} Whale Point${gain === 1 ? '' : 's'}`;
  } else {
    prestigeBtn.textContent = `Need ${fmt(req)} lifetime`;
  }
  prestigeBtn.disabled    = !can;
  prestigeBtn.setAttribute(
    'aria-label',
    can
      ? `Prestige — reset for +${gain} whale points`
      : `Prestige locked — need ${fmt(req)} lifetime cash`
  );
}

/* ── Render offline claim ─────────────────────────────────────────── */
function renderOfflineClaim() {
  const { claimOffline } = getEls();
  if (!claimOffline) return;

  try {
    if (typeof idle.getOfflineProgress === 'function') {
      const prog = idle.getOfflineProgress();
      if (prog && prog.cash > 0) {
        claimOffline.textContent =
          `💤 Claim Offline Earnings — ${fmt(prog.cash)} (${fmtTime(prog.time)})`;
        claimOffline.style.display = 'block';
        return;
      }
    }
  } catch (e) {
    console.warn('[crypto-screen] getOfflineProgress error:', e);
  }
  claimOffline.style.display = 'none';
}

/* ── Full re-render on state change ───────────────────────────────── */
function render(state) {
  if (!state) state = currentState();
  renderHeader(state);
  renderStaff(state);
  renderUpgrades(state);
  renderPrestige(state);
}

/* ── Floating click feedback ──────────────────────────────────────── */
function spawnFloat(x, y, text) {
  const el = document.createElement('div');
  el.className = 'click-float';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

/* ── Airdrop falling-item animation ──────────────────────────────── */
// Tracks previous pump-event state to fire only on inactive→active edge.
let _prevEventActive = false;

// Airdrop emoji palette: high-contrast gold/green on dark bg.
const _AIRDROP_SYMBOLS = ['💰', '🪙', '💎', '📦', '🪂', '💵', '✨', '🤑'];

/**
 * Spawns a burst of falling airdrop items over the game container.
 * Visible for 2-4 s, pointer-events:none — never blocks interaction.
 */
function spawnAirdrop() {
  const layer = document.getElementById('airdrop-layer');
  if (!layer) return;

  const count = 14 + Math.floor(Math.random() * 5); // 14-18 items
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'airdrop-item';
    el.textContent = _AIRDROP_SYMBOLS[Math.floor(Math.random() * _AIRDROP_SYMBOLS.length)];

    // Random horizontal spread across layer width
    const leftPct  = 2 + Math.random() * 90;           // 2-92% of layer width
    const duration = 2.2 + Math.random() * 1.8;        // 2.2-4 s
    const delay    = Math.random() * 1.2;               // 0-1.2 s stagger
    const size     = 1.6 + Math.random() * 1.2;        // 1.6-2.8 rem

    el.style.left             = leftPct + '%';
    el.style.fontSize         = size + 'rem';
    el.style.animationDuration = duration + 's';
    el.style.animationDelay   = delay + 's';
    el.style.opacity          = '0'; // hidden until animation starts

    layer.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ponytail: debug hook — manual verification only; safe to remove after confirm.
if (typeof window !== 'undefined') window.__spawnAirdrop = spawnAirdrop;

/* ── Flash button on failed action ───────────────────────────────── */
function flashBtn(btn) {
  btn.style.transition = 'background 80ms';
  btn.style.background = 'var(--clr-red)';
  setTimeout(() => { btn.style.background = ''; btn.style.transition = ''; }, 300);
}

/* ── Wire up static event listeners ──────────────────────────────── */
function bindEvents() {
  const els = getEls();

  // Trade / click button
  if (els.tradeClick) {
    els.tradeClick.addEventListener('click', e => {
      try {
        const state = currentState();
        const cv    = clickValue(state);
        if (typeof gameState.addCash === 'function') {
          gameState.addCash(cv);
        } else {
          console.warn('[crypto-screen] gameState.addCash not available');
        }
        // Floating label
        const rect = els.tradeClick.getBoundingClientRect();
        spawnFloat(
          rect.left + rect.width / 2 - 20 + (Math.random() - 0.5) * 30,
          rect.top  + rect.height / 2 - 10,
          '+' + fmt(cv)
        );
      } catch (err) {
        console.error('[crypto-screen] click error:', err);
      }
    });
  }

  // Prestige button
  if (els.prestigeBtn) {
    els.prestigeBtn.addEventListener('click', () => {
      const state = currentState();
      const gain  = prestigeGain(state);
      const req   = nextPrestigeRequirement(state);
      const ok    = confirm(
        `⚠️ Reset all progress for +${gain} Whale Point${gain === 1 ? '' : 's'}?\n` +
        `This cannot be undone. Next run requirement was ${fmt(req)} lifetime cash.`
      );
      if (!ok) return;
      if (typeof gameState.prestige === 'function') {
        gameState.prestige();
      } else {
        console.warn('[crypto-screen] gameState.prestige not available');
      }
    });
  }

  // Offline claim button
  if (els.claimOffline) {
    els.claimOffline.addEventListener('click', () => {
      try {
        if (typeof idle.claimOfflineRewards === 'function') {
          const claimed = idle.claimOfflineRewards();
          console.info('[crypto-screen] Claimed offline:', fmt(claimed));
        } else {
          console.warn('[crypto-screen] idle.claimOfflineRewards not available');
        }
      } catch (err) {
        console.error('[crypto-screen] claimOfflineRewards error:', err);
      }
      renderOfflineClaim();
    });
  }
}

/* ── initCryptoScreen (exported entry point) ─────────────────────── */
export function initCryptoScreen() {
  console.log('🪙 [crypto-screen] init');

  // Wire up tab navigation
  initTabs();

  // Initial render
  try {
    render(currentState());
  } catch (err) {
    console.error('[crypto-screen] initial render error:', err);
  }

  // Offline progress check (once on load)
  renderOfflineClaim();

  // Bind all interactions
  bindEvents();

  // Subscribe to state changes → re-render
  try {
    if (typeof gameState.subscribe === 'function') {
      gameState.subscribe(state => {
        try {
          render(state);
        } catch (err) {
          console.error('[crypto-screen] render error on state change:', err);
        }
      });
    } else {
      console.warn('[crypto-screen] gameState.subscribe not available; polling fallback');
      setInterval(() => {
        try { render(currentState()); } catch (_) {}
      }, 250);
    }
  } catch (err) {
    console.error('[crypto-screen] subscribe error:', err);
  }
}
