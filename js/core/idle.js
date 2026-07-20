import { gameState } from './game-state.js';
import { STAFF } from '../data/crypto-staff.js';
import { profitPerSecond } from './economy.js';

const PUMP_CHANCE_PER_TICK = 0.00002;

class Idle {
  constructor() {
    this.tickInterval = null;
    this.saveInterval = null;
    this.lastTick = Date.now();
  }

  start() {
    this.lastTick = Date.now();
    gameState.set('lastOnlineTime', this.lastTick);
    this.tickInterval = setInterval(() => this.tick(), 100);
    this.saveInterval = setInterval(() => this.save(), 30000);
  }

  tick() {
    const now = Date.now();
    const deltaSec = (now - this.lastTick) / 1000;
    this.lastTick = now;

    const state = gameState.state;
    const pps = profitPerSecond(state, STAFF, now);
    if (pps > 0) {
      gameState.addCash(pps * deltaSec);
    }

    if (state.eventUntil <= now && Math.random() < PUMP_CHANCE_PER_TICK) {
      gameState.triggerPump(now);
    }
  }

  updateUI() {}



  save() {
    gameState.state.lastOnlineTime = Date.now();
    gameState.save();
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    this.save();
  }

  getOfflineProgress() {
    const state = gameState.state;
    const now = Date.now();
    const elapsed = now - state.lastOnlineTime;
    const maxMs = 8 * 60 * 60 * 1000;
    const cappedMs = Math.min(elapsed, maxMs);
    if (cappedMs < 1000) return null;
    const seconds = cappedMs / 1000;
    const pps = profitPerSecond(state, STAFF, now);
    return { cash: pps * seconds, time: cappedMs };
  }

  claimOfflineRewards() {
    const progress = this.getOfflineProgress();
    if (!progress) return 0;
    gameState.addCash(progress.cash);
    gameState.state.lastOnlineTime = Date.now();
    gameState.save();
    return progress.cash;
  }
}

export const idle = new Idle();
