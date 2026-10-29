# SlapTax — une collection de défis entre amis

Évolution locale du 28 octobre 2026. La référence produit est une expérience mobile lisible, réactive et reconnaissable, avec une finition à construire et mesurer. La qualité de Brawl Stars ou Clash Royale et la viralité ne sont pas démontrées par cette passe.

## Décision

L’app conserve une collection de onze jeux, reliés par quatre modes : entraînement, défis entre amis en direct, challenges partageables et tournois. Braquage du Goûter garde son salon privé 2v2, mais les dix autres jeux ne sont plus présentés comme des bonus. Aucun jeu ni historique n’est supprimé.

L’accueil expose les quatre modes. Chaque jeu possède une fiche cartoon : illustration existante, univers, accroche, conseil propre au gameplay, règles et commandes, puis accès aux modes. Le choix du jeu est transmis dans l’URL et dans une préférence optionnelle, ce qui permet aussi d’ouvrir le bon jeu lorsque l’enregistrement local est bloqué. Les fiches sont chargées à la demande.

## Couverture réelle

| Jeu | Entraînement | Duel humain | Challenge partageable | Tournoi |
| --- | --- | --- | --- | --- |
| Braquage du Goûter | Bot annoncé | Oui, et salon privé 2v2 séparé | Invitation pour jouer en direct | Oui, épreuves à deux |
| Panique aux Toilettes | Bot annoncé | Oui | Invitation en direct | Oui |
| Pigeon Express | Bot annoncé | Oui | Invitation en direct | Oui |
| Ascenseur à Prouts | Bot annoncé | Oui | Invitation en direct | Oui |
| Tarte ta Face | Bot annoncé | Oui | Invitation en direct | Oui |
| Gonfle ou Pète | Bot annoncé | Oui | Invitation en direct | Oui |
| Bagarre de Table | Bots annoncés | Oui | Invitation en direct | Oui |
| Pif Paf | Bot annoncé | Oui | Invitation en direct | Oui |
| Tour de Trop | Tour solo | Oui | **Score asynchrone côté serveur, nouveau** | Oui |
| Chef Couic | Précision solo | Oui | Score asynchrone côté serveur | Oui |
| Passe ou BOUM | Entraînement local | Oui | Invitation en direct | Oui |

Les anciens liens de jeux archivés restent pris en charge. Un challenge de score et une invitation à un duel sont nommés distinctement dans l’interface. Les jeux où l’adversaire change les décisions n’ont pas été convertis en comparaisons artificielles contre un bot.

## Tour de Trop par lien

Une tour, trente secondes, une participation par personne. Le créateur joue avant de publier son lien, valable sept jours. Le serveur contrôle les positions, placements, bouée, chute, sécurisation, temps et score. Les clients ne soumettent aucun score fiable : un champ de score envoyé est ignoré. Les tours et résultats sont persistés, y compris après redémarrage. Les scores du créateur restent cachés tant que l’ami n’a pas terminé.

La comparaison et l’historique utilisent des blocs, pas un pourcentage de précision. Le résultat inclut les vraies tours pour le replay existant. Aucun crédit ni classement compétitif n’est accordé pour ces challenges privés. Les limites existantes de publication et de participation restent actives.

## Socle d’immersion et de fluidité

- Univers et conseil spécifiques aux onze jeux, visibles dans leur fiche et les briefings communs au solo, duel et tournoi.
- Navigation flottante masquée pendant les briefings, pour laisser les commandes de départ accessibles.
- Décors industriels cartoon réutilisés depuis un cache borné à quatre surfaces de 600×600 pixels, soit environ 5,8 Mo de pixels ; personnages et effets restent dessinés en direct.
- Le helper de rendu partagé évite le dessin lorsque l’onglet est masqué ; les règles serveur continuent normalement. Cette optimisation ne modifie pas les scores ou les collisions.
- Le challenge de tour réutilise le même dessin et la même interpolation que le jeu existant, avec une lecture régulière de l’état serveur.

Ce travail améliore la cohérence et réduit des calculs inutiles. Ce n’est pas une mesure de 60 images/s sur téléphones physiques ni une refonte des moteurs des onze jeux.

## Barrière de qualité pour la suite

Avant une acquisition payante ou une publication sur les stores, faire jouer des groupes extérieurs sur des téléphones réels. Pour chaque jeu : compréhension sans aide, contrôle tactile, lecture des défaites, plaisir de revanche, incident réseau et envie spontanée de partager. Mesurer aussi temps de première partie, chargement, fluidité et retours les jours suivants.

Les prochaines améliorations du gameplay doivent se décider jeu par jeu : visée et contre-jeu pour les jeux d’action ; anticipation pour les jeux à pièges ; satisfaction et précision pour les jeux de construction et de découpe. Conserver des règles communes entre entraînement, duel et tournoi, et réserver les comparaisons asynchrones aux conditions réellement reproductibles.

Voir [la validation de cette tranche](qa/friend-vision-validation.md) et [le protocole humain](PLAYTEST_GOÛTER.md).
