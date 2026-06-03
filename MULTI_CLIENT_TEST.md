# Multi-Client Sync Test: Friend Duel Ready Room

## Overview

The 6th chantier has implemented a **status ribbon** and **event log** to visualize room state transitions in the Friend Duel ready room. This document explains how to validate multi-client synchronization with two browser sessions.

## Status Ribbon States

The ribbon displays one of these status labels:

- **NO DUEL** (yellow/accent color)
  - No duel is locked yet; room is in idle state
  - Show when `armedDuelId` is null

- **VERROUILLE, ATTENTE** (yellow/locked class)
  - Duel is locked, waiting for readiness signals
  - Show when `armedDuelId` is set, no countdown active, no one ready yet

- **TU ES READY** (green/ready class)
  - You have toggled readiness on
  - Show when `roomReady` is true but opponent is not ready

- **ADVERSAIRE READY** (green/ready class)
  - Opponent has toggled readiness on
  - Show when `opponentReady` is true but you are not ready

- **LES DEUX READY!** (green/ready class)
  - Both players are ready; duel is about to auto-launch
  - Show when both `roomReady` and `opponentReady` are true

- **COUNTDOWN: N** (pulsing red/countdown class, animation)
  - Auto-launch in N seconds (where N = 3, 2, 1, 0)
  - Show when countdown timer is active
  - CSS applies `pulse` animation (opacity oscillation) for visual urgency

## Event Log

Below the status ribbon, an optional event log shows the last **5 room state transitions**. Each log entry displays:

```
[HH:MM:SS] Event description
```

### Events Logged:

1. **Duel Locked**
   - Triggered in `handleAccept()` when challenge is accepted
   - Event: `"✓ Duel verrouillé, salon ouvert."` (FR) / `"✓ Duel locked, room open."` (EN)

2. **READY Toggle**
   - Triggered in READY button `onClick` after API success
   - Event: `"✓ Tu es READY!"` (FR) / `"✓ You are READY!"` (EN) when toggling on
   - Event: `"✗ Tu as retire READY."` (FR) / `"✗ You unset READY."` (EN) when toggling off

3. **Auto-Launch Started**
   - Triggered when countdown begins (both players ready)
   - Event: `"▸ Les deux READY! Lancement auto..."` (FR) / `"▸ Both READY! Auto-launch..."` (EN)

---

## Multi-Client Test Scenario

### Setup

1. Start two separate browser sessions (or two browser tabs with different user agents):
   - **Session A**: Player (Port 5174)
   - **Session B**: Opponent1 (Port 5174, same server)

2. Create two users:
   - Session A: Use default or create "Player"
   - Session B: Create "Opponent1" via the UI or directly in mvp_db.json

### Test Flow

#### Step 1: Player Sends Challenge

**Session A (Player):**

1. Navigate to Friend Duel tab
2. Select "Opponent1" as opponent
3. Set stake to SLAP$ 5
4. Click "Send Challenge"
5. Verify:
   - Status ribbon shows: **NO DUEL** (but challenge is outgoing, not locked yet)
   - Event log is empty (room state not yet armed)
   - Outgoing challenges section shows challenge to Opponent1

#### Step 2: Opponent Accepts Challenge → Room Locked

**Session B (Opponent1):**

1. Refresh or navigate to Friend Duel tab
2. Wait for refresh (7s poll interval) or click away/back to trigger reload
3. Verify incoming challenge from Player
4. Click "Accept (lock duel)" button on incoming challenge
5. Observe:
   - Room card transitions from idle to locked state
   - Lock ID appears in "No duel locked" → `[Lock: <8-char ID>]`
   - **Event log shows**: `"✓ Duel locked, room open."` with timestamp
   - Status ribbon changes to: **VERROUILLE, ATTENTE** (yellow, locked state)

**Session A (Player, should auto-sync via 7s poll):**

1. Wait 1-2 seconds or navigate away/back to trigger manual refresh
2. Verify:
   - Lock ID appears in room card
   - Status ribbon updates to: **VERROUILLE, ATTENTE**
   - Opponent signal shows: "READY confirmed" → "Joining room..." (after lock)
   - Event log is still empty on Player side (events are per-session, not synchronized)

#### Step 3: Player Toggles READY

**Session A (Player):**

1. Click "I am READY" button
2. Verify immediately:
   - Button text changes to "Unset READY"
   - Local "You: Ready" signal updates
   - **Event log shows** (NEWEST at top): `"✓ You are READY!"` (1 event)
   - **Status ribbon updates to**: **TU ES READY** (green, ready state)
   - Room state is sent via `POST /api/duels/:id/ready` with `userId=...` and `ready=true`

