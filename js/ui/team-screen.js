import { gameState } from '../core/game-state.js';
import { currency } from '../core/currency.js';

let selectedCharacter = null;
let showEquipModal = false;

export function initTeamScreen() {
    const partySlots = document.getElementById('party-slots');
    const characterList = document.getElementById('character-list');
    
    updatePartySlots();
    updateCharacterList();
    
    gameState.subscribe(() => {
        updatePartySlots();
        updateCharacterList();
        if (selectedCharacter && showEquipModal) {
            updateEquipModal();
        }
    });
}

function updatePartySlots() {
    const partySlots = document.getElementById('party-slots');
    const party = gameState.get('party');
    
    let html = '';
    for (let i = 0; i < 4; i++) {
        const charId = party[i];
        const char = charId ? gameState.getCharacterById(charId) : null;
        
        if (char) {
            html += `
                <div class="party-slot filled" data-slot="${i}">
                    <div class="icon">${char.icon}</div>
                    <div class="name">${char.name}</div>
                    <div class="level">Lv. ${char.level}</div>
                    <div class="stats">HP:${char.stats.hp} ATK:${char.stats.atk}</div>
                    <button class="remove-btn" data-slot="${i}">Remove</button>
                </div>
            `;
        } else {
            html += `
                <div class="party-slot" data-slot="${i}">
                    <div class="icon">+</div>
                    <div class="name">Empty Slot</div>
                    <div class="stats">Select a character</div>
                </div>
            `;
        }
    }
    
    partySlots.innerHTML = html;
    
    document.querySelectorAll('.party-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const slotIndex = parseInt(e.target.dataset.slot);
                gameState.setPartySlot(slotIndex, null);
            }
        });
    });
}

function updateCharacterList() {
    const characterList = document.getElementById('character-list');
    const characters = gameState.get('inventory').characters;
    
    if (characters.length === 0) {
        characterList.innerHTML = '<p style="text-align: center; color: #aaa;">No characters yet. Try gacha!</p>';
        return;
    }
    
    let html = '';
    characters.forEach(char => {
        const isSelected = selectedCharacter === char.id;
        const isInParty = gameState.get('party').includes(char.id);
        
        html += `
            <div class="character-card ${isSelected ? 'selected' : ''}" data-id="${char.id}">
                <div class="icon">${char.icon}</div>
                <div class="name">${char.name}</div>
                <div class="rarity">${char.rarity}</div>
                <div class="level">Lv. ${char.level}</div>
                ${isInParty ? '<div style="color: #51cf66; font-size: 0.7rem;">In Party</div>' : ''}
            </div>
        `;
    });
    
    characterList.innerHTML = html;
    
    document.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('click', () => {
            const charId = card.dataset.id;
            selectedCharacter = charId;
            showEquipModal = true;
            
            const party = gameState.get('party');
            const emptySlot = party.findIndex(slot => slot === null);
            
            if (emptySlot !== -1 && !party.includes(charId)) {
                gameState.setPartySlot(emptySlot, charId);
            }
            
            updateCharacterList();
            updatePartySlots();
            showCharacterModal(charId);
        });
    });
}

function showCharacterModal(charId) {
    let modal = document.getElementById('character-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'character-modal';
        modal.className = 'modal';
        document.getElementById('game-container').appendChild(modal);
    }
    
    updateEquipModal();
    modal.style.display = 'flex';
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('close-btn')) {
            modal.style.display = 'none';
            showEquipModal = false;
        }
    });
}

