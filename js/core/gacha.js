import { gameState } from './game-state.js';
import { currency } from './currency.js';
import { characters } from '../data/characters.js';
import { items } from '../data/items.js';
import { skills } from '../data/skills.js';
import { weightedRandom } from '../utils/random.js';

class Gacha {
    constructor() {
        this.rates = {
            common: 60,
            rare: 30,
            epic: 9,
            legendary: 1
        };
        
        this.premiumRates = {
            common: 0,
            rare: 40,
            epic: 45,
            legendary: 15
        };
        
        this.pityThreshold = 100;
    }
    
    async normalSummon() {
        if (!currency.canAfford('gold', 100)) {
            return { success: false, message: 'Not enough gold!' };
        }
        
        currency.spend('gold', 100);
        return this.performSummon('normal');
    }
    
    async premiumSummon() {
        if (!currency.canAfford('gems', 50)) {
            return { success: false, message: 'Not enough gems!' };
        }
        
        currency.spend('gems', 50);
        return this.performSummon('premium');
    }
    
    async normalMultiSummon() {
        const cost = 900; // 10% discount
        if (!currency.canAfford('gold', cost)) {
            return { success: false, message: 'Not enough gold! Need 900 Gold' };
        }
        
        currency.spend('gold', cost);
        return this.performMultiSummon('normal', 10);
    }
    
    async premiumMultiSummon() {
        const cost = 450; // 10% discount
        if (!currency.canAfford('gems', cost)) {
            return { success: false, message: 'Not enough gems! Need 450 Gems' };
        }
        
        currency.spend('gems', cost);
        return this.performMultiSummon('premium', 10);
    }
    
    performMultiSummon(type, count) {
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(this.performSummon(type));
        }
        
        // Guarantee at least one Rare or above in multi-summon
        const hasGoodPull = results.some(r => r.rarity !== 'common');
        if (!hasGoodPull && type === 'normal') {
            // Replace the worst pull with a Rare
            const worstIndex = results.findIndex(r => r.rarity === 'common');
            if (worstIndex !== -1) {
                results[worstIndex] = this.upgradeToRare(results[worstIndex], type);
            }
        }
        
        return { success: true, results, isMulti: true };
    }
    
    upgradeToRare(originalResult, type) {
        const rates = type === 'premium' ? this.premiumRates : this.rates;
        const contentType = this.getContentType('rare');
        
        let result;
        switch (contentType) {
            case 'character':
                result = this.getRandomCharacter('rare');
                if (result) {
                    const addResult = gameState.addCharacter(result.id);
                    result.isNew = addResult === true;
                    result.isDuplicate = addResult === 'duplicate';
                }
                break;
            case 'item':
                result = this.getRandomItem('rare');
                if (result) {
                    gameState.addItem(result.id);
                    result.isNew = true;
                }
                break;
            case 'skill':
                result = this.getRandomSkill('rare');
                if (result) {
                    gameState.addSkill(result.id);
                    result.isNew = true;
                }
                break;
        }
        
        return {
            success: true,
            rarity: 'rare',
            contentType,
            result,
            pityCounter: gameState.get('pityCounter')
        };
    }
    
    performSummon(type) {
        const rates = type === 'premium' ? this.premiumRates : this.rates;
        const pityCounter = gameState.get('pityCounter');
        
        // Pity system - guarantee legendary at 100 pulls
        let guaranteedLegendary = false;
        if (pityCounter >= this.pityThreshold - 1) {
            guaranteedLegendary = true;
        }
        
        let rarity;
        if (guaranteedLegendary) {
            rarity = 'legendary';
            gameState.set('pityCounter', 0);
        } else {
            const rarities = ['common', 'rare', 'epic', 'legendary'];
            const weights = rarities.map(r => rates[r]);
            rarity = weightedRandom(rarities, weights);
            
            if (rarity === 'legendary') {
                gameState.set('pityCounter', 0);
            } else {
                gameState.set('pityCounter', pityCounter + 1);
            }
        }
        
        // Increment total pulls
        gameState.set('totalPulls', gameState.get('totalPulls') + 1);
        
        // Determine what type of item to give
        const contentType = this.getContentType(rarity);
        
        let result;
        switch (contentType) {
            case 'character':
                result = this.getRandomCharacter(rarity);
                if (result) {
                    const addResult = gameState.addCharacter(result.id);
                    result.isNew = addResult === true;
                    result.isDuplicate = addResult === 'duplicate';
                }
                break;
            case 'item':
                result = this.getRandomItem(rarity);
                if (result) {
                    gameState.addItem(result.id);
                    result.isNew = true;
                }
                break;
            case 'skill':
                result = this.getRandomSkill(rarity);
                if (result) {
                    gameState.addSkill(result.id);
                    result.isNew = true;
                }
                break;
        }
        
        return {
            success: true,
            rarity,
            contentType,
            result,
            pityCounter: gameState.get('pityCounter')
        };
    }
    
    getContentType(rarity) {
        // Weighted random between character, item, skill
        const weights = [50, 35, 15]; // Characters most common
        const types = ['character', 'item', 'skill'];
        return weightedRandom(types, weights);
    }
    
    getRandomCharacter(rarity) {
        const pool = characters.filter(c => c.rarity === rarity);
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }
    
    getRandomItem(rarity) {
        const pool = items.filter(i => i.rarity === rarity);
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }
    
    getRandomSkill(rarity) {
        const pool = skills.filter(s => s.rarity === rarity);
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }
    
    getPityCount() {
        return gameState.get('pityCounter');
    }
    
    getPityProgress() {
        return (gameState.get('pityCounter') / this.pityThreshold) * 100;
    }
}

export const gacha = new Gacha();