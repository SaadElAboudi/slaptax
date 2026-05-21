# SLAP$TAX

FR: Plateforme mobile de competition sociale entre amis, construite autour de mini-jeux rapides, de defis 1v1 et de tournois a forte tension.  
EN: Mobile social competition platform built around fast mini-games, 1v1 friend challenges, and high-tension tournaments.

Tagline: `Tape. Encaisse. Encaisse encore.`

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
- Ban/Pick mind games.
- Meta progression beyond pure reflexes.

## Statut du projet / Project Status

FR: Ce repository contient actuellement:
- Des documents de concept produit.
- Des presentations ciblees (investisseur, partenaire technique, public/presse).
- Un prototype visuel HTML (`slapbattle.html`).

EN: This repository currently contains:
- Product concept documents.
- Target-audience presentation documents (investor, technical partner, public/press).
- A visual HTML prototype (`slapbattle.html`).

FR: Le projet est a un stade concept/prototype, pas encore une application prete pour la production.  
EN: This is an early concept/prototype stage, not a production-ready app.

## Business Model Snapshot

FR/EN:
- Tournament fee target: `~6% to 8%`.
- Direct challenge fee target: `~12% to 15%`.
- Core logic: the platform wins when players play, not through ads-first design.

## Repo Map

- `SLAPTAX_Concept.md`: main concept reference.
- `SLAPTAX_Concept_Code.txt`: JS script used to generate DOCX concept output.
- `SLAPTAX_Document_Presentation_Complet.md`: full master presentation.
- `SLAPTAX_Presentation_Investisseur.md`: investor-focused version.
- `SLAPTAX_Presentation_Partenaire_Technique.md`: technical partner version.
- `SLAPTAX_Presentation_Public_Presse.md`: public/press version.
- `slapbattle.html`: interactive visual prototype.

## Roadmap (haut niveau / high level)

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

## Lancer le prototype HTML / Run the HTML Prototype

No build step required.

### MVP Quick Demo
- File: `slaptax_mvp.html`
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

FR: Ajoute ici ton canal de contact (email pro, site, reseaux).  
EN: Add your preferred contact channel here (business email, website, socials).
