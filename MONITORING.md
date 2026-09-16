# Private monitoring

Open `/admin`. Configure `ADMIN_TOKEN` on the Node service (Render environment),
using a unique random secret of at least 32 characters. Generate one with:

```sh
openssl rand -hex 32
```

Never put this secret in a `VITE_` variable, source control, a URL or a shared
invitation. Use HTTPS in production. Access is disabled without a sufficiently
long secret. Enter it in the dashboard; it stays in React memory only, is sent
as a Bearer header, and is forgotten on logout/reload. Rotation requires changing
the environment variable and restarting the service. This is single-admin
access, not a multi-user role system. The public HTML shell contains no metrics.

## Definitions

- Online: recognized player identities with a live WebSocket and recent pong.
  Multiple tabs for the same identity count once. This is not a count of humans
  or all website visitors: clients without a recognized WebSocket are excluded.
- Daily players: distinct connected identities observed during a UTC day.
- Peak: maximum simultaneous recognized identities observed on connection and
  at each 25-second heartbeat sweep.
- Returning: seen on an earlier day within the retained 30-day window, not D1
  cohort retention. Clearing browser storage can create a new identity.
- Duels in progress: persisted duels in `playing` state, including disconnected
  players. Local practice and tournament counts are not included.
- Link challenges: snapshot of retained records. Created includes drafts;
  published means host finished. Participations count started guest attempts;
  completed means the server has resolved a guest attempt. Expired/pruned records
  are not an all-time funnel. No inferred completion from elapsed time.
- Errors: HTTP API 4xx and 5xx response totals, excluding health, presence and
  admin polling. Includes expected refusals such as 409; does not capture browser
  exceptions, WebSocket failures or database failures outside HTTP handling.
- Memory and uptime describe the current Node process, not the Render account.

## Persistence and limits

Collection starts with this release, without fabricated historical backfill.
Daily aggregates and hashed player IDs are saved in the existing app store every
30 seconds, on admin reads and on graceful close. A crash can lose the last
unflushed batch. IDs, names, IPs, secrets and raw error text are never returned by
the monitoring endpoint. No new analytics cookies or third-party tracker.

The dashboard API is read-only for gameplay. Refreshing does not advance an
attempt or settle a match. Thirty UTC days are retained; daily hashed identity
sets grow with the real audience. Data resets also reset monitoring. With local
file storage, persistence follows that file's lifecycle; production must use a
persistent store. PostgreSQL durability depends on the existing store write
queue and successful writes, not on the dashboard.

Scope is one server instance, like current presence/game sessions. Do not enable
horizontal replicas and sum these counters: shared telemetry and transactional
storage are required first. Existing public legacy `/api/analytics/kpi` is
unchanged; it does not expose these private monitoring records.
