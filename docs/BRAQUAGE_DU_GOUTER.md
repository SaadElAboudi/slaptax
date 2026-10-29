# Braquage du Goûter — première arène jouable

Version locale du 27 octobre 2026. Direction retenue : une arène principale, avec les dix mini-jeux en bonus. Ce prototype travaille le déplacement, le combat et l’objectif ; il ne constitue pas encore un jeu mobile fini ni une validation de rétention.

## Ce qui est jouable

- Entraînement contre **un bot déclaré**, **duel entre deux humains** via les salons existants, ou **salon privé 2v2 de quatre humains**. Voir [les passes et le 2v2](PASSES_ET_2V2.md).
- Premier à trois livraisons ; durée maximale de quatre-vingt-dix secondes. À l’échéance, les livraisons puis les KO départagent. En duel, une égalité nécessite une revanche acceptée par les deux joueurs.
- Boîte à récupérer au centre et à ramener au dépôt de sa couleur. Le porteur se déplace moins vite. Après livraison, la boîte revient au centre après 1,2 seconde. Un KO la fait tomber et la bloque brièvement avant une nouvelle récupération.
- Déplacement continu, visée indépendante, frappe avec préparation et recharge propres au combattant (140 ms et 520 ms pour Flanflan). La direction du coup est verrouillée pendant sa préparation.
- Esquive de 160 ms, rechargeable toutes les 2,4 secondes. Elle permet d’éviter une frappe pendant son exécution.
- Quatre ou cinq PV selon le combattant ; KO puis réapparition après 2,4 secondes. Protection de réapparition brève, interrompue si le joueur attaque.
- Bancs bloquant le déplacement et les attaques ; collisions entre personnages, recul et objectif rendus par le serveur. Des coups simultanés peuvent produire un double KO. À distance égale de la boîte, les joueurs la disputent : il faut départager la situation, sans priorité arbitraire au premier joueur.

## Commandes

Téléphone : stick gauche pour bouger ; stick droit pour viser, puis relâcher pour frapper à mains vides ou lancer la boîte portée. Deux doigts peuvent agir simultanément. Les boutons BAFFE / LANCE et ESQUIVE restent disponibles. L’annulation du geste droit ne déclenche pas d’attaque. La visée assistée, désactivable, cible un adversaire proche lorsque le joueur ne vise pas manuellement.

Ordinateur : ZQSD, WASD ou flèches pour se déplacer ; souris pour viser, clic pour frapper ou lancer ; Espace ou Maj pour esquiver. J fournit également une frappe au clavier. Les instructions figurent dans le briefing et sous les commandes sur ordinateur.

La perte de focus, la mise en arrière-plan et une interruption de commande arrêtent le déplacement. Le serveur expire une direction sans nouveau signal après 260 ms. Le retour dans la partie ne doit pas relancer un ancien geste.

## Présentation et navigation

L’accueil met l’arène en avant. « Avec un ami » sélectionne l’arène ; « Trouver un adversaire » recherche un joueur ayant demandé la même activité, en BO1. Les anciennes files générales restent séparées et compatibles. Les dix autres jeux restent dans la bibliothèque bonus et les sélecteurs.

Terrain de cantine original, Flanflan en tablier, préparation des frappes visible, impacts et gestes d’esquive liés aux événements réels. Caméra rapprochée sur petit écran, flèches de destination et mini-carte. Le joueur local bénéficie d’une extrapolation visuelle bornée à 100 ms, limitée par les bancs ; les autres joueurs sont interpolés. Il ne s’agit pas encore d’une prédiction réseau complète avec réconciliation des commandes.

Un résumé des livraisons et des KO, la vraie scène finale et l’export PNG du moment décisif s’intègrent aux résultats existants. L’échec d’initialisation audio n’empêche pas d’entrer en jeu ; aucune nouvelle musique automatique.

## Intégrité

La simulation avance à pas fixe de 1/60 s côté serveur. Les clients transmettent des directions et des intentions, jamais des positions, des dégâts ou des points. Le serveur valide participants, tour, vecteurs et recharges. La pause réseau décale les échéances, préparations de frappe, réapparitions et événements ; elle efface les directions.

La maîtrise solo récompense livraisons et KO réels, avec plafond. L’attente inactive ne rapporte pas de points. Les règles et plafonds d’XP existants sont conservés. Les crédits démo ne sont pas dépensés en entraînement.

## Limites et prochaines étapes

- Trois combattants avec des silhouettes, statistiques et pouvoirs distincts : [règles et contre-jeu](COMBATTANTS_DU_GOUTER.md). Leur équilibrage reste à éprouver avec des joueurs.
- Salons 2v2 privés en mémoire, sans mise ni progression. Pas encore de matchmaking public par équipes ni de fonctionnement multi-instance.
- Pas encore de manette, application native, benchmark sur téléphones physiques, classement dédié ou validation de la latence sur réseau mobile réel.
- Prochaine validation produit : observer des groupes extérieurs, mesurer compréhension, qualité des contrôles, revanches spontanées et retours. Ajuster d’abord portée, vitesse, recharges et terrain ; affiner les passes, le terrain et les trois rôles de personnages.

Preuves techniques : [validation de la première arène](qa/snack-validation.md).
