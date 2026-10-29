# SLAP$TAX

FR: Plateforme mobile de competition sociale entre amis, construite autour de mini-jeux rapides, de defis 1v1 et de tournois a forte tension.  
EN: Mobile social competition platform built around fast mini-games, 1v1 friend challenges, and high-tension tournaments.

Tagline: `Tape. Encaisse. Encaisse encore.`

Nouvelle arène : **[Poule Position](docs/POULE_POSITION.md)** — un poulet royal à capturer, des lancers et des œufs géants. [Validation web/mobile](docs/qa/poule-position-validation.md).

[Qualité des douze jeux : commandes, rendu et retours de jeu](docs/QUALITE_JEUX.md).

[Combat tactique de l’arène : réserves, récupération et trois supers](docs/COMBAT_ARENE.md).

## Why This Project

FR: Les jeux casual existent deja. Ce qui manque, c'est une experience qui combine en meme temps:
- rivalite sociale reelle,
- sessions tres courtes,
- profondeur strategique,
- et boucle de revanche instantanee.

EN: Casual games already exist. The gap is a product that combines:
- real social rivalry,
- very short sessions,
- strategic depth,
- and an instant rematch loop.

## Pitch

FR: SLAP$TAX transforme la rivalite amicale en affrontements courts, intenses et memorables.  
EN: SLAP$TAX turns friendly rivalry into short, high-energy, memorable battles.

Core idea:
- Challenge a friend in direct 1v1 matches.
- Compete in tournament brackets.
- Mix reflexes, strategy, and social pressure in a strong street-style brand universe.

## Product Core

### 1) Direct Challenge (1v1)
- Best of 3 format.
- Ban/Pick game selection flow.
- Winner takes the pot (after platform fee in real-money mode).

### 2) Tournament Mode
- Single-elimination bracket.
- Same mini-game per round for fairness.
- Clear progression and high-stakes final.

### 3) Strategic Layer
- Player stats per mini-game.
- Strategic ban/pick draft.
- Meta progression beyond pure reflexes.

## Statut du projet / Project Status

FR: Ce repository contient maintenant une version MVP jouable:
- une app React/Vite dans `web/`,
- une API Node.js sans framework dans `api/`,
- PostgreSQL en production avec fallback JSON local,
- une synchronisation WebSocket pour les duels et invitations,
- des prototypes HTML historiques conserves comme reference.

EN: This repository now contains a playable MVP:
- a React/Vite app in `web/`,
- a framework-free Node.js API in `api/`,
- PostgreSQL in production with a local JSON fallback,
- WebSocket synchronization for duels and invites,
- legacy HTML prototypes kept as reference.

FR: Le projet reste un prototype produit. Les soldes, mises et gains sont des credits de demo (`SLAP$`), pas de l'argent reel.  
EN: This is still a product prototype. Balances, stakes, and payouts are demo credits (`SLAP$`), not real money.

## Économie actuelle des jetons

Les jetons sont fictifs et gratuits. Les duels en direct conservent la mise et le gain :
15 % du pot est retiré, le gagnant reçoit 85 % du pot, mise comprise. Les modes sans
mise restent disponibles. Bonus quotidien, entraînements récompensés plafonnés et
coup de pouce limité sont détaillés dans [les règles des jetons](docs/ECONOMIE_JETONS.md).
Les points de manche, l'XP, le rang et les jetons sont distincts.

## Repo Map

- `web/`: current React/Vite frontend.
- `api/`: MVP backend API.
- `data/mvp_db.json`: local development state used without `DATABASE_URL`.
- `SLAPTAX_Concept.md`: main concept reference.
- `SLAPTAX_Concept_Code.txt`: JS script used to generate DOCX concept output.
- `SLAPTAX_Document_Presentation_Complet.md`: full master presentation.
- `SLAPTAX_Presentation_Investisseur.md`: investor-focused version.
- `SLAPTAX_Presentation_Partenaire_Technique.md`: technical partner version.
- `SLAPTAX_Presentation_Public_Presse.md`: public/press version.
- `slapbattle.html`: interactive visual prototype.

## Roadmap (haut niveau / high level)

The active product roadmap is maintained in
[`ROADMAP_VIRAL.md`](./ROADMAP_VIRAL.md). Its north-star metric is the share of
new players who rematch or invite someone within five minutes of their first
match.

### V0 (M1-M3)
- Validate core concept with 5-8 mini-games.
- Direct challenge mode without real-money flows.
- Closed user testing.

### V1 (M4-M6)
- Wallet/payment integration via compliant PSP partner.
- Tournament mode.
- KYC/compliance foundations.
- Public beta.

