import { gameState } from './game-state.js';

class Rewards {
    constructor() {
        this.achievements = [
            { id: 'stage10', name: 'Stage 10', desc: 'Clear Stage 10', condition: () => gameState.get('stage') > 10, reward: { gems: 10 }, claimed: false },
            { id: 'stage25', name: 'Stage 25', desc: 'Clear Stage 25', condition: () => gameState.get('stage') > 25, reward: { gems: 25 }, claimed: false },
            { id: 'stage50', name: 'Stage 50', desc: 'Clear Stage 50', condition: () => gameState.get('stage') > 50, reward: { gems: 50 }, claimed: false },
            { id: 'stage100', name: 'Stage 100', desc: 'Clear Stage 100', condition: () => gameState.get('stage') > 100, reward: { gems: 100 }, claimed: false },
            { id: 'pull10', name: 'First Pull', desc: 'Perform 10 gacha pulls', condition: () => gameState.get('totalPulls') >= 10, reward: { gems: 10 }, claimed: false },
            { id: 'pull50', name: 'Gacha Lover', desc: 'Perform 50 gacha pulls', condition: () => gameState.get('totalPulls') >= 50, reward: { gems: 20 }, claimed: false },
            { id: 'pull100', name: 'Gacha Addict', desc: 'Perform 100 gacha pulls', condition: () => gameState.get('totalPulls') >= 100, reward: { gems: 50 }, claimed: false },
            { id: 'gold10k', name: 'Rich', desc: 'Earn 10,000 Gold total', condition: () => gameState.get('totalGoldEarned') >= 10000, reward: { gems: 15 }, claimed: false },
            { id: 'gold100k', name: 'Tycoon', desc: 'Earn 100,000 Gold total', condition: () => gameState.get('totalGoldEarned') >= 100000, reward: { gems: 30 }, claimed: false },
            { id: 'chars5', name: 'Collector', desc: 'Own 5 characters', condition: () => gameState.get('inventory').characters.length >= 5, reward: { gems: 15 }, claimed: false },
        ];
    }
    
    getClaimableRewards() {
        const claimed = gameState.get('claimedAchievements') || [];
        return this.achievements.filter(a => !claimed.includes(a.id) && a.condition());
    }
    
    claimAchievement(achievementId) {
        const claimed = gameState.get('claimedAchievements') || [];
        if (claimed.includes(achievementId)) return false;
        
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement || !achievement.condition()) return false;
        
        claimed.push(achievementId);
        gameState.set('claimedAchievements', claimed);
        
        if (achievement.reward.gems) {
            gameState.updateCurrency('gems', achievement.reward.gems);
        }
        if (achievement.reward.gold) {
            gameState.updateCurrency('gold', achievement.reward.gold);
        }
        
        return achievement;
    }
    
    claimAll() {
        const claimable = this.getClaimableRewards();
        let totalGems = 0;
        
        claimable.forEach(a => {
            const result = this.claimAchievement(a.id);
            if (result) {
                totalGems += result.reward.gems || 0;
            }
        });
        
        return totalGems;
    }
    
    getDailyReward() {
        const lastClaim = gameState.get('lastDailyClaim') || 0;
        const now = Date.now();
        const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
        
        if (hoursSinceLastClaim >= 24) {
            return { available: true, gems: 10 + Math.floor(gameState.get('stage') / 10) };
        }
        
        const hoursLeft = 24 - hoursSinceLastClaim;
        return { available: false, hoursLeft: Math.ceil(hoursLeft) };
    }
    
    claimDaily() {
        const daily = this.getDailyReward();
        if (!daily.available) return false;
        
        gameState.updateCurrency('gems', daily.gems);
        gameState.set('lastDailyClaim', Date.now());
        
        return daily;
    }
}

export const rewards = new Rewards();