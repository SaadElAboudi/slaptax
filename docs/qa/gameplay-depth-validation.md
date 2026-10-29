# Validation locale — profondeur et sensations de jeu

28 octobre 2026. Aucun push ni déploiement effectué dans cette passe.

## Périmètre

Placement serveur de Tarte ta Face, origine visuelle des tirs, avertissement des trajectoires entrantes, projection visuelle du pigeon, repère balistique, transitions de place et avertissements de l’ascenseur, éclats et réactions cartoon. Entraînement et duels utilisent le même moteur que les tournois ; aucun nouveau mode asynchrone n’est annoncé.

## Résultats

- **252/252 tests serveur**, Node 22, concurrence 2. Commande : `npx --yes --package=node@22 node --test --test-concurrency=2 api/tests/*.test.js`. Journal local : `/tmp/slaptax-deeper-api-final.log`.
- Quatre nouveaux cas serveur : déplacement borné et esquive physique, cible immobile et entrée tardive, simulation déterministe et arrêt de destination après pause, collision non modifiable par une commande reçue après l’impact.
- **12/12 scénarios ciblés Playwright**, ordinateur et mobile Chromium, sur le dernier build. Commande depuis `web` : `npx playwright test e2e/gameplay-depth.spec.ts e2e/carnival.spec.ts e2e/absurd.spec.ts --grep 'pie |pigeon |lower scene|visual projection'`. Journal : `/tmp/slaptax-deeper-browser-final.log`.
- Ces scénarios couvrent pigeon et tartes en solo et à deux humains, vrais scores, victoire, replays, absence d’erreur JavaScript, placement tactile sans tir accidentel et alternative par curseur. Le test de placement mobile utilise une fenêtre de **320 × 740** et vérifie l’absence de débordement horizontal.
- Les contrôles de projection vérifient la borne de 100 ms, l’absence de score inventé ou de mutation de l’état source, les transitions de place et l’absence de révélation anticipée d’un danger.
- Une première campagne plus large a terminé à **21/24** : ascenseur, ballons et reconnexion passent sur ordinateur et mobile. Trois scénarios chronométrés de tir/esquive/score ont échoué. Les stratégies ont été corrigées : relecture de l’état après l’action UI, prise en compte du temps de commande mobile et action DOM pour le tir qui ouvre une fenêtre d’esquive de 350 ms à l’autre navigateur. Les contrôles tactiles restent exercés séparément. Les scénarios concernés passent dans la campagne finale de 12 ; la campagne complète de 24 n’a pas été relancée après ces ajustements.
- Build TypeScript/Vite réussi. Artefact principal `index-D_fDWaZm.js` : 515,55 kB, gzip 166,90 kB. Le warning Vite de chunk supérieur à 500 kB subsiste.
- Syntaxe des deux moteurs et `git diff --check` valides. API locale redémarrée avec le code actuel ; santé vérifiée sur le port 8787.

## Inspection visuelle

- `depth-pigeon-mobile.png` : repère balistique séparé des noms de voitures et commandes visibles.
- `depth-lift-mobile.png` : personnages, réactions, commandes et scène contenus dans la page. Capture issue de la première campagne ; le code de l’ascenseur est identique dans le build final.
- `depth-pie-mobile.png` : scène, placement et visée sur petit écran.

## Limites

Chromium avec émulation mobile ne remplace pas des téléphones physiques, Safari/iOS, des réseaux réels ou des groupes de nouveaux joueurs. Aucun FPS soutenu, taux de rétention ou potentiel viral n’est revendiqué. Pas de tournoi complet de chacun de ces jeux vérifié au navigateur dans cette passe. Les personnages restent dessinés avec le système Canvas existant ; leur incarnation animée demande encore un travail dédié.
