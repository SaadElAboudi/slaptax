# Deuxième lot — Pigeon Express

## Implémentation

La silhouette rose montre la position rivale 0,9 s après le largage. La trajectoire jaune conserve la dérive du vent et le risque de toucher sa propre voiture. Les tirs adverses affichent leur point de chute et le temps restant dans les 650 dernières millisecondes ; les 200 dernières millisecondes signalent la fenêtre de parade.

Un centre rapporte 180 points. Les centres consécutifs ajoutent 20 points par niveau après le premier, jusqu’à 60 points supplémentaires par tir. Un raté, un tir décentré, un tir bloqué ou un tir sur sa propre voiture interrompt la série. Le parasol reste actif 650 ms toutes les 2,8 s ; le déclencher dans les 200 ms avant un impact adverse rapporte 80 points, contre 40 pour un blocage ordinaire. Bloquer ses propres tirs rapporte zéro.

Le serveur détermine les collisions, les séries et les parades. Les points restent des scores de jeu ; les jetons ne changent pas. Les entraînements, duels et matchs de tournoi qui utilisent Pigeon Express passent par cette même simulation. Aucun nouveau format de tournoi ou de challenge asynchrone n’est ajouté.

## Vérification

- 320 tests serveur passés, dont quatre nouveaux scénarios couvrant les séries personnelles, le plafond du bonus, toutes les ruptures de série, la limite de parade, les tirs propres et les pauses.
- 14 tests frontend passés, dont la concordance de la prévision avec la simulation serveur et les retours de précision/parade fondés sur les compteurs personnels.
- 10 parcours PC/mobile passés : pigeon et ascenseur en solo et en duel humain jusqu’aux résultats, plus deux parcours de commandes réelles. Visibilité du canvas, des deux actions, du curseur et de la série vérifiée sur 320 × 650 ; absence d’erreur JS et de débordement horizontal pendant ces parcours.
- Captures examinées : [PC](captures/pigeon-pc.png), [mobile 320 × 650](captures/pigeon-mobile-650.png).
- Build web et bundle mobile réussis ; parité Android/iOS vérifiée (`94c3ed3fe9ff`). Configuration iOS valide, assets synchronisés ; compilation iOS non réalisée faute de Xcode compatible.
- Android : APK debug et AAB release compilés. Manifestes embarqués comparés au bundle commun ; binaires copiés dans `mobile/artifacts/`, tailles et SHA-256 consignés dans `manifest.json`. AAB non signé ; aucune publication réalisée.

## Limites

Ce lot améliore la précision et le contre-jeu ; il n’ajoute pas encore les routes de largage de la feuille de route ni le mode bombe en groupe. La prédiction anticipe les voitures automatiques, pas une décision future du joueur adverse.

Déployer le backend compatible avec les clients avant ouverture publique. La version locale n’est pas une publication store ; l’équilibrage et l’envie de rejouer restent à vérifier avec de vrais joueurs.
