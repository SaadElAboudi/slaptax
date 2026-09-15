# CHROMA link challenges and online presence

## Delivered

- Home's main friend challenge opens asynchronous CHROMA. Live duels remain available from the game library; matchmaking and tournaments are unchanged.
- CHROMA joins TRACE and DECOUPE in the existing seven-day, wallet-neutral link challenge flow.
- Three server-generated RGB targets, identical for every participant. Targets appear only during observation and after their round; opponent scores and colors remain hidden until completion.
- One attempt per anonymous session and link. Original server deadlines survive reloads and process restarts. Unattended attempts use their last accepted draft, or neutral gray.
- Final comparison covers all three colors, with cumulative Euclidean RGB error (lower is better), existing image sharing/export, link sharing, and a new-colors rematch link.
- Reconnecting to an unfinished mix restores the saved draft in the picker.
- Existing creation and participation limits remain: 20 new challenges per day per session, 5,000 unexpired links, 1,000 participants per link.

## Presence Contract

`GET /api/presence` returns `{ onlinePlayers, updatedAt, scope: "instance" }` with `Cache-Control: no-store`. No player identifiers are exposed.

The count uses open WebSocket connections whose client ID matches the anonymous session owner. Multiple tabs and channels for one player count once. Persisted `presence.online` flags and unverified connections are not counted. Ping/pong heartbeats remove broken connections, normally within 50 seconds; records older than 60 seconds are excluded defensively.

Home refreshes on connection and presence events, and every 10 seconds. A failed or invalid response displays unavailable, never a fabricated zero. This measures connected sessions, including idle/background tabs, not humans actively touching the screen and not available matchmaking opponents.

## Deployment Boundaries

- This is a single-instance count, matching the current realtime architecture. Multiple API replicas require shared presence and coordinated game state before reporting a global total.
- Anonymous sessions are not strong anti-cheat identity. Clearing browser storage allows another session. Do not treat these friendly link results as secure ranked or money-backed competition.
- Rematch creates a fresh shareable challenge, not an automatic notification or tracked multi-match series. Personal progression and ranked matchmaking are separate next steps.
- Current whole-state storage and per-attempt polling are not load-tested for mass traffic. A production scale-out needs bounded per-challenge storage, retention jobs, rate limiting and load tests.
- No production deployment or database changes performed for this release.

## Verification

Validated on 2026-09-15: 134 server tests passed; production web build passed; 18 targeted desktop/mobile browser scenarios passed. A final six-test CHROMA/home run also passed after adding mid-mix reload checks and immediate presence refresh. Screenshots were inspected on desktop and mobile, including the 320px home layout. No load test or full 124-test browser regression run was performed for this increment.

Run `node --test --test-reporter=dot api/tests`, `npm --prefix web run build`, and from `web`, `npx playwright test e2e/asyncChroma.spec.ts e2e/club.spec.ts e2e/drawing.spec.ts`.

Tests cover identical targets, privacy, server scoring, draft recovery, deadline enforcement, restart recovery, duplicate sockets, invalid sessions, stale heartbeat records, offline host gameplay, persisted results, new challenge links and unavailable presence. Browser coverage uses Chromium desktop and mobile emulation, not physical iOS devices.
