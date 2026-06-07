# SLAP$TAX Viral Product Roadmap

## North Star

Percentage of new players who trigger a rematch or invite another player within
five minutes of starting their first match.

Supporting metrics:

- time from home screen to matchmaking queue;
- time from queue entry to first playable round;
- first-match completion rate;
- rematch request rate;
- invite creation and invite claim rate;
- day-1 and day-7 retention;
- matches per social room;
- shared-result conversion rate.

## Product Principles

- A new player must understand the main action immediately.
- The first meaningful interaction should require one tap.
- Rivalry and memorable moments matter more than feature count.
- Progression is cosmetic and expressive, never pay-to-win.
- Empty social surfaces must not pretend to be active.
- Retention should come from mastery, friendship and anticipation rather than
  punitive timers or manipulative rewards.

## Phase 1 - Instant Play

Status: foundation shipped

- Make `PLAY NOW` the primary home action.
- Enter matchmaking without draft, stake or format configuration.
- Preserve and recover queue state across navigation and reconnection.
- Target a playable first round in less than ten seconds when another human is
  available.
- Show an honest searching state and allow training while waiting.
- Instrument first-play latency, match found and first-match completion.

Success criteria:

- 70% of onboarded users enter a game or queue within 30 seconds.
- Median first-play latency below 10 seconds with available concurrency.
- Less than 10% unexplained queue abandonment.

## Phase 2 - Rivalry Loop

Status: in progress

- One-tap rematch with live accept/decline state. Shipped.
- `Change game` and `Double stake` options after a duel. Shipped.
- Head-to-head card with wins, streak, best game and recent results. Shipped.
- Lightweight preset reactions before and after rounds.
- Last-rival and favorite-rival shortcuts from the home screen. Shipped.
- Daily rival shortcut.

Success criteria:

- Rematch request rate above 35%.
- 25% of first-time losers play again within five minutes.

## Phase 3 - Viral Rooms

- Shareable room links for 4, 8 or 16 players.
- Host-controlled game rotation with sane defaults.
- Join as guest before full account creation.
- Automatic hourly public tournaments.
- Waiting-room activity and start notifications.
- Clearly identified bots only when explicitly enabled by the host.

Success criteria:

- 20% of active players create or share a room.
- Average social room contains at least three humans.

## Phase 4 - Shareable Moments

- Detect match point, comeback, perfect return and sudden-death moments.
- Generate a result card and five-second replay for the decisive action.
- Deep link shared content directly into an instant rematch or room.
- Add platform-native sharing with a copy-link fallback.

Success criteria:

- 8% of completed matches produce a share.
- 15% of opened shares lead to a match or room join.

## Phase 5 - Daily Live Product

- Featured game and featured ruleset each day.
- Ten-minute daily mission path with one visible cosmetic reward.
- Seasonal rank, mastery and cosmetic collections.
- Live events with a predictable calendar.
- Return notifications controlled by the player.

Success criteria:

- Day-1 retention above 30%.
- Day-7 retention above 12%.
- At least three matches per retained daily player.

## Phase 6 - Trust And Scale

- Durable authentication and account recovery.
- Server-authoritative validation for every competitive game.
- Abuse prevention, rate limits and moderation.
- Match quality and latency monitoring.
- Product analytics dashboards and experiment flags.
- Load testing for tournament peaks.

## Current Implementation Order

1. Instant home action and recoverable matchmaking.
2. Product event instrumentation.
3. Live rematch negotiation and rivalry card.
4. Persistent group rooms.
5. Shareable decisive-moment cards and replays.
6. Scheduled tournaments and daily featured rulesets.
