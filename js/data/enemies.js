export const enemies = [
    // Stage 1-10
    { id: 'e1', name: 'Slime', icon: '🟢', stats: { hp: 50, atk: 5, def: 2 } },
    { id: 'e2', name: 'Goblin', icon: '👺', stats: { hp: 70, atk: 8, def: 3 } },
    { id: 'e3', name: 'Skeleton', icon: '💀', stats: { hp: 60, atk: 10, def: 4 } },
    
    // Stage 11-20
    { id: 'e4', name: 'Orc', icon: '👹', stats: { hp: 120, atk: 15, def: 8 } },
    { id: 'e5', name: 'Dark Wizard', icon: '🧙', stats: { hp: 90, atk: 20, def: 5 } },
    
    // Stage 21-30
    { id: 'e6', name: 'Troll', icon: '🧌', stats: { hp: 200, atk: 25, def: 15 } },
    { id: 'e7', name: 'Vampire', icon: '🧛', stats: { hp: 180, atk: 30, def: 10 } },
    
    // Bosses (every 10 stages)
    { id: 'boss1', name: 'Goblin King', icon: '👑', stats: { hp: 500, atk: 35, def: 20 }, isBoss: true },
    { id: 'boss2', name: 'Dragon', icon: '🐲', stats: { hp: 1000, atk: 60, def: 30 }, isBoss: true },
    { id: 'boss3', name: 'Demon Lord', icon: '😈', stats: { hp: 2000, atk: 100, def: 50 }, isBoss: true },
];