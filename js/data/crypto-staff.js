export const STAFF = [
  { id: 'intern', name: 'Airdrop Intern', baseCost: 25, baseProfit: 0.2, costGrowth: 1.25, maxCount: 500 },
  { id: 'trader', name: 'Meme Coin Trader', baseCost: 250, baseProfit: 2, costGrowth: 1.25, maxCount: 500 },
  { id: 'miner', name: 'GPU Miner', baseCost: 2500, baseProfit: 20, costGrowth: 1.25, maxCount: 500 },
  { id: 'quant', name: 'Quant Bot', baseCost: 50000, baseProfit: 250, costGrowth: 1.25, maxCount: 500 },
  { id: 'node', name: 'Validator Node', baseCost: 250000, baseProfit: 1500, costGrowth: 1.25, maxCount: 500 },
  { id: 'defi', name: 'DeFi Farmer', baseCost: 2500000, baseProfit: 15000, costGrowth: 1.25, maxCount: 500 },
  { id: 'nft', name: 'NFT Flipper', baseCost: 25000000, baseProfit: 150000, costGrowth: 1.25, maxCount: 500 },
  { id: 'exchange', name: 'Exchange Desk', baseCost: 250000000, baseProfit: 1500000, costGrowth: 1.25, maxCount: 500 },
  { id: 'whale', name: 'Whale Syndicate', baseCost: 2500000000, baseProfit: 15000000, costGrowth: 1.25, maxCount: 500 },
  { id: 'launchpad', name: 'Launchpad Team', baseCost: 25000000000, baseProfit: 150000000, costGrowth: 1.25, maxCount: 500 },
  { id: 'hedge', name: 'Crypto Hedge Fund', baseCost: 250000000000, baseProfit: 1500000000, costGrowth: 1.25, maxCount: 500 },
  { id: 'chain', name: 'Layer-1 Chain', baseCost: 2500000000000, baseProfit: 15000000000, costGrowth: 1.25, maxCount: 500 }
];

export const UPGRADES = [
  { id: 'clickUpgradeLevel', name: 'Diamond Hands', baseCost: 100, costGrowth: 1.25, costFormula: 'double', maxLevel: 100, description: 'x2 click value/level' },
  { id: 'staffUpgradeLevel', name: 'Bull Market Training', baseCost: 500, costGrowth: 1.25, maxLevel: 100, description: '+5% staff profit/level' },
  { id: 'automationLevel', name: 'Trading Automation', baseCost: 5000, costGrowth: 1.25, maxLevel: 100, description: '+10% total profit/level' },
  { id: 'pumpLuckLevel', name: 'Pump Radar', baseCost: 20000, costGrowth: 1.25, maxLevel: 100, description: '+small pump event chance/level' },
  { id: 'offlineLevel', name: 'Cold Wallet Ops', baseCost: 100000, costGrowth: 1.25, maxLevel: 100, description: '+offline earnings efficiency/level' },
  { id: 'prestigeBoostLevel', name: 'Whale Network', baseCost: 1000000, costGrowth: 1.25, maxLevel: 100, description: '+prestige bonus scaling/level' },
  { id: 'staffDiscountLevel', name: 'Recruiter DAO', baseCost: 250000, costGrowth: 1.25, maxLevel: 100, description: '+staff hiring discount/level' },
  { id: 'megaHashLevel', name: 'Mega Hash Rigs', baseCost: 5000000, costGrowth: 1.25, maxLevel: 100, description: '+late-game profit scaling/level' }
];
