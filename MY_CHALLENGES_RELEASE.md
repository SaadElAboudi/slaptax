# My Challenges and History

## Entry Points

- Home: `Mes defis`, or `/?tab=challenges` directly.
- Navigation: `Mes defis` and `Historique`. On mobile the global leaderboard remains accessible from Home; the bottom bar keeps five destinations.
- Link challenge briefing and result: `Mes defis et resultats`.

## Results

The authenticated anonymous-session endpoint `GET /api/link-challenges/mine?userId=...&clientId=...` lists created and entered link challenges, with progress counts, expiry, shared-rank ties and completed participants' scores. It never returns target colors, drawing paths or unfinished players' scores. Standings stay hidden until the viewer finishes their own attempt. Hosts see their friends' completed results. The screen refreshes every ten seconds and has a manual refresh action.

Each completed attempt also writes a compact `user.linkHistory` entry. A creator has a creation entry and one comparison per completed guest; each guest has one comparison against the creator. Stable IDs prevent duplicate entries on reload, polling or process restart. The newest 100 entries per player are retained, without changing wallets, ranked histories, win rates or progression.

Existing retained link challenges are backfilled when the owner opens My Challenges or History. Expired invitations are backfilled before normal invitation cleanup. Compact history survives removal of the original invitation, but its full replay/standings no longer remain available after cleanup. Invitations already removed before this change cannot be recovered.

## History Fix

The previous history only read ranked match history. Link challenges never wrote there, and practice only retained best scores. The new history separates matches, link challenges and solo sessions; it does not interpret a zero balance change as a victory. Loading failures appear as errors with a retry action instead of a false empty state. Requests wait for the anonymous identity and stale responses are ignored on navigation.

Display-name changes previously created a new player ID, detaching the session from its previous history and invitations. Renaming now preserves the ID, wallet, ranked history, link history and challenge ownership. Older identities already detached by the previous behavior are not automatically merged by name: that would risk attributing another player's results to the wrong session.

New completed solo sessions are kept in browser storage, scoped to the player, capped at 100 entries, and labeled `SOLO - CET APPAREIL`. They never affect competitive stats. Historical solo sessions cannot be recreated from a best score alone. Clearing browser storage removes this local solo history.

## Verification and Boundaries

Validated on 2026-09-15: 137 server tests passed, production web build passed, and all 8 targeted Chromium desktop/mobile scenarios passed after the nickname fix. Creator standings, link history and solo history screenshots were inspected, including the 320px solo/history layout. The desktop browser test also changes the nickname and verifies that the player ID and solo history survive reload.

Server: `node --test --test-reporter=dot api/tests`.

Web: `npm --prefix web run build` and, from `web`, `npx playwright test e2e/asyncChroma.spec.ts e2e/club.spec.ts e2e/historyErrors.spec.ts`.

Coverage includes session ownership, score privacy, shared-rank ties, old result recovery, idempotence, history surviving invitation cleanup, creator/guest views, filters, solo completion and reload, error/retry states, desktop and mobile layouts. No production deployment, physical iPhone verification or mass-traffic load test is included.
