# Validation de la passe de qualité — finalisée le 29 octobre 2026

## Vérifications locales

- 113 tests de mécanique serveur réussis : Snack, Poule Position, Table, Toilettes, Carnival, Absurd et PartyGames. Les règles serveur et l’économie n’ont pas été modifiées par cette passe.
- 12 tests frontend réussis : suspension/reprise des boucles sans duplication, nettoyage au démontage, allocation Retina bornée, absence de fausse récompense et retours sur les événements réellement confirmés.
- **48 tests navigateur sur 48 réussis.** La campagne couvre les douze jeux sur ordinateur et téléphone de 320 × 740, avec vérification du dessin, de l’absence de débordement horizontal et de l’arrêt/reprise des canvas après changement d’état natif. Elle vérifie aussi les nouveaux raccourcis, les duels humains complets de Poule Position, les fiches des douze jeux et les parcours du portefeuille.

## Construction commune

`npm run build:all` réussi sous Node 22 : site web, bundle mobile, synchronisation Android/iOS et parité des ressources. Empreinte des sources : `2367f139deb6`.

Android : `assembleDebug` et `bundleRelease` réussis. APK de test et AAB non signé reconstruits dans `mobile/artifacts` ; manifeste du bundle contrôlé dans chaque archive. Captures des douze jeux : `polish-*-mobile.png`. iOS reste synchronisé mais non compilé faute de Xcode compatible sur ce Mac. Aucun déploiement ou publication store n’a été effectué.

Les tests vérifient des comportements observables ; ils ne mesurent pas le plaisir de jeu, la rétention, le FPS d’un appareil réel ni la consommation de batterie. Le catalogue et les limites de la passe sont décrits dans [QUALITE_JEUX.md](../QUALITE_JEUX.md).
