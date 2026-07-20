import { gameState } from '../core/game-state.js';

let currentTab = 'items';

export function initInventoryScreen() {
    const inventoryTabs = document.querySelectorAll('.inv-tab');
    const inventoryContent = document.getElementById('inventory-content');
    
    // Initialize with items tab
    updateInventoryContent();
    
    // Tab click handlers
    inventoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            inventoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            updateInventoryContent();
        });
    });
    
    // Subscribe to state changes
    gameState.subscribe(() => {
        updateInventoryContent();
    });
}

function updateInventoryContent() {
    const inventoryContent = document.getElementById('inventory-content');
    const inventory = gameState.get('inventory');
    
    let html = '';
    
    switch (currentTab) {
        case 'items':
            html = renderItems(inventory.items);
            break;
        case 'skills':
            html = renderSkills(inventory.skills);
            break;
        case 'consumables':
            html = renderConsumables(inventory.items);
            break;
    }
    
    inventoryContent.innerHTML = html || '<p style="text-align: center; color: #aaa; grid-column: 1/-1;">No items yet.</p>';
    
    // Add click handlers
    document.querySelectorAll('.inventory-item').forEach(item => {
        item.addEventListener('click', () => {
            // Could show item details or use consumable
            console.log('Item clicked:', item.dataset.id);
        });
    });
}

function renderItems(items) {
    if (items.length === 0) return '';
    
    return items
        .filter(item => item.type !== 'consumable')
        .map(item => `
            <div class="inventory-item ${item.rarity}" data-id="${item.id}">
                <div class="icon">${item.icon}</div>
                <div class="count">${item.count || 1}</div>
            </div>
        `).join('');
}

function renderSkills(skills) {
    if (skills.length === 0) return '';
    
    return skills.map(skill => `
        <div class="inventory-item ${skill.rarity}" data-id="${skill.id}">
            <div class="icon">${skill.icon}</div>
            <div class="count">${skill.count || 1}</div>
        </div>
    `).join('');
}

function renderConsumables(items) {
    const consumables = items.filter(item => item.type === 'consumable');
    if (consumables.length === 0) return '';
    
    return consumables.map(item => `
        <div class="inventory-item ${item.rarity}" data-id="${item.id}">
            <div class="icon">${item.icon}</div>
            <div class="count">${item.count || 1}</div>
        </div>
    `).join('');
}