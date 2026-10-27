# Pigeon Express et Ascenseur à Prouts

Deux nouveaux IDs (`pigeon`, `lift`) portent le catalogue actif à dix jeux. Les menus, invitations, duels, tournois, trios solo et scènes exportables les reconnaissent. Les moteurs tournent sur le serveur ; les clients n’envoient que des commandes de pilotage et d’action.

## Pigeon Express — 24 secondes

Pilote ton pigeon en glissant le doigt ou avec le curseur. Une fiente par seconde maximum, 0,9 seconde de chute. Le vent varie et agit pendant toute la chute ; il faut anticiper le mouvement de la voiture adverse.

- Voiture rose adverse : 100 points, 180 au centre.
- Ta voiture jaune : perte de 50 points, sans score négatif.
- Parasol : 0,65 seconde de protection, recharge de 2,8 secondes. Bloquer une livraison adverse rapporte 40 points ; bloquer ton propre tir évite la pénalité mais ne donne aucun point.
- Les voitures circulent sur la même trajectoire. Si deux centres sont presque exactement aussi proches d’un largage, celui-ci est manqué : aucun emplacement n’est prioritaire arbitrairement.

Le bot solo est annoncé. Il utilise les positions publiques, une estimation du vent et une erreur de visée ; il ne connaît pas les intentions humaines. En duel, il n’y a que les deux humains.

## Ascenseur à Prouts — 22 secondes

Choisis une des trois places à chaque passage. Un nuage vert et un haricot apparaissent 0,7 seconde avant l’arrivée de la vague, toutes les 1,3 secondes après le premier passage.

- Place sûre confirmée : 80 points. Le haricot ajoute 40 points et compte pour la recharge.
- Deux haricots : une recharge de prout, maximum deux en réserve. Une charge au départ ; recharge temporelle de trois secondes entre deux attaques.
- Un prout verrouille la place actuelle du rival. Le contour rouge le prévient : il dispose de 0,7 seconde pour changer de place.
- Piège réussi : 100 points pour son auteur ; le rival perd 60 points. Un nuage vert coûte également 60 points. Les scores restent positifs ou nuls.
- Un joueur doit confirmer une place ou agir pendant le passage pour gagner les points de cette vague. Rester immobile sans jouer ne donne pas de points.

Les places restent accessibles et un joueur touché continue à jouer. Il n’attend pas éliminé pendant le reste de la partie. Le bot choisit à partir des avertissements publics et peut se tromper ; le solo est explicitement distinct d’un duel humain.

## Résultats et reprise

Le plus grand score brut décide du duel. Une égalité exige que les deux joueurs acceptent de rejouer. Les ratings solo sont arrondis et plafonnés à 1 000 (points / 3 pour Pigeon Express ; points / 2,5 pour l’ascenseur). Les joueurs inactifs ne gagnent pas de récompense de progression.

Le calendrier des projectiles, vagues, pièges et recharges se décale lors d’une pause réseau. Le pilotage est arrêté et une place d’ascenseur doit être reconfirmée après reprise. Les replays et les images exportables dessinent les véritables instantanés du serveur, avec les vrais scores.
