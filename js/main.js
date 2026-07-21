/**
 * js/main.js
 *
 * Crypto Idle — application entry point.
 * Bootstraps the idle engine and single-screen UI.
 */

import { gameState }       from './core/game-state.js';
import { idle }            from './core/idle.js';
import { initCryptoScreen } from './ui/crypto-screen.js';
import { loadGameConfig }  from './data/game-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🪙 Crypto Idle starting…');

  // Load dynamic config from API before initialising UI/idle.
  // Falls back to static data automatically on failure.
  if (typeof fetch !== 'undefined') {
    await loadGameConfig();
  }

  console.log('💰 Cash on load:', gameState.get('cash'));
  console.log('🐋 Prestige points:', gameState.get('prestigePoints'));

  // Initialise UI first so it can subscribe before idle starts ticking
  initCryptoScreen();

  // Start the passive income tick
  idle.start();

  console.log('✅ Crypto Idle ready.');
});