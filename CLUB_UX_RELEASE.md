# Club arcade - premiere iteration

## Perimetre

- Accueil centre sur le defi entre amis, catalogue complet de 15 jeux et filtres
  conserves. CHROMA ouvre le parcours principal ; matchmaking et tournois restent
  accessibles avec leurs mecanismes existants.
- Identite graphite, citron, corail et cyan ; avatars et affiche CHROMA originaux.
  Les invitations, rivalites et scores affiches proviennent des donnees existantes.
- CHROMA : face-a-face, observation, nuancier, verrouillage, revelation comparee,
  ecarts cumules, recap, resultat et revanche. Replay et partage restent disponibles.
- Veto illustre ; choix et consentements restent geres par les regles existantes.
- Effets sonores synchronises entre composants et preferences persistantes.
  Vibrations sur activation explicite, sans effet si le navigateur ne les supporte
  pas. Animations reduites selon la preference systeme.

Aucun nouveau jeu, changement de score, de duree serveur ou de portefeuille.
Les autres jeux beneficient du cadre commun, pas d'une refonte complete de leur UX.

## Verification

Build : `npm --prefix web run build`.
Serveur : `node --test --test-reporter=dot api/tests`.
Depuis `web`, parcours de cette iteration :

```sh
npx playwright test e2e/club.spec.ts e2e/chroma.spec.ts e2e/experience.spec.ts
npx playwright test e2e/party-games.spec.ts e2e/mat.spec.ts --grep 'club home|French clock|MAT French board'
```

Les tests couvrent notamment le duel CHROMA jusqu'a la revanche acceptee,
l'export PNG, les preferences apres rechargement, les controles tactiles a
320 x 740, le mode animations reduites et les parcours de veto existants.

Resultats du 15 septembre 2026 : build reussi, 130 tests serveur reussis.
La premiere passe CHROMA/club/experience a valide 14 parcours. Apres les derniers
ajustements, 12 parcours CHROMA/club/horloge/plateau MAT ont ete rejoues avec
succes. Captures ordinateur et mobile inspectees, dont CHROMA en francais a
320 x 740. La suite navigateur historique complete n'a pas ete rejouee.

## Limites

Validation navigateur sous Chromium ordinateur et mobile emule. Safari/iOS,
audio et vibrations sur appareils reels restent a verifier. Cette iteration ne
mesure pas la retention et ne constitue pas un test de charge ni un deploiement.
Les conditions d'ouverture massive de `GAMEPLAY_RELEASE.md` restent applicables.
