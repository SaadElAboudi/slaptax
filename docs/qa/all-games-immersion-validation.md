# Immersion et confort des douze jeux — 29 octobre 2026

## Périmètre livré

Une scène de jeu dédiée remplace la page du site pendant une partie. Les dix mini-jeux utilisent `GameSession` sur PC et mobile ; les deux arènes conservent leur cadrage PC et utilisent aussi cette scène sur mobile. La couche est commune à l’entraînement et aux manches de duels et tournois qui passent par `LiveGameArena`. Les challenges de score utilisent également cette vue pendant leur partie ; les résultats et le partage retrouvent leur écran habituel. En cas d’erreur réseau, l’écran normal et son message d’erreur restent accessibles.

- Scènes plus grandes, palettes par univers, en-tête compact et aide clavier / tactile contextualisée pour les douze jeux. L’aide rappelle que la partie continue.
- Cadrage des vrais canvases sans zone de dessin artificiellement étirée dans un cadre aux mauvaises proportions.
- Commandes principales gardées à l’écran ; suppression de chronomètres et scores redondants ; défilement de secours dans la scène pour les configurations exceptionnellement petites.
- Interface du site rendue inerte pendant la vue immersive pour éviter de cliquer ou tabuler derrière le jeu, puis restaurée à la sortie.
- Boucle de rendu du challenge Tour de Trop unifiée avec la suspension native et navigateur.
- Focus clavier automatique quand le jeu est effectivement chargé, rétabli en fermant l’aide ; sortie d’entraînement disponible.
- Pif Paf : raccourcis 1 attaque, 2 charge, 3 défense, 4 banane ; plateau et actions plus lisibles.
- Chef Couic : surface agrandie ; un geste annulé ou interrompu ne valide plus un trait et permet de recommencer.
- Braquage du Goûter / Poule Position : portée et direction de frappe visibles, éclairage de sol adouci, retours personnels visibles dans la scène immersive.
- Gonfle ou Pète, Panique aux Toilettes et arènes : relâchement des entrées maintenues lorsque l’application native passe en arrière-plan, en complément des interruptions navigateur.
- Pigeon, Ascenseur, Tartes, Ballons, Toilettes, Table, Découpe et Tour : dimensions ajustées à la place réellement disponible après retrait de l’interface du site.

Aucun changement de règle serveur, de mise, de gain ou de collision.

## Validation

- API : **308/308 tests passés** (`/tmp/slaptax-all-immersion-api.log`).
- Unités frontend : **12/12 passés**, incluant suspension du rendu et projections bornées (`/tmp/slaptax-all-immersion-unit.log`).
- Campagne de cinq fichiers E2E : **54 passés, 2 ignorés volontairement sur mobile**, en une exécution complète (`/tmp/slaptax-all-immersion-final-e2e.log`). Couvre les douze jeux, aides, commandes, arrière-plan, focus sur deux tours du duel d’ustensiles, sortie et restauration du site, vrais duels humains, résultat/replay, navigation des quatre modes et challenge de tour partagé puis rechargé.
- Audit visuel : **24 scènes actives**, PC 1366 × 768 et mobile 320 × 740, sans erreur JS, débordement horizontal ni bouton d’action hors écran au moment observé. Mesures dans [layout-audit.json](all-games-immersion/layout-audit.json). Les captures attendent la phase jouable et non seulement la présence du canvas.
- Challenge de découpe : cadrage constaté à **432 × 432** sur PC et **294 × 294** sur téléphone ; bouton de validation visible. **2/2 tests complets hôte/visiteur passés** sur PC et mobile : trois coupes chacun, mêmes cibles serveur, résultat et replay conservés après rechargement (`/tmp/slaptax-all-immersion-cut-challenge.log`).
- La campagne de 54 cas précède une restriction CSS aux conteneurs `section[data-game]` : cette restriction conserve les règles des scènes normales et évite de masquer la scène de découpe rendue directement dans un challenge. Les deux parcours complets de découpe ci-dessus ont été exécutés après la reconstruction finale et valident cette restriction. Total : **56 cas passés**, répartis entre les deux campagnes ; les deux scénarios clavier exclus sur mobile restent explicitement ignorés.
- Construction Node 22 `build:all` réussie ; parité web → bundle mobile → ressources Android/iOS vérifiée. Source finale : `70ac5092be12fac04266ee429c074d0d4d3ecbfcd6f57843426352f2ec4552f1`.
- Android : `assembleDebug` et `bundleRelease` réussis en 2 min 3 s. APK debug et AAB non signé copiés dans `mobile/artifacts`, manifestes embarqués comparés intégralement au bundle final ; tailles et SHA-256 enregistrés dans `mobile/artifacts/manifest.json`.
- iOS : ressources synchronisées et Info.plist valide. **Application iOS non compilée**, Xcode compatible indisponible sur cette machine.
- `git diff --check` réussi. Aucun binaire signé pour distribution publique, aucune publication.

