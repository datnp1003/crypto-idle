const { openDb, migrate, run, get, all } = require('./db.js');

const STAFF_ICONS = {
  intern: '🎓', trader: '📊', miner: '⛏️', quant: '🤖',
  node: '🖥️', defi: '🌾', nft: '🖼️', exchange: '🏦',
  whale: '🐋', launchpad: '🚀', hedge: '💼', chain: '⛓️',
};

const UPGRADE_ICONS = {
  clickUpgradeLevel: '💎', staffUpgradeLevel: '📈',
  automationLevel: '⚙️', pumpLuckLevel: '📡',
  offlineLevel: '🧊', prestigeBoostLevel: '🐋',
  staffDiscountLevel: '🤝', megaHashLevel: '⚡',
};

function jsToJsonObject(text) {
  return text
    .replace(/(\w+)(?=\s*:)/g, '"$1"')
    .replace(/'([^']*)'/g, '"$1"');
}

function loadGameData() {
  const fs = require('node:fs');
  const path = require('node:path');
  const staffPath = path.join(__dirname, '..', 'js', 'data', 'crypto-staff.js');
  const raw = fs.readFileSync(staffPath, 'utf8');

  const exportRegex = /export const (\w+) = (\[[\s\S]*?\]);/g;
  const vars = {};
  let m;
  while ((m = exportRegex.exec(raw)) !== null) {
    vars[m[1]] = JSON.parse(jsToJsonObject(m[2]));
  }
  return { staff: vars.STAFF || [], upgrades: vars.UPGRADES || [] };
}

function seed(db) {
  const { staff, upgrades } = loadGameData();

  const upsertStaff = db.prepare(
    `INSERT INTO staff_modules (id, name, base_cost, base_profit, cost_growth, max_count, icon, sort_order, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, base_cost=excluded.base_cost, base_profit=excluded.base_profit,
       cost_growth=excluded.cost_growth, max_count=excluded.max_count, icon=excluded.icon,
       sort_order=excluded.sort_order, enabled=excluded.enabled`
  );

  staff.forEach((s, i) => {
    upsertStaff.run(
      s.id, s.name, s.baseCost, s.baseProfit, s.costGrowth,
      s.maxCount, STAFF_ICONS[s.id] || '👤', i
    );
  });

  const upsertUpgrade = db.prepare(
    `INSERT INTO upgrade_modules (id, name, description, base_cost, cost_growth, cost_formula, max_level, icon, sort_order, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, description=excluded.description, base_cost=excluded.base_cost,
       cost_growth=excluded.cost_growth, cost_formula=excluded.cost_formula,
       max_level=excluded.max_level, icon=excluded.icon, sort_order=excluded.sort_order,
       enabled=excluded.enabled`
  );

  upgrades.forEach((u, i) => {
    upsertUpgrade.run(
      u.id, u.name, u.description, u.baseCost, u.costGrowth,
      u.costFormula || null, u.maxLevel, UPGRADE_ICONS[u.id] || '⬆️', i
    );
  });

  const upsertSetting = db.prepare(
    `INSERT INTO game_settings (key, value_json) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json`
  );
  upsertSetting.run('prestigeThreshold', JSON.stringify(1000000));
  upsertSetting.run('pumpMultiplier', JSON.stringify(10));
  upsertSetting.run('pumpDurationMs', JSON.stringify(3600000));
}

function main() {
  const db = openDb();
  migrate(db);
  seed(db);

  const staffCount = get(db, 'SELECT count(*) as c FROM staff_modules').c;
  const upgradeCount = get(db, 'SELECT count(*) as c FROM upgrade_modules').c;
  const settingsCount = get(db, 'SELECT count(*) as c FROM game_settings').c;

  console.log(`Seeded: ${staffCount} staff, ${upgradeCount} upgrades, ${settingsCount} settings`);
  db.close();
}

if (require.main === module) {
  main();
}

module.exports = { seed };
