# Confort de l’arène sur PC — 29 octobre 2026

Concerne Braquage du Goûter et Poule Position, qui utilisent la même scène.

## Changements

- Vue immersive automatique avec souris et écran d’au moins 901 px ; bouton Réduire / Agrandir et Échap pour revenir à la page. La vue est rendue dans le document hors des conteneurs animés afin d’éviter leur recadrage.
- Terrain mesuré à 831 × 554 px sur 1366 × 768, contre 516 × 344 dans l’audit initial : environ 61 % de largeur supplémentaire. Personnage de 48 unités : environ 44 px au lieu de 28 px. Les dimensions physiques de la carte, les collisions et les portées restent identiques.
- Joysticks masqués pour la souris sur grand écran ; commandes tactiles conservées sur mobile. Actions compactes et rappel clavier visible.
- Visée recalculée vers la position du curseur à chaque envoi d’entrée, y compris quand le joueur se déplace sans bouger la souris. L’assistance n’écrase pas la visée souris ; elle reste disponible au tactile / clavier.
- Arrêt des déplacements quand la fenêtre ou le jeu perd le focus. Décompte et connexion restent visibles dans la scène immersive.
- Défilement du document restauré quand la scène est réduite ou démontée.

Capture réelle : [arène 1366 × 768](arena-pc-1366-immersive.png).

## Vérifications

- `arena-depth.spec.ts` : 5 tests passés, 1 scénario souris volontairement ignoré sur mobile ; ressources et commandes visibles, super gagné/dépensé dans un vrai duel, visée souris recalculée pendant le déplacement.
- Test PC complété puis rejoué : 1/1 passé, vérifiant aussi perte de focus, Échap et restauration du défilement.
- Entraînement Poule Position PC + mobile : 2/2 passés, déplacements clavier et véritables événements tactiles.
- Duel Poule Position PC : 1/1 passé, résultat serveur, sortie de la scène et consultation du replay.
- `build:all` sous Node 22 : réussi, source commune `66029058b1eeae0016d5a44d6ed03830e49e3518fdcf36767d06646e8c899610`, parité Android/iOS vérifiée.
- Android : `assembleDebug` + `bundleRelease` réussis ; APK debug et AAB non signé dans `mobile/artifacts`, manifestes embarqués identiques au bundle commun et sommes SHA-256 enregistrées.
- iOS : ressources synchronisées et Info.plist valide ; application non compilée, Xcode compatible indisponible sur cette machine.
- `git diff --check` : réussi.

Les premiers essais avaient détecté un recadrage de la scène par un parent animé. Corrigé en rendant la vue PC hors de ce parent ; les résultats ci-dessus correspondent au code final. La première construction a également été arrêtée par la protection contre des sources modifiées en cours de build ; la construction finale complète a réussi.

## Limites

Ce changement règle le cadrage et les entrées ; il ne prétend pas égaler Brawl Stars. Il reste à tester les sensations avec des joueurs, différencier davantage les attaques principales, enrichir les routes de la carte et travailler les animations et le son. Aucune publication web ou store.
