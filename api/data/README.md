# MAT seed catalogue

`mat-seed.json` contains 2,000 real mate-in-one positions sampled from the
[Lichess puzzle database](https://database.lichess.org/#puzzles), released under
CC0 1.0. Lichess permits reuse without attribution; attribution is retained here.
The original games remain on Lichess. Puzzle IDs are retained for traceability.

The importer applies the first move in each source row (the opponent's move)
before storing the playable FEN. It verifies that the next move is checkmate with
chess.js. It filters difficulty and quality and deduplicates positions.

This file is a bundled offline fallback, not a browser asset. Never put it under
`web/public` or return its solutions in an active-game response.

Regenerate deliberately with `npm run mat:refresh -- api/data/mat-seed.json`.
Runtime refreshes must use a separate path. See `MAT_OPERATIONS.md` at repo root.