**Session B (Opponent1, after 7s poll or manual refresh):**

1. Wait or navigate to trigger refresh
2. Verify:
   - "Opponent: Waiting for room..." → "Opponent: READY confirmed"
   - **Status ribbon updates to**: **ADVERSAIRE READY** (green, opponent ready)
   - Opponent's event log shows `"✓ Tu es READY!"` (opponent's readiness from polling)
   - No countdown yet (only one player ready)

#### Step 4: Opponent Toggles READY → Both Ready → Countdown

**Session B (Opponent1):**

1. Click "I am READY" button
2. Verify:
   - Button changes to "Unset READY"
   - Local signal shows "You: Ready"
   - **Event log shows** (NEWEST): `"✓ You are READY!"` (1 event)
   - **Status ribbon updates to**: **LES DEUX READY!** (green, both ready)
   - Server detects both ready, sets `readyCountdownAt` to current timestamp
   - Countdown begins (3 seconds)

**Session A (Player, after 7s poll or immediate if you're watching):**

1. Wait 1-2 seconds or refresh manually
2. Verify almost immediately (within 1s):
   - Opponent signal shows "READY confirmed"
   - **Event log shows** (NEWEST): `"▸ Both READY! Auto-launch..."` (1 or 2 events total)
   - **Status ribbon pulses red**: `"COUNTDOWN: 3"` (with CSS animation)
   - Countdown visible in signals: "Countdown: 3"
   - Countdown decrements to 2, 1, 0 on subsequent 1-second ticks

**Session B (Opponent1, same observation):**

1. Status ribbon also shows countdown: `"COUNTDOWN: 3"` → `"COUNTDOWN: 2"` → `"COUNTDOWN: 1"` → `"COUNTDOWN: 0"`
2. Ribbon pulses (animation) to indicate urgency
3. Event log reflects auto-launch trigger

#### Step 5: Duel Auto-Plays

When countdown reaches 0 (after ~3 seconds):

1. Both sessions call `POST /api/duels/:id/play` automatically
2. Duel result is computed server-side
3. Room state clears: `armedDuelId = null`, `roomState = null`
4. **Status ribbon resets to**: **NO DUEL**
5. **Event log clears** (on any opponent change or duel completion)
6. Game result appears in result section with net SLAP$ change

---

## Validation Checklist

### Synchronization ✅

- [ ] **Lock ID matches on both sessions** after accept
  - Session A and B should show identical lock ID in room card
- [ ] **Status ribbon reflects same state** (with <2s delay due to 7s polling)
  - Example: If Session B shows "LES DEUX READY!", Session A should see it within 1-2s
- [ ] **Countdown value is synchronized** across both screens
  - Both sessions show same countdown number (3, 2, 1, 0)
  - Countdown reaches 0 simultaneously (within 1 second)
- [ ] **Duel result resolves** on both sessions after countdown ends

### Event Log ✅

- [ ] **Event log appears** only after first state change (lock or ready toggle)
- [ ] **Events are chronological** with [HH:MM:SS] timestamps
- [ ] **Last 5 events retained** (older events scroll out if >5 total)
- [ ] **Log entries are human-readable** (no raw JSON or object references)

### UI Responsiveness ✅

- [ ] **Status ribbon updates within <2s** when polling fetches new room state
- [ ] **Countdown animation pulses** (visual feedback on time pressure)
- [ ] **Buttons disable appropriately** during loading/countdown
- [ ] **No console errors** in browser DevTools (F12 → Console tab)

---

## Manual Test Steps (Quick Verification)

### For Single-Client Testing (One Browser Tab)

If you want to verify the ribbon without two separate users:

1. **Create Instant Duel** (skip room, auto-plays)
   - Status ribbon will briefly show **NO DUEL** (no locked duel in ready room)
   - Does not exercise ready room flow

2. **Create Locked Duel** (more realistic):
   - In `mvp_db.json`, manually create two challenges between two users
   - Use API endpoint to accept one challenge
   - Use `GET /api/duels/:id/room?userId=...` to fetch room state directly
   - Observe status ribbon in UI after accepting

### For API-Level Testing

```bash
# 1. Create two users
curl -X POST http://localhost:8787/api/users -H "Content-Type: application/json" \
  -d '{"name":"Player1"}'
curl -X POST http://localhost:8787/api/users -H "Content-Type: application/json" \
  -d '{"name":"Player2"}'

# 2. Create and accept a challenge
CHALLENGE_ID=$(curl -X POST http://localhost:8787/api/challenges \
  -H "Content-Type: application/json" \
  -d '{"challengerId":"<player1-id>","opponentId":"<player2-id>","stake":5}' | jq -r '.challenge.id')

DUEL_ID=$(curl -X POST http://localhost:8787/api/challenges/$CHALLENGE_ID/accept \
  -H "Content-Type: application/json" \
  -d '{"userId":"<player2-id>"}' | jq -r '.duel.id')

# 3. Query room state
curl -X GET "http://localhost:8787/api/duels/$DUEL_ID/room?userId=<player1-id>"

# 4. Toggle readiness
curl -X POST http://localhost:8787/api/duels/$DUEL_ID/ready \
  -H "Content-Type: application/json" \
  -d '{"userId":"<player1-id>","ready":true}'

# 5. Check countdown auto-trigger
curl -X GET "http://localhost:8787/api/duels/$DUEL_ID/room?userId=<player2-id>"
```

---

## Browser Workaround for Two Sessions

If you don't have access to multiple browser windows/tabs easily:

1. **Option A: Incognito Window**
   - Open 1st session in normal window
   - Open 2nd session in Incognito/Private window (same localhost, different session storage)

2. **Option B: Different Browser**
   - Session A in Chrome
   - Session B in Firefox

3. **Option C: Remote Session**
   - Session A: `http://localhost:5174`
   - Session B: `http://<your-machine-ip>:5174` (from another device or VM)

---

## Expected Behavior: Full Sync Example

### Timeline (Both Sessions Side-by-Side)

```
Time  | Session A (Player)           | Session B (Opponent1)
------|-----------------------------|---------------------------------
0s    | Status: NO DUEL             | [Waiting for incoming challenge]
      | Event log: empty            |
------|-----------------------------|---------------------------------
5s    | [Sends challenge]            | [Receives & accepts challenge]
      | Status: NO DUEL             | Lock ID appears
      | Event log: empty            | Event: ✓ Duel locked...
      |                             | Status: VERROUILLE, ATTENTE
------|-----------------------------|---------------------------------
7s    | [7s poll triggers]          |
      | Lock ID appears             |
      | Status: VERROUILLE, ATTENTE |
      | Event log: empty            |
------|-----------------------------|---------------------------------
10s   | [Clicks READY]              |
      | Status: TU ES READY         |
      | Event: ✓ Tu es READY!       |
------|-----------------------------|---------------------------------
11s   |                             | [7s poll triggers]
      |                             | Status: ADVERSAIRE READY
      |                             | Opponent signal: READY confirmed
------|-----------------------------|---------------------------------
12s   |                             | [Clicks READY]
      |                             | Status: LES DEUX READY!
      |                             | Event: ▸ Both READY! Auto-launch...
      |                             | Countdown begins (3 → 2 → 1 → 0)
------|-----------------------------|---------------------------------
13s   | [Poll or manual refresh]    |
      | Status: COUNTDOWN 3 (pulse) |
      | Event: ▸ Both READY!...     |
      | Countdown: 3 → 2 → 1 → 0   |
------|-----------------------------|---------------------------------
16s   | [Duel auto-plays]           | [Duel auto-plays]
      | Status: NO DUEL             | Status: NO DUEL
      | Result section shows result | Event log clears
      |                             |
```

---

## Debugging Tips

### Check Room State API Response

Open DevTools (F12) and in Console:

```javascript
// Check current room state (run in browser console)
await fetch('/api/duels/<duel-id>/room?userId=<your-user-id>')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Monitor Polling

Open Network tab (DevTools → Network) and filter for `room?userId`. You should see:
- `GET /api/duels/:id/room` every 7 seconds (polling interval)
- Status 200 with room state JSON

### Verify Event Log

The event log is stored in component state `[roomEvents, setRoomEvents]`:
- Max 5 entries (older ones are removed)
- Events are added by calling `addRoomEvent(msg)` helper
- Each event has `{ time: "HH:MM:SS", event: "message" }`

---

## Cleanup After Test

1. Optional: Reset database to clear duels/challenges
   - Delete or backup `api/data/mvp_db.json`
   - Restart API server

2. Clear browser storage (optional):
   - DevTools → Application → Clear Site Data

3. Close additional browser sessions

---

## Next Steps (After Validation)

- [ ] Document any sync discrepancies or lag observations
- [ ] Measure average polling latency (time from action on one session to UI update on other)
- [ ] Consider WebSocket/SSE upgrade if polling lag is noticeable (>3s)
- [ ] Archive this test run with screenshots/timestamps
