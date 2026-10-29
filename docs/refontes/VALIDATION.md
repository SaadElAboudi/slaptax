# Premier lot de refonte — validation

Voir [les décisions et le périmètre restant](DECISIONS.md).

## Livré

Gonfle ou Pète : cible cyclique 55/70/85 %, bonus de précision de 80 points, explosion à 100 %, sabotage annoncé 650 ms à l’avance, soupape défensive au prix de 18 % de volume. Encaisser avant l’impact protège le nouveau ballon ; une pause conserve les attaques en cours.

Ascenseur à Prouts : deux places dangereuses toutes les trois vagues, haricot dans le danger, défense d’un impact pendant 550 ms avec recharge, bonus de série plafonné. Sur PC, commandes latérales pour préserver une grande scène ; sur téléphone, commandes sous la scène.

Passe ou BOUM : moitié centrale dorée pour les parfaits, séries personnelles et récupération d’un bouclier après trois parfaits, sans cumul. Le vrai mode de groupe n’est pas livré : il reste planifié explicitement.

Accueil : Braquage du Goûter, Tarte ta Face, Bagarre de Table et Panique aux Toilettes mis en avant. La soirée à quatre conserve braquage / tartes / tour. Les autres refontes de la feuille de route restent à réaliser.

## Vérifications observées

- 316 tests serveur passés, dont 8 nouveaux tests de précision, contre-jeu, pause, double danger et bornage des boucliers.
- 12 tests unitaires frontend passés.
- 10 parcours PC/mobile passés : cible et bonus réellement obtenus, soupape, double nuage et défense réellement comptabilisée, nouvelle sélection et entrée dans un salon.
- 9 contrôles visuels : trois jeux sur PC 1366 × 768, mobile 320 × 650 et 320 × 740. Pas d’erreur JS, de débordement horizontal ou de bouton hors écran aux instants mesurés ; voir [les mesures](layout.json).
- Régression PC/mobile : 45 tests passés, 1 test clavier volontairement ignoré sur mobile. Scènes des douze jeux, commandes, fins de partie, duels, reconnexion et interruption en arrière-plan vérifiés.
- Build web et mobile réussi sous Node 22 ; contrôle de parité des sources, du bundle et des assets Android/iOS passé (`4a20f2c64c6e`).
- Configuration iOS : `Info.plist` valide. Assets synchronisés ; compilation iOS non réalisée, faute de Xcode compatible sur cette machine.
- Android : compilation APK debug et AAB release réussie. Versions embarquées comparées au manifeste mobile puis artefacts copiés dans `mobile/artifacts/`, avec tailles et SHA-256 dans `manifest.json`. L’AAB reste non signé ; aucune publication sur les stores réalisée.

Certains anciens tests supposaient encore zéro récompense d’entraînement et des requêtes de duel sans session. Leurs fixtures ont été alignées sur la politique existante (+2 jetons, session authentifiée) ; aucune règle de jetons n’a été modifiée pour faire passer les tests.

## Publication et limites

Ce lot modifie le serveur : déployer le backend compatible avec les clients web et natifs avant ouverture publique. Les refontes sont vérifiées localement ; ni la publication, ni l’équilibrage avec de vrais joueurs, ni une amélioration de rétention ne sont démontrés par ces tests.

Les autres jeux conservent leur gameplay actuel. Leur statut dans la feuille de route ne signifie pas qu’ils sont déjà refaits.
