import { gameState } from './game-state.js';
import { enemies } from '../data/enemies.js';
import { randomInt } from '../utils/random.js';

class Battle {
    constructor() {
        this.currentEnemy = null;
        this.enemyMaxHp = 0;
        this.battleLog = [];
        this.isBattleActive = false;
        this.battleInterval = null;
        this.logElement = null;
    }
    
    init(logElement) {
        this.logElement = logElement;
        this.startBattle();
    }
    
    startBattle() {
        const stage = gameState.get('stage');
        this.currentEnemy = this.getEnemyForStage(stage);
        this.enemyMaxHp = this.currentEnemy.stats.hp;
        this.isBattleActive = true;
        
        this.addLog(`⚔️ Stage ${stage}: ${this.currentEnemy.name} appears!`);
        this.updateEnemyDisplay();
        
        if (!this.battleInterval) {
            this.battleInterval = setInterval(() => this.battleTick(), 1000);
        }
    }
    
    getEnemyForStage(stage) {
        // Boss every 10 stages
        if (stage % 10 === 0) {
            const bossIndex = Math.min(Math.floor(stage / 10) - 1, enemies.filter(e => e.isBoss).length - 1);
            const boss = enemies.filter(e => e.isBoss)[bossIndex];
            return { ...boss, stats: { ...boss.stats } }; // Clone stats
        }
        
        // Regular enemies scale with stage
        const regularEnemies = enemies.filter(e => !e.isBoss);
        const enemy = regularEnemies[Math.floor(Math.random() * regularEnemies.length)];
        
        // Scale stats with stage
        const scaleFactor = 1 + (stage - 1) * 0.2;
        return {
            ...enemy,
            stats: {
                hp: Math.floor(enemy.stats.hp * scaleFactor),
                atk: Math.floor(enemy.stats.atk * scaleFactor),
                def: Math.floor(enemy.stats.def * scaleFactor)
            }
        };
    }
    
    battleTick() {
        if (!this.isBattleActive) return;
        
        const party = gameState.getPartyCharacters();
        if (party.length === 0) {
            this.addLog('⚠️ No party members! Add characters to your party.');
            return;
        }
        
        // Party attacks enemy
        party.forEach(char => {
            if (this.currentEnemy.stats.hp <= 0) return;
            
            const damage = this.calculateDamage(char.stats.atk, this.currentEnemy.stats.def);
            this.currentEnemy.stats.hp -= damage;
            
            this.addLog(`${char.icon} ${char.name} deals ${damage} damage!`, 'damage');
            this.updateEnemyDisplay();
            
            // Check if enemy defeated
            if (this.currentEnemy.stats.hp <= 0) {
                this.enemyDefeated();
            }
        });
        
        // Enemy attacks party (if still alive)
        if (this.currentEnemy.stats.hp > 0 && party.length > 0) {
            const target = party[randomInt(0, party.length - 1)];
            const damage = this.calculateDamage(this.currentEnemy.stats.atk, target.stats.def);
            target.stats.hp -= damage;
            
            this.addLog(`${this.currentEnemy.icon} ${this.currentEnemy.name} hits ${target.name} for ${damage} damage!`, 'damage');
            
            // Check if party member defeated
            if (target.stats.hp <= 0) {
                this.addLog(`💀 ${target.name} has fallen!`, 'damage');
                // For prototype, just log it - don't remove from party
            }
        }
    }
    
    calculateDamage(atk, def) {
        const baseDamage = atk * (1 + Math.random() * 0.2); // 20% variance
        const defense = def * 0.5;
        return Math.max(1, Math.floor(baseDamage - defense));
    }
    
    enemyDefeated() {
        const stage = gameState.get('stage');
        const isBoss = this.currentEnemy.isBoss;
        
        // Calculate rewards
        const goldReward = Math.floor(10 * stage * (isBoss ? 5 : 1));
        const soulsReward = Math.floor(1 * stage * (isBoss ? 3 : 1));
        
        gameState.updateCurrency('gold', goldReward);
        gameState.updateCurrency('souls', soulsReward);
        
        this.addLog(`🎉 ${this.currentEnemy.name} defeated!`, 'loot');
        this.addLog(`💰 +${goldReward} Gold, +${soulsReward} Souls`, 'loot');
        
        // Advance stage
        gameState.set('stage', stage + 1);
        
        // Start next battle
        setTimeout(() => {
            if (this.isBattleActive) {
                this.startBattle();
            }
        }, 1000);
    }
    
    addLog(message, type = '') {
        this.battleLog.push({ message, type });
        
        // Keep only last 50 messages
        if (this.battleLog.length > 50) {
            this.battleLog.shift();
        }
        
        if (this.logElement) {
            const p = document.createElement('p');
            p.textContent = message;
            if (type) p.className = type;
            this.logElement.appendChild(p);
            this.logElement.scrollTop = this.logElement.scrollHeight;
        }
    }
    
    updateEnemyDisplay() {
        const enemyDisplay = document.getElementById('enemy-display');
        if (!enemyDisplay) return;
        
        const hpPercent = Math.max(0, (this.currentEnemy.stats.hp / this.enemyMaxHp) * 100);
        
        enemyDisplay.innerHTML = `
            <div class="enemy-slot">
                <div>${this.currentEnemy.icon}</div>
                <div style="font-size: 0.7rem; margin-top: 5px;">${this.currentEnemy.name}</div>
                <div style="width: 80%; height: 5px; background: #333; border-radius: 3px; margin-top: 3px;">
                    <div style="width: ${hpPercent}%; height: 100%; background: #ff4444; border-radius: 3px;"></div>
                </div>
            </div>
        `;
    }
    
    stop() {
        this.isBattleActive = false;
        if (this.battleInterval) {
            clearInterval(this.battleInterval);
            this.battleInterval = null;
        }
    }
    
    resume() {
        this.isBattleActive = true;
        if (!this.battleInterval) {
            this.battleInterval = setInterval(() => this.battleTick(), 1000);
        }
    }
}

export const battle = new Battle();