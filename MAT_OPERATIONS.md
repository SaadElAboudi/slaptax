# MAT operations

## Game contract

- Solo, live friend duels and tournaments; one mate-in-one per enclosing round.
- Same position and server start for both players, after the shared countdown.
- 20 seconds, one legal move. Illegal moves do not consume the attempt.
- chess.js validates every submitted move. Any legal checkmate is accepted,
  including alternate solutions and promotions; the stored line is not a whitelist.
- A mate beats a miss or timeout. Two mates are ranked by server arrival time;
  a difference of 250 ms or less is a draw. Two misses are also a draw.
- A tied live duel requires both players to request a fresh position.
- No solution, puzzle ID, correctness or rival move is sent before both players
  finish or time expires. The full board and ordinary legal moves are public.
- An unfinished position is replaced after reconnect; the old turn is invalidated.
  This avoids extra study time, but disconnections can still disrupt a duel.
- Solo has no bot and does not change credits or competitive rankings.
- MAT is not available as an asynchronous link challenge.

## Content renewal

Source: https://database.lichess.org/#puzzles (CC0 1.0).
The checked-in reserve contains 2,000 verified positions. There is no network
request in the move-resolution path. Recently selected positions are remembered
for each anonymous player and tournament (200 each), using the existing store.
Both players' histories are excluded. Exhaustion selects the least recently seen
available position, so the catalogue never deadlocks. Clearing identity resets
this history. Tournament puzzles are limited to ratings 800-1200 when available.

On normal `npm start`, an independent child process renews a catalogue older than
seven days. Checks run after ten seconds and then every fifteen minutes. Failed
attempts retry no sooner than six hours later. A file lock prevents overlapping
workers on the same filesystem. The worker has a 256 MB JS heap limit, a five-minute
download timeout and a 330-second process timeout. OS memory use can exceed the
JS heap limit; size the host accordingly.

Each import reads at most 200,000 CSV rows / 128 MB of compressed input. It samples
2,000 eligible unique positions with ratings 600-1500, popularity >=80, at least
100 plays and rating deviation <=100. This is a bounded sample, not the entire
database. Overlap between successive catalogues is possible. Each canonical mate
is verified before publication. Fewer than 200 positions fails the refresh.

The new file is written and renamed atomically. Invalid/missing downloads retain
the previous catalogue; invalid local caches fall back to the last good catalogue
or the bundled seed. The running server checks local changes at most every 30 s.

## Configuration and verification

- `MAT_AUTO_REFRESH=0`: disable background downloads, retain local gameplay.
- `MAT_POOL_PATH`: absolute writable cache path. Default is the OS temporary
  directory plus `slaptax-mat-puzzles.json`. Use a persistent volume to preserve
  renewed content across deployments. Do not point this at the bundled seed.
- Manual refresh: `npm run mat:refresh` (uses the same environment path).
- `GET /api/health`: `mat.count`, `source`, `generatedAt`, `stale`, `warning` and
  `refresh` (`state`, `at`). Staleness means older than fourteen days.
- Importer logs `mat.import.ok` or `mat.import.failed`; the supervisor logs
  `mat.refresh.alert` on failure and retains playable content.

Before public deployment, verify a manual refresh and a restart on the target
host, the persistent path permissions, outbound HTTPS and memory budget. Configure
external monitoring for stale content, warnings, failed refreshes or a running
status older than ten minutes. Logging is implemented; external alert delivery
is not configured by this change.

Rotate any database password previously shared in a conversation before public
deployment; do not reuse an exposed connection string.

## Scope limits

Server-authoritative scoring is not anti-engine protection or perfect latency
compensation. Sessions remain in memory and do not survive a server restart.
Recent-history durability inherits the existing database/store guarantees; this
does not add multi-instance coordination. Anonymous competitive identity is not
secured authentication. Load testing, production infrastructure checks and abuse
protection are still required before a mass launch. No deployment is performed
by these local changes.
