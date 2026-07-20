import { gameState } from '../core/game-state.js';
import { battle } from '../core/battle.js';
import { idle } from '../core/idle.js';
import { rewards } from '../core/rewards.js';

export function initHomeScreen() {
    const partyDisplay = document.getElementById('party-display');
    const battleLog = document.getElementById('battle-log');
    const claimButton = document.getElementById('claim-offline');
    const dailyButton = document.getElementById('claim-daily');
    const achieveButton = document.getElementById('claim-achievements');
    
    battle.init(battleLog);
    updatePartyDisplay();
    checkRewards();
    
    // Offline rewards
    claimButton.addEventListener('click', () => {
        const offlineRewards = idle.claimOfflineRewards();
        if (offlineRewards) {
            alert(`Offline Rewards:\nGold: +${Math.floor(offlineRewards.gold)}\nSouls: +${Math.floor(offlineRewards.souls)}\nTime: ${Math.floor(offlineRewards.time / 60)} minutes`);
            claimButton.style.display = 'none';
        }
    });
    
    // Daily reward
    dailyButton.addEventListener('click', () => {
        const daily = rewards.claimDaily();
        if (daily) {
            alert(`Daily Reward:\nGems: +${daily.gems}`);
            dailyButton.style.display = 'none';
            checkRewards();
        }
    });
    
    // Achievement rewards
    achieveButton.addEventListener('click', () => {
        const totalGems = rewards.claimAll();
        if (totalGems > 0) {
            alert(`Achievement Rewards:\nGems: +${totalGems}`);
            achieveButton.style.display = 'none';
            checkRewards();
        }
    });
    
    gameState.subscribe(() => {
        updatePartyDisplay();
        checkRewards();
    });
}

function updatePartyDisplay() {
    const partyDisplay = document.getElementById('party-display');
    const party = gameState.getPartyCharacters();
    
    let html = '';
    for (let i = 0; i < 4; i++) {
        const char = party[i];
        if (char) {
            html += `
                <div class="character-slot occupied">
                    <div>${char.icon}</div>
                </div>
            `;
        } else {
            html += `
                <div class="character-slot">
                    <div>+</div>
                </div>
            `;
        }
    }
    
    partyDisplay.innerHTML = html;
}

function checkRewards() {
    // Offline rewards
    const offline = idle.getOfflineProgress();
    const claimButton = document.getElementById('claim-offline');
    if (offline && offline.time >= 60) {
        claimButton.style.display = 'block';
        claimButton.textContent = `Claim Offline (${Math.floor(offline.time / 60)} min)`;
    } else {
        claimButton.style.display = 'none';
    }
    
    // Daily reward
    const daily = rewards.getDailyReward();
    const dailyButton = document.getElementById('claim-daily');
    if (daily.available) {
        dailyButton.style.display = 'block';
        dailyButton.textContent = `Daily Reward: +${daily.gems} Gems`;
    } else {
        dailyButton.style.display = 'block';
        dailyButton.textContent = `Daily in ${daily.hoursLeft}h`;
        dailyButton.disabled = true;
    }
    
    // Achievements
    const claimable = rewards.getClaimableRewards();
    const achieveButton = document.getElementById('claim-achievements');
    if (claimable.length > 0) {
        const totalGems = claimable.reduce((sum, a) => sum + (a.reward.gems || 0), 0);
        achieveButton.style.display = 'block';
        achieveButton.textContent = `Achievements (${claimable.length}): +${totalGems} Gems`;
        achieveButton.disabled = false;
    } else {
        achieveButton.style.display = 'block';
        achieveButton.textContent = 'No achievements ready';
        achieveButton.disabled = true;
    }
}