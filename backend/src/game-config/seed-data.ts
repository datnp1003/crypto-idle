export const STAFF_SEED = [
  { id: 'intern', name: 'Airdrop Intern', baseCost: 25, baseProfit: 0.2, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 0, enabled: true },
  { id: 'trader', name: 'Meme Coin Trader', baseCost: 250, baseProfit: 2, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 1, enabled: true },
  { id: 'miner', name: 'GPU Miner', baseCost: 2500, baseProfit: 20, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 2, enabled: true },
  { id: 'quant', name: 'Quant Bot', baseCost: 50000, baseProfit: 250, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 3, enabled: true },
  { id: 'node', name: 'Validator Node', baseCost: 250000, baseProfit: 1500, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 4, enabled: true },
  { id: 'defi', name: 'DeFi Farmer', baseCost: 2500000, baseProfit: 15000, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 5, enabled: true },
  { id: 'nft', name: 'NFT Flipper', baseCost: 25000000, baseProfit: 150000, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 6, enabled: true },
  { id: 'exchange', name: 'Exchange Desk', baseCost: 250000000, baseProfit: 1500000, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 7, enabled: true },
  { id: 'whale', name: 'Whale Syndicate', baseCost: 2500000000, baseProfit: 15000000, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 8, enabled: true },
  { id: 'launchpad', name: 'Launchpad Team', baseCost: 25000000000, baseProfit: 150000000, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 9, enabled: true },
  { id: 'hedge', name: 'Crypto Hedge Fund', baseCost: 250000000000, baseProfit: 1500000000, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 10, enabled: true },
  { id: 'chain', name: 'Layer-1 Chain', baseCost: 2500000000000, baseProfit: 15000000000, costGrowth: 1.25, maxCount: 500, icon: '', sortOrder: 11, enabled: true },
];

export const UPGRADES_SEED = [
  { id: 'clickUpgradeLevel', name: 'Diamond Hands', description: 'x2 click value/level', baseCost: 100, costGrowth: 1.25, costFormula: 'double', maxLevel: 100, icon: '', sortOrder: 0, enabled: true },
  { id: 'staffUpgradeLevel', name: 'Bull Market Training', description: '+5% staff profit/level', baseCost: 500, costGrowth: 1.25, costFormula: 'generic', maxLevel: 100, icon: '', sortOrder: 1, enabled: true },
  { id: 'automationLevel', name: 'Trading Automation', description: '+10% total profit/level', baseCost: 5000, costGrowth: 1.25, costFormula: 'generic', maxLevel: 100, icon: '', sortOrder: 2, enabled: true },
  { id: 'pumpLuckLevel', name: 'Pump Radar', description: '+small pump event chance/level', baseCost: 20000, costGrowth: 1.25, costFormula: 'generic', maxLevel: 100, icon: '', sortOrder: 3, enabled: true },
  { id: 'offlineLevel', name: 'Cold Wallet Ops', description: '+offline earnings efficiency/level', baseCost: 100000, costGrowth: 1.25, costFormula: 'generic', maxLevel: 100, icon: '', sortOrder: 4, enabled: true },
  { id: 'prestigeBoostLevel', name: 'Whale Network', description: '+prestige bonus scaling/level', baseCost: 1000000, costGrowth: 1.25, costFormula: 'generic', maxLevel: 100, icon: '', sortOrder: 5, enabled: true },
  { id: 'staffDiscountLevel', name: 'Recruiter DAO', description: '+staff hiring discount/level', baseCost: 250000, costGrowth: 1.25, costFormula: 'generic', maxLevel: 100, icon: '', sortOrder: 6, enabled: true },
  { id: 'megaHashLevel', name: 'Mega Hash Rigs', description: '+late-game profit scaling/level', baseCost: 5000000, costGrowth: 1.25, costFormula: 'generic', maxLevel: 100, icon: '', sortOrder: 7, enabled: true },
];

export const SETTINGS_SEED = [
  { key: 'prestigeThreshold', valueJson: '1000000' },
  { key: 'pumpMultiplier', valueJson: '10' },
  { key: 'pumpDurationMs', valueJson: '3600000' },
];