Les premiers essais ont révélé et permis de corriger un en-tête dupliqué, une scène qui recouvrait les commandes d’aide et un focus clavier perdu entre deux tours. Une exécution intermédiaire a également rencontré un changement des assets pendant une reconstruction ; elle n’est pas retenue comme preuve de validation.

## Portée de la validation

Les captures viennent de parties réelles contre les bots annoncés, sans état ni score fabriqués. Les vérifications Chromium ne remplacent pas les essais tactiles sur appareils physiques, l’équilibrage avec des joueurs ni la validation du backend effectivement déployé. Cette livraison améliore la présentation et la manipulation ; elle ne constitue pas une équivalence à un jeu de studio ni une garantie de viralité.

Aucune publication web, aucun push et aucune soumission aux stores dans cette passe. La signature de distribution et la compilation iOS sont des étapes distinctes.

## Captures des parties réelles

| Jeu | PC 1366 × 768 | Mobile 320 × 740 |
|---|---|---|
| Braquage du Goûter | [Voir](all-games-immersion/snack-pc.png) | [Voir](all-games-immersion/snack-mobile.png) |
| Poule Position | [Voir](all-games-immersion/chicken-pc.png) | [Voir](all-games-immersion/chicken-mobile.png) |
| Panique aux Toilettes | [Voir](all-games-immersion/toilet-pc.png) | [Voir](all-games-immersion/toilet-mobile.png) |
| Pigeon Express | [Voir](all-games-immersion/pigeon-pc.png) | [Voir](all-games-immersion/pigeon-mobile.png) |
| Ascenseur à Prouts | [Voir](all-games-immersion/lift-pc.png) | [Voir](all-games-immersion/lift-mobile.png) |
| Tarte ta Face | [Voir](all-games-immersion/pie-pc.png) | [Voir](all-games-immersion/pie-mobile.png) |
| Gonfle ou Pète | [Voir](all-games-immersion/balloon-pc.png) | [Voir](all-games-immersion/balloon-mobile.png) |
| Bagarre de Table | [Voir](all-games-immersion/table-pc.png) | [Voir](all-games-immersion/table-mobile.png) |
| Pif Paf | [Voir](all-games-immersion/garde-pc.png) | [Voir](all-games-immersion/garde-mobile.png) |
| Tour de Trop | [Voir](all-games-immersion/onemore-pc.png) | [Voir](all-games-immersion/onemore-mobile.png) |
| Chef Couic | [Voir](all-games-immersion/decoupe-pc.png) | [Voir](all-games-immersion/decoupe-mobile.png) |
| Passe ou BOUM | [Voir](all-games-immersion/bombpass-pc.png) | [Voir](all-games-immersion/bombpass-mobile.png) |

Challenge de découpe : [PC](all-games-immersion/decoupe-challenge-pc.png) · [mobile](all-games-immersion/decoupe-challenge-mobile.png).
