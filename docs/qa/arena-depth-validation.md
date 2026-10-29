# Combat d’arène : validation du 29 octobre 2026

308 tests serveur réussis sur 308, dont 14 nouveaux tests sur les ressources et supers : réserve limitée et rechargement, soin conditionnel, charge calculée sur des actions réelles, dépenses et rejets de requêtes forgées, onde annoncée et esquivable, obstacles, bouclier collectif à un coup, bonus/malus de déplacement, passes, pause de reconnexion et rétention partielle au KO.

La nouvelle mécanique est commune à Braquage du Goûter et Poule Position, au solo, aux duels, aux tournois et aux manches de Braquage en salon. 12 tests frontend réussis sur les retours de jeu, le cycle de vie du rendu et la résolution des canvas.

22 parcours navigateur validés : première campagne 21/22, puis reprise isolée réussie du scénario mobile à quatre après correction de son ordre de connexion et du délai de livraison. Le test attend chaque arrivée confirmée avant de supposer les équipes ; il livre directement après la passe pour respecter la fenêtre de cinq secondes d’une assistance. Il continue de vérifier une vraie assistance et une vraie interception, sans modifier les règles serveur.

Les nouveaux scénarios vérifient, sur ordinateur et téléphone, l’explication des trois supers, les règles complètes, les commandes accessibles à 320 × 740, le retour en haut de l’écran après lecture des règles, et un super gagné puis dépensé lors d’un combat entre deux humains. Les autres parcours couvrent les duels complets, résultats, versements, replays et salons à quatre avec reconnexion/revanche.

`npm run build:all` réussi : web et mobile construits, Android/iOS synchronisés, contrôle de parité réussi (48ec308632c4). Android : `assembleDebug` et `bundleRelease` réussis ; APK de test et AAB non signé copiés dans `mobile/artifacts`, manifeste du bundle contrôlé dans chaque archive. iOS non compilé : Xcode compatible indisponible sur ce Mac.

Les tests automatisés ne prouvent pas l’équilibrage final. Les valeurs nécessitent des parties observées avec des joueurs et des tests sur appareils/réseaux réels. Aucun déploiement du serveur ni publication store dans cette intervention.
