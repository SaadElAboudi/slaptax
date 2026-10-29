# Décisions de refonte — 29 octobre 2026

Décisions validées par l’utilisateur : consigner l’audit puis lancer les travaux.
Ces priorités sont un jugement de conception ; elles ne proviennent pas encore de mesures de rétention ou de tests utilisateurs.

## Direction

Une arène principale, Braquage du Goûter, et trois jeux bonus à pousser : Tarte ta Face, Bagarre de Table, Panique aux Toilettes. Poule Position devient une variante forte de l’arène. La soirée à quatre conserve sa playlist braquage / tartes / tour : sa progression et ses salons ne doivent pas être cassés pour changer la vitrine.

| Jeu | Décision | Travail attendu |
|---|---|---|
| Braquage du Goûter | Arène principale | Lisibilité, attaques distinctes, routes et combats ; tester les sensations avant de multiplier les pouvoirs. |
| Poule Position | Variante de l’arène | Préserver poulet rebelle / œufs et développer les situations spécifiques. |
| Tarte ta Face | Bonus prioritaire | Visée, feintes, esquives et retournements lisibles. |
| Bagarre de Table | Bonus prioritaire | Impulsion précise, collisions satisfaisantes, chutes compréhensibles. |
| Panique aux Toilettes | Bonus prioritaire | Trajectoires, vol de canards et fuite devant la chasse. |
| Gonfle ou Pète | Refonte prioritaire | Remplacer le seul maintien/relâchement par cible, contre-jeu et risque lisible. |
| Ascenseur à Prouts | Refonte prioritaire | Plusieurs dangers, défense active et récompense des séries. |
| Passe ou BOUM | Refonte prioritaire orientée groupe | Passes parfaites utiles dès maintenant ; concevoir ensuite une vraie circulation à plusieurs. Le duel actuel ne devient pas artificiellement un mode groupe. |
| Pigeon Express | Enrichir avant mise en avant | Routes de largage, anticipation du vent et contre-jeu ; éviter une simple répétition de tirs. |
| Chef Couic | Bonus de précision | Conserver les challenges asynchrones, améliorer sensations et variantes de découpe. |
| Tour de Trop | Bonus de score | Conserver les challenges et la soirée ; construire une identité plus distinctive. |
| Pif Paf | Bonus tactique à évaluer | Mesurer lisibilité des choix et envie de revanche avant d’ajouter des actions. |

## Critères avant promotion d’un jeu

Comprendre l’objectif sans explication orale ; réussir une première action rapidement ; comprendre une défaite ; avoir plusieurs réponses à une attaque ; pouvoir réclamer une revanche sans friction. Vérifier avec de vrais joueurs l’envie de relancer, les abandons et les raisons de frustration. Aucun seuil de viralité inventé.

## Premier lot lancé

- Ballons : cibles 55/70/85 %, bonus de précision, explosion lisible à 100 %, sabotage annoncé et soupape défensive. Les règles sont serveur ; les points ne deviennent pas des jetons.
- Ascenseur : double danger toutes les trois vagues, récompense des séries et respiration défensive brève. Les annonces précèdent les impacts.
- Bombe : passes parfaites et récupération bornée d’un bouclier, mêmes critères en entraînement et duel. Le vrai mode groupe reste un chantier séparé, avec circulation et déconnexions à concevoir.
- Vitrine : présenter l’arène et ses trois bonus prioritaires ; conserver les autres jeux accessibles pour évaluation et les salons existants.

Les autres lignes sont des travaux planifiés, pas des refontes déjà livrées. Voir VALIDATION.md pour les résultats réellement vérifiés et les limites de publication.

## Deuxième lot — Pigeon Express

Implémentation et résultats : [PIGEON-VALIDATION.md](PIGEON-VALIDATION.md).

- Visée anticipée : silhouette de la voiture rivale à 0,9 s, correspondant à la durée réelle de chute ; conserver la dérive du vent et le risque de toucher sa voiture.
- Centres consécutifs : premier centre à 180 points, puis +20 par niveau, maximum +60 par tir. Raté, tir décentré, bloqué ou sur sa voiture : série interrompue.
- Parasol précis : ouverture dans les 200 ms avant un impact adverse, parade à 80 points au lieu de 40 ; aucun point sur ses propres tirs.
- Avertissement au sol des tirs adverses dans les 650 dernières ms, avec compte à rebours.
- Règles serveur communes aux entraînements, duels et matchs de tournoi ; aucun changement de jetons. Les nouveaux compteurs restent dans les états enregistrés pour les replays.
- Les routes de largage supplémentaires et la véritable bombe en groupe restent à concevoir. Ce lot améliore la précision et le contre-jeu du pigeon sans annoncer ces chantiers comme livrés.

## Troisième lot — Tour de Trop

- Garder le choix central : sécuriser sa hauteur ou tenter un bloc supplémentaire. Aucun changement de jetons ou de conversion du score.
- La bouée gagnée après trois parfaits offre désormais deux usages exclusifs : absorber un raté ou réparer le sommet. Réparer rend jusqu’à 12 % de largeur de terrain, avec plafond à la largeur initiale, sans gagner de bloc ni de point.
- Une réparation consomme la bouée, remet la série à zéro et relance le mouvement ; une bouée dépensée ne se regagne pas.
- Montrer les parties coupées en rouge, le chevauchement conservé en vert et les placements parfaits en doré. Afficher la largeur restante.
- Même commande serveur et même composant de protection/réparation pour entraînement, duels, défis partagés et matchs de tournoi. Préserver les salons de soirée et les liens existants.
- Résultats et limites : voir TOWER-VALIDATION.md. Ce lot ne transforme pas ce bonus de précision en une nouvelle arène principale.

## Quatrième lot — Chef Couic

- Remplacer les trois formes proches par un menu de trois commandes : biscuit pentagonal libre, fromage triangulaire en coupe verticale, gâteau octogonal en diagonale descendante.
- Guider les deux directions imposées sur souris et tactile, sans calculer ni afficher la portion obtenue avant validation. Garder le choix du morceau à conserver.
- Valider aussi la direction côté serveur, avec une tolérance angulaire de 12 degrés ; le score reste fondé uniquement sur l’erreur de surface. Une coupe refusée ne consomme pas l’essai avant expiration.
- Afficher la progression des trois commandes et un conseil fondé sur le résultat réel : garder plus petit, plus grand ou féliciter la précision.
- Les anciens défis sans direction conservent leurs règles. Les nouveaux objectifs restent identiques pour les deux amis ; l’entraînement, les duels et les matchs de tournoi réutilisent la même simulation.
- Aucun changement de jetons ni de conversion du score. Ce lot ne livre pas les autres refontes restantes. Résultats : CUT-VALIDATION.md.