### V2 (M7-M12)
- 12-20 mini-games.
- Full ban/pick system and advanced stats.
- Social sharing and creator partnerships.

### V3 (M12+)
- Skill divisions.
- Sponsored tournaments.
- Geographic expansion.

## Run The App

### 1) Install frontend dependencies

```bash
cd web
npm install
```

### 2) Start the API

From the repo root:

```bash
npm start
```

The API listens on `http://localhost:8787`.

### 3) Start the web app

In another terminal:

```bash
cd web
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

### Checks

```bash
npm test
cd web && npm run build
```

Full gameplay QA (5 games x training/duel/tournament x desktop/mobile):

```bash
cd web
npx playwright install chromium
npm run qa:e2e
```

## Deploy On Render

The repository includes a root `render.yaml` Blueprint. It provisions PostgreSQL,
builds the React app, and serves the frontend, `/api`, and WebSockets from one
Node web service.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/SaadElAboudi/slaptax)

1. Push the repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Connect `SaadElAboudi/slaptax`.
4. Confirm the `slaptax` service and `slaptax-db` database, then deploy.

The health check is available at `/api/health`.

Render injects `DATABASE_URL` automatically from the Blueprint. Players, active
matches, wallets, and history therefore survive web-service restarts and deploys.
Without `DATABASE_URL`, the API keeps using `data/mvp_db.json` locally.

### Production environment

- `DATABASE_URL`: PostgreSQL connection string; configured by `render.yaml`.
- `HOST`: `0.0.0.0` on Render.
- `PORT`: provided automatically by Render.
- `PG_POOL_SIZE`: optional, defaults to `4`.
- `ADMIN_TOKEN`: random secret of at least 32 characters for the private `/admin`
  dashboard. Never use a `VITE_` variable for this secret. See
  [monitoring setup and metric definitions](./MONITORING.md).

## Lancer les prototypes HTML / Run the HTML Prototypes

No build step required.

### MVP Quick Demo
- File: `slaptax_mvp.html` (localStorage backend)
- File: `slaptax_mvp_connected.html` (API-connected, requires running server)

### Run the Full-Stack MVP

**Terminal 1: Start API**
```bash
npm start
```
Runs on `http://localhost:8787`

**Terminal 2: View Frontend** (requires API running)
Open `http://localhost:8080/slaptax_mvp_connected.html` in browser.

Or run simple static server:
```bash
python3 -m http.server 8080
```
- Includes: playable Bo3 duel, tournament simulation, wallet, stats, and local history persistence.

### Option 1: Open directly
1. Open `slapbattle.html` in your browser.
2. Open `slaptax_mvp.html` in your browser.

### Option 2: Run a local static server (recommended)
From the project folder:

```bash
python3 -m http.server 8080
```

Then open:
- `http://localhost:8080/slapbattle.html`
- `http://localhost:8080/slaptax_mvp.html`

## Suggested Next Milestones

1. Ship a playable V0 with 5-8 polished mini-games.
2. Validate retention and rematch rate before scaling scope.
3. Add payment/compliance stack only after PMF signals.
4. Launch creator-led tournaments for distribution.

## Note legale / Legal Note

FR: Toute fonctionnalite avec argent reel (mise, wallet, retrait) exige un cadrage juridique, paiement et protection utilisateur avant lancement.  
EN: Any real-money gameplay or wallet operation requires proper legal review, payment compliance, and user protection safeguards before launch.

## Contact

Project: `SLAP$TAX`
Please feel free to reach out

## Applications iOS et Android

Les projets natifs, scripts de compilation et fiches des stores sont préparés : voir [mobile/README.md](mobile/README.md). Studio proposé : Gignoski Games ; support : gignoski@gmail.com. Les builds mobiles nécessitent Node 22+, le mode serveur `APP_DISTRIBUTION=store`, un backend de la même révision et les signatures propres à chaque store. La préparation du dépôt ne constitue pas une publication.

## Développement commun web et apps

Les jeux partagent le même code sur le site, Android et iOS. Après une évolution,
utiliser `npm run build:all` (Node 22+) pour construire le web et synchroniser les
deux projets natifs. `npm run mobile:check` détecte les sources ou bundles
obsolètes. Voir [le guide mobile](mobile/README.md) et [les consignes du dépôt](AGENTS.md).
Les binaires et leur distribution nécessitent ensuite une compilation et une signature.

La [soirée entre amis](docs/SOIREE_ENTRE_AMIS.md) propose trois manches à quatre,
un score cumulé et une revanche dans le même salon. Les jeux bonus restent accessibles.