function updateEquipModal() {
    const modal = document.getElementById('character-modal');
    if (!modal || !selectedCharacter) return;
    
    const char = gameState.getCharacterById(selectedCharacter);
    if (!char) return;
    
    const equippedWeapon = gameState.getEquippedItem(selectedCharacter, 'weapon');
    const equippedArmor = gameState.getEquippedItem(selectedCharacter, 'armor');
    const equippedAccessory = gameState.getEquippedItem(selectedCharacter, 'accessory');
    
    const unequippedItems = gameState.getUnequippedItems();
    const weapons = unequippedItems.filter(i => i.type === 'weapon');
    const armors = unequippedItems.filter(i => i.type === 'armor');
    const accessories = unequippedItems.filter(i => i.type === 'accessory');
    
    const levelUpCost = gameState.getLevelUpCost(char.level);
    const canLevelUp = currency.canAfford('gold', levelUpCost);
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn">X</button>
            <div class="char-header">
                <div class="char-icon">${char.icon}</div>
                <div class="char-info">
                    <h3>${char.name}</h3>
                    <p>Rarity: <span class="${char.rarity}">${char.rarity.toUpperCase()}</span></p>
                    <p>Level: ${char.level}</p>
                </div>
            </div>
            
            <div class="char-stats">
                <div>HP: ${char.stats.hp}</div>
                <div>ATK: ${char.stats.atk}</div>
                <div>DEF: ${char.stats.def}</div>
                <div>SPD: ${char.stats.spd}</div>
            </div>
            
            <div class="equip-section">
                <h4>Equipment</h4>
                <div class="equip-slots">
                    <div class="equip-slot">
                        <span>Weapon:</span>
                        ${equippedWeapon ? 
                            `<span class="equipped-item">${equippedWeapon.icon} ${equippedWeapon.name}</span>
                             <button class="unequip-btn" data-slot="weapon">X</button>` :
                            `<span class="empty-slot">Empty</span>`
                        }
                    </div>
                    <div class="equip-slot">
                        <span>Armor:</span>
                        ${equippedArmor ? 
                            `<span class="equipped-item">${equippedArmor.icon} ${equippedArmor.name}</span>
                             <button class="unequip-btn" data-slot="armor">X</button>` :
                            `<span class="empty-slot">Empty</span>`
                        }
                    </div>
                    <div class="equip-slot">
                        <span>Accessory:</span>
                        ${equippedAccessory ? 
                            `<span class="equipped-item">${equippedAccessory.icon} ${equippedAccessory.name}</span>
                             <button class="unequip-btn" data-slot="accessory">X</button>` :
                            `<span class="empty-slot">Empty</span>`
                        }
                    </div>
                </div>
            </div>
            
            <div class="available-items">
                <h4>Available Items</h4>
                ${weapons.length > 0 ? `
                    <div class="item-category">
                        <span>Weapons:</span>
                        <div class="item-list">
                            ${weapons.map(item => `
                                <button class="equip-btn" data-id="${item.id}">${item.icon} ${item.name}</button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${armors.length > 0 ? `
                    <div class="item-category">
                        <span>Armors:</span>
                        <div class="item-list">
                            ${armors.map(item => `
                                <button class="equip-btn" data-id="${item.id}">${item.icon} ${item.name}</button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${accessories.length > 0 ? `
                    <div class="item-category">
                        <span>Accessories:</span>
                        <div class="item-list">
                            ${accessories.map(item => `
                                <button class="equip-btn" data-id="${item.id}">${item.icon} ${item.name}</button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${unequippedItems.length === 0 ? '<p style="color: #aaa;">No items available</p>' : ''}
            </div>
            
            <div class="levelup-section">
                <button class="levelup-btn" ${!canLevelUp ? 'disabled' : ''}>
                    Level Up (${levelUpCost} Gold)
                </button>
            </div>
        </div>
    `;
    
    modal.querySelectorAll('.equip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.dataset.id;
            gameState.equipItem(selectedCharacter, itemId);
        });
    });
    
    modal.querySelectorAll('.unequip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const slot = btn.dataset.slot;
            gameState.unequipItem(selectedCharacter, slot);
        });
    });
    
    const levelupBtn = modal.querySelector('.levelup-btn');
    if (levelupBtn) {
        levelupBtn.addEventListener('click', () => {
            gameState.levelUpCharacter(selectedCharacter);
        });
    }
}