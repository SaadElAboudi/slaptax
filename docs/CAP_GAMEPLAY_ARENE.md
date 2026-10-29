# Cap gameplay : une arène qui mérite les revanches

Direction validée par le choix utilisateur du 27 octobre 2026 : une arène principale, avec les mini-jeux en bonus. La première tranche jouable est décrite dans [Braquage du Goûter](BRAQUAGE_DU_GOUTER.md). Les tranches suivantes restent une proposition de développement.

## Diagnostic vérifié dans le code

`api/games/table.js` offre une seule action humaine : une impulsion directionnelle, disponible toutes les 950 ms. Le joueur ne dispose pas d’un déplacement continu indépendant. Les personnages partagent la même physique ; leurs différences sont graphiques. La manche dure vingt secondes, avec élimination et départage par distance au centre. Les obstacles et objectifs ne structurent pas de déplacements tactiques. Le solo comporte trois bots ; le duel accueille deux humains. Un vrai mode à quatre humains et une logique d’équipes restent à construire.

Le rendu de `Table.tsx` affiche les positions reçues sans interpolation de déplacement entre les snapshots. Les effets et le replay apportent du caractère, mais pas de nouvelles décisions. Une nouvelle passe de couleurs ne corrigerait donc pas la profondeur du jeu.

## Direction retenue

Concentrer le développement sur une arène principale originale. Conserver les mini-jeux comme activités secondaires si cette direction est retenue. Ne pas convertir les dix jeux simultanément.

Titre de travail : **Braquage du Goûter**. Des personnages alimentaires se disputent une énorme boîte à goûter dans une cantine industrielle en panne.

### Première tranche jouable : sensations avant contenu

- Déplacement continu au joystick gauche, au clavier et à la manette si cette dernière est prise en charge par le prototype.
- Visée et frappe au contrôle droit ; visée assistée disponible, sans exiger une précision tactile excessive.
- Esquive courte distincte du déplacement et de l’attaque ; recharge lisible, interdiction de spam validée par le serveur.
- Un personnage, un terrain, un duel humain. Pas de promesse de 2v2 avant un vrai salon à quatre connexions humaines.
- Positions et collisions autoritaires ; interpolation des adversaires, puis prédiction et correction du joueur local à tester avec latence artificielle.
- Impacts lisibles : anticipation de la frappe, contact réel, recul, réaction de la victime. Les animations ne doivent jamais inventer une portée ou masquer une attaque adverse.
- Réapparition rapide et possibilité de revenir dans la partie plutôt qu’une longue attente après élimination.

Cette tranche doit donner envie de rejouer avec un décor simple. Le niveau graphique final vient après cette vérification.

### Deuxième tranche : une raison de se déplacer

Prototyper un seul objectif : récupérer la boîte centrale et la rapporter à son dépôt. Le porteur est visible et légèrement ralenti ; un KO lui fait lâcher la boîte. Score et durée sont des paramètres de playtest, avec un départ à trois livraisons ou quatre-vingt-dix secondes. Tester la lisibilité, les retours au score et les situations de blocage avant de figer ces valeurs.

Le terrain doit produire des décisions : itinéraire rapide exposé, détour couvert, tapis roulant annoncé. Un danger ne doit pas décider arbitrairement du vainqueur. Les capacités, leur portée et les timings doivent être visibles chez les deux joueurs.

### Troisième tranche : coopération et personnages

- Vrais salons 2v2, équipes persistantes pendant la manche, reconnexion, rematch accepté par les joueurs.
- Trois personnages maximum au départ : Flanflan, mobile mais vulnérable ; Cornichon, contrôle temporaire de zone ; Toast, protection brève d’un partenaire. La tranche locale implémente maintenant une onde de choc, une flaque ralentissante et une garde personnelle ; voir les règles réelles dans COMBATTANTS_DU_GOUTER.md.
- Silhouettes, poses, expressions, transitions et signatures sonores originales, reconnaissables à petite taille.
- Récompenses cosmétiques et maîtrise du personnage ; pas de puissance achetable ni d’avantage lié à la fréquence de connexion.

## Critères pour continuer

Observer des joueurs extérieurs au développement, pas seulement des tests automatisés. Relever : compréhension de l’objectif sans explication orale, maîtrise des commandes tactiles, explication des défaites, revanches spontanées, invitations réelles et retours les jours suivants. Mesurer aussi les déconnexions, corrections de position, temps d’attente et fluidité sur appareils physiques intermédiaires.

Aucun taux de rétention ni potentiel viral n’est établi aujourd’hui. Les seuils de décision doivent être définis avec les premiers playtests ; un build techniquement vert ne démontre pas l’intérêt du jeu.

## Décision produit

Choix confirmé : une arène principale et les dix mini-jeux en bonus. La première tranche est jouable localement, en entraînement et en duel humain. Trois combattants et leurs capacités distinctes sont maintenant jouables localement : voir [les pouvoirs et leurs limites](COMBATTANTS_DU_GOUTER.md). Les passes, interceptions et salons privés 2v2 sont désormais implémentés localement : voir [la tranche suivante](PASSES_ET_2V2.md). La validation des sensations avec des joueurs extérieurs reste à réaliser. Voir [les fonctionnalités réelles](BRAQUAGE_DU_GOUTER.md) et [les contrôles réalisés](qa/snack-validation.md).
