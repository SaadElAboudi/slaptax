# SLAP$TAX — Sprint A Backlog

Goal: make the product feel like a real competitive game, not a dashboard.

## North-star priorities
- Instant social challenge loop
- Real mini-games, not simulated outcomes
- Ban/Pick draft before each duel
- Fast rematch and visible rivalry
- Casual protection against grinders

## Sprint A1 — Core gameplay loop
### 1. Mini-games v1
- Build 3 playable mini-games:
  - Reflex
  - Timing
- Each mini-game must end in under 20 seconds.
- Each game must expose a clear win/lose result.

### 2. Ban/Pick draft
- Add pre-match draft phase.
- Show opponent strengths by game.
- Allow 1 ban per player.
- Allow 3-game sequence selection for Best-of-3.
- Store the full draft in duel history.

### 3. Match lifecycle
- Lobby -> Draft -> Match -> Result -> Rematch
- Full-screen countdown before each match.
- Full-screen result card after each match.
- One-tap rematch from result screen.

## Sprint A2 — Social layer
### 4. Challenge flow
- Challenge friend by profile.
- Invite link / room code flow.
- Challenge inbox for pending invites.
- Accept / decline challenge actions.

### 5. Rivalry system
- Track head-to-head score.
- Track streaks and recent outcomes.
- Show rivalry summary in lobby and after matches.

### 6. Shareable moments
- Share card for victory / defeat.
- Share card for rivalry scoreline.
- Copy invite button in lobby.

## Sprint A3 — Competitive safety
### 7. Skill protection
- Hidden skill rating.
- Rookie / Confirmed / Expert pools.
- Prevent casuals from being paired with grinders by default.

### 8. Economy safety
- Weekly gain cap.
- Stake caps by pool.
- Anti-abuse guardrails for multi-accounting and collusion.

## Sprint A4 — Product quality
### 9. First-time onboarding
- One-screen lobby onboarding.
- Host / Join choice.
- Short guided flow.

### 10. Retention metrics
- Track:
  - rematch rate
  - challenge acceptance rate
  - losers replay <24h
  - duels per active user
- Add a small KPI panel for internal use only.

## Recommended build order
1. Ban/Pick draft
2. 3 mini-games
3. Match lifecycle screens
4. Challenge/invite flow
5. Rivalry + share cards
6. Skill pools and caps

## Definition of done for Sprint A
- A friend can join in under 30 seconds.
- A match has a clear draft, clear tension, clear winner.
- Rematch is one click.
- The product feels social, competitive, and game-like.
