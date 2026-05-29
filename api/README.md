# SLAP$TAX MVP API

Backend API for SLAP$TAX MVP: player profiles, duel simulation, tournament simulation, wallet, and stats persistence.

## Quick Start

```bash
npm start
```

API will listen on `http://localhost:8787`

## Endpoints

### Health Check
```
GET /api/health
```
Returns server status.

### State (Full)
```
GET /api/state
```
Returns complete player state (name, wallet, stake, history, stats).

### Player Profile
```
POST /api/profile
Content-Type: application/json

{
  "playerName": "Alice"
}
```

### Stake Configuration
```
POST /api/stake

{
  "stake": 5
}
```
Allowed: `2, 5, 10, 20`

### Wallet Top-up
```
POST /api/wallet/topup

{
  "amount": 50
}
```

### Play Duel (Best-of-3)
```
POST /api/duel/play

{
  "stake": 5
}
```

Response includes:
- `duel.won`: boolean
- `duel.rounds`: array of 3 rounds with scores
- `duel.net`: profit/loss
- `wallet`: updated balance
- `stats`: match counts

### Play Tournament
```
POST /api/tournament/simulate

{
  "size": 8,
  "stake": 5
}
```

Allowed sizes: `8, 16, 32`

Response includes:
- `tournament.champion`: whether player won
- `tournament.rounds`: depth of bracket (log2(size))
- `tournament.run`: array of round results
- `tournament.net`: profit/loss
- `wallet`: updated balance
- `stats`: match counts

### Stats
```
GET /api/stats
```

Returns: `{ matches, wins, losses, winRate }`

### History
```
GET /api/history
```

Returns: array of all past matches.

### Reset Data
```
POST /api/reset
```

Clears all state and reinitializes.

## Data Persistence

- Player state stored in `data/mvp_db.json`
- Wallet, profile, stake, match history all persisted automatically.

## Example Workflow

```bash
# Start server
npm start

# In another terminal:

# Check health
curl http://localhost:8787/api/health

# Get initial state
curl http://localhost:8787/api/state

# Set player name
curl -X POST http://localhost:8787/api/profile \
  -H 'Content-Type: application/json' \
  -d '{"playerName": "Alex"}'

# Play a duel with 5 EUR stake
curl -X POST http://localhost:8787/api/duel/play \
  -H 'Content-Type: application/json' \
  -d '{"stake": 5}'

# Check updated stats
curl http://localhost:8787/api/stats

# Play a tournament (8 players, 5 EUR entry)
curl -X POST http://localhost:8787/api/tournament/simulate \
  -H 'Content-Type: application/json' \
  -d '{"size": 8, "stake": 5}'

# See full history
curl http://localhost:8787/api/history

# Reset everything
curl -X POST http://localhost:8787/api/reset
```

## Architecture

- Pure Node.js (no external dependencies).
- In-memory request handling + JSON file storage.
- CORS headers enabled for cross-origin frontend calls.
- Error responses clearly indicate validation issues.

## TODOs for Production

- Authentication (JWT or OAuth).
- Real-money integration (Stripe/Mangopay).
- Database (PostgreSQL).
- Rate limiting and abuse protection.
- Logging and monitoring.
- Unit tests.
