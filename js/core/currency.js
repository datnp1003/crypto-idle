import { gameState } from './game-state.js';

class Currency {
    constructor() {
        this.rates = {
            gold: 1,
            souls: 0.1
        };
        this.updateRates();
    }
    
    updateRates() {
        const party = gameState.getPartyCharacters();
        let totalAtk = 0;
        let totalSpd = 0;
        
        party.forEach(char => {
            totalAtk += char.stats.atk;
            totalSpd += char.stats.spd;
        });
        
        // Base rate + party bonus
        this.rates.gold = 1 + (totalAtk * 0.1) + (party.length * 0.5);
        this.rates.souls = 0.1 + (totalAtk * 0.01) + (party.length * 0.05);
    }
    
    getGoldPerSecond() {
        return this.rates.gold;
    }
    
    getSoulsPerSecond() {
        return this.rates.souls;
    }
    
    addPassiveIncome(deltaTime) {
        const goldEarned = this.rates.gold * deltaTime;
        const soulsEarned = this.rates.souls * deltaTime;
        
        if (goldEarned > 0) {
            gameState.updateCurrency('gold', goldEarned);
        }
        
        if (soulsEarned > 0) {
            gameState.updateCurrency('souls', soulsEarned);
        }
    }
    
    calculateOfflineProgress() {
        const lastOnline = gameState.get('lastOnlineTime');
        const now = Date.now();
        const offlineSeconds = Math.min((now - lastOnline) / 1000, 28800); // Max 8 hours
        
        if (offlineSeconds < 60) return null; // Less than 1 minute
        
        const goldEarned = this.rates.gold * offlineSeconds * 0.5; // 50% efficiency offline
        const soulsEarned = this.rates.souls * offlineSeconds * 0.5;
        
        return {
            gold: goldEarned,
            souls: soulsEarned,
            time: offlineSeconds
        };
    }
    
    claimOfflineRewards() {
        const offline = this.calculateOfflineProgress();
        if (!offline) return false;
        
        gameState.updateCurrency('gold', offline.gold);
        gameState.updateCurrency('souls', offline.souls);
        gameState.set('lastOnlineTime', Date.now());
        
        return offline;
    }
    
    canAfford(type, amount) {
        return gameState.get('currency')[type] >= amount;
    }
    
    spend(type, amount) {
        if (!this.canAfford(type, amount)) return false;
        gameState.updateCurrency(type, -amount);
        return true;
    }
}

export const currency = new Currency();