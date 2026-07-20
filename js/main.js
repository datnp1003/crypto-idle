/**
 * js/main.js
 *
 * Crypto Idle — application entry point.
 * Bootstraps the idle engine and single-screen UI.
 */

import { gameState }       from './core/game-state.js';
import { idle }            from './core/idle.js';
import { initCryptoScreen } from './ui/crypto-screen.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🪙 Crypto Idle starting…');
  console.log('💰 Cash on load:', gameState.get('cash'));
  console.log('🐋 Prestige points:', gameState.get('prestigePoints'));

  // Initialise UI first so it can subscribe before idle starts ticking
  initCryptoScreen();

  // Start the passive income tick
  idle.start();

  console.log('✅ Crypto Idle ready.');
});