# Crypto Idle

A mobile-friendly browser crypto idle game: click to mine, hire staff for passive profit, buy upgrades in bulk, catch random airdrops, and prestige into Whale Points.

## Run

Static mode:

```bash
cd /home/datnguyen/game
python3 -m http.server 8000
```

Open http://localhost:8000.

Dynamic mode (Node server with API):

```bash
node server/server.js
```

Open http://localhost:3000. Serves the same game plus `/api/health`.

ES modules require HTTP; direct `file://` opening will fail.

## Current Mechanics

- Click **Mine Block** to earn cash.
- **Diamond Hands** doubles click value per level and costs `2^level * 100`.
- Hire up to 500 of each staff module for passive profit.
- Staff and upgrades support global/bulk buy modes: `×1`, `×10`, `MAX`.
- Money formats with idle suffixes: `K, M, B, T, Qa, Qi, ... Dc, aa, ab...`.
- Random airdrop/pump event gives `×10` profit/s for 1 hour and shows a falling airdrop animation.
- Prestige resets progress for Whale Points:
  - requirement rises by `×10` each point: `$1M`, `$10M`, `$100M`, `$1B`...
  - each point gives `+10%` permanent multiplier.

## Tech Stack

- Vanilla HTML/CSS/ES modules, no build step.
- `js/core/economy.js` — pure economy formulas.
- `js/core/game-state.js` — save/load and state updates.
- `js/core/idle.js` — passive tick/offline rewards.
- `js/data/crypto-staff.js` — staff and upgrade data.
- `js/data/number-format.js` — idle money suffix formatting.
- `js/ui/crypto-screen.js` — DOM UI renderer.

## Database Seed

```bash
node server/seed-data.js
```

## Checks

```bash
node js/core/economy.test.js
node --check js/main.js
node --check js/ui/crypto-screen.js
node --check js/core/economy.js
node --check js/core/game-state.js
```

## Save

Progress is saved to `localStorage` under `crypto_idle_save_v1`.
