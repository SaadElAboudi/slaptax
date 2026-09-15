# Club arcade

## Extension au catalogue - 15 septembre 2026

Direction visuelle etendue aux 15 jeux : entrees, avatars, series, comptes a
rebours, commandes tactiles, couleurs de terrain et affiches. Identites par
famille conservees : cartes de CONTREPIED, combat de GARDE, dessin, precision,
echiquier et jeux de reflexe. Les changements dans les modules de rendu canvas
portent uniquement sur les couleurs, pas sur les calculs ou la physique.

Recap commun a tous les jeux ; resultat de duel avec revanche prioritaire,
replay et rivalite depliables. Selecteurs illustres en entrainement, defi et
tournoi, etats de selection accessibles avec aria-pressed. Habillage harmonise
des salons, brackets, classement, historique, accueil initial et defis par lien.
Sur telephone etroit, le titre, le statut solo et la sortie restent sur une ligne.

Verification : 130 tests serveur reussis. Suite navigateur complete executee :
115 reussites, 3 exclusions preexistantes, 6 echecs mobiles (connexions HTTP
interrompues ou duels en attente). Ces 6 cas passent lors de la relance isolee,
sans modification des regles ni augmentation des timeouts. La premiere passe
complete n'est donc pas consideree comme une execution entierement verte.

`e2e/club-catalog.spec.ts` couvre les 15 jeux en francais sur ordinateur et a
320 x 740 : entree, surface jouable, canvas non vide, commandes non masquees,
absence de debordement et sortie d'entrainement. Les tests de replay existants
ouvrent desormais explicitement le detail du moment decisif.

Apres les ajustements : 34 controles ordinateur/mobile reussis, dont les 15
surfaces de jeu en action et l'export MAT. Derniere passe apres correction des
titres et boutons de tournoi : 17 controles mobiles reussis, incluant les 15
jeux a 320 px, une creation de salon a huit places et le parcours de veto de
tournoi. Captures inspectees ; boutons de taille/visibilite du tournoi verifies
a 44 x 44 px minimum. Build TypeScript/Vite et `git diff --check` reussis.

## Premiere iteration : accueil et CHROMA

### Perimetre initial

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

### Verification initiale

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
320 x 740. La suite navigateur historique complete n'avait pas ete rejouee
lors de cette premiere iteration.

## Limites

Validation navigateur sous Chromium ordinateur et mobile emule. Safari/iOS,
audio et vibrations sur appareils reels restent a verifier. Cette iteration ne
mesure pas la retention et ne constitue pas un test de charge ni un deploiement.
Les conditions d'ouverture massive de `GAMEPLAY_RELEASE.md` restent applicables.
