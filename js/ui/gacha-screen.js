import { gameState } from '../core/game-state.js';
import { gacha } from '../core/gacha.js';

export function initGachaScreen() {
    const normalSummonBtn = document.getElementById('normal-summon');
    const normalMultiBtn = document.getElementById('normal-multi-summon');
    const premiumSummonBtn = document.getElementById('premium-summon');
    const premiumMultiBtn = document.getElementById('premium-multi-summon');
    const summonResult = document.getElementById('summon-result');
    const pityCount = document.getElementById('pity-count');
    
    updatePityCounter();
    
    // Single summon
    normalSummonBtn.addEventListener('click', async () => {
        normalSummonBtn.disabled = true;
        const result = await gacha.normalSummon();
        displaySingleResult(result);
        normalSummonBtn.disabled = false;
        updatePityCounter();
    });
    
    premiumSummonBtn.addEventListener('click', async () => {
        premiumSummonBtn.disabled = true;
        const result = await gacha.premiumSummon();
        displaySingleResult(result);
        premiumSummonBtn.disabled = false;
        updatePityCounter();
    });
    
    // Multi summon x10
    normalMultiBtn.addEventListener('click', async () => {
        normalMultiBtn.disabled = true;
        const result = await gacha.normalMultiSummon();
        displayMultiResult(result);
        normalMultiBtn.disabled = false;
        updatePityCounter();
    });
    
    premiumMultiBtn.addEventListener('click', async () => {
        premiumMultiBtn.disabled = true;
        const result = await gacha.premiumMultiSummon();
        displayMultiResult(result);
        premiumMultiBtn.disabled = false;
        updatePityCounter();
    });
    
    gameState.subscribe(() => {
        updatePityCounter();
    });
}

function displaySingleResult(result) {
    const summonResult = document.getElementById('summon-result');
    
    if (!result.success) {
        summonResult.innerHTML = `<p style="color: #ff6b6b;">${result.message}</p>`;
        return;
    }
    
    summonResult.innerHTML = createCardHTML(result);
}

function displayMultiResult(result) {
    const summonResult = document.getElementById('summon-result');
    
    if (!result.success) {
        summonResult.innerHTML = `<p style="color: #ff6b6b;">${result.message}</p>`;
        return;
    }
    
    let html = '<div class="multi-results">';
    result.results.forEach(r => {
        html += createCardHTML(r);
    });
    html += '</div>';
    
    summonResult.innerHTML = html;
}

function createCardHTML(result) {
    if (result.contentType === 'character') {
        return `
            <div class="summoned-card ${result.rarity}">
                <div class="icon">${result.result.icon}</div>
                <div class="name">${result.result.name}</div>
                <div class="rarity">${result.rarity.toUpperCase()}</div>
                ${result.result.isNew ? '<div class="new-badge">NEW!</div>' : ''}
                ${result.result.isDuplicate ? '<div class="dupe-badge">+Souls</div>' : ''}
            </div>
        `;
    } else if (result.contentType === 'item') {
        return `
            <div class="summoned-card ${result.rarity}">
                <div class="icon">${result.result.icon}</div>
                <div class="name">${result.result.name}</div>
                <div class="rarity">${result.rarity.toUpperCase()}</div>
                <div class="type-badge">${result.result.type}</div>
            </div>
        `;
    } else if (result.contentType === 'skill') {
        return `
            <div class="summoned-card ${result.rarity}">
                <div class="icon">${result.result.icon}</div>
                <div class="name">${result.result.name}</div>
                <div class="rarity">${result.rarity.toUpperCase()}</div>
                <div class="type-badge">Skill</div>
            </div>
        `;
    }
    return '';
}

function updatePityCounter() {
    const pityCount = document.getElementById('pity-count');
    pityCount.textContent = gacha.getPityCount();
}