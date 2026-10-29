# Combat d’arène : réserves, repli et supers

Mise en œuvre du 29 octobre 2026 dans Braquage du Goûter et Poule Position, en entraînement, duels, tournois et dans les manches de Braquage des salons 2v2/soirées.

## Trois décisions de combat

**Gérer les baffes.** Trois frappes en réserve, recharge d’une frappe toutes les 1,1 seconde. Les temps de préparation et de récupération du combattant restent applicables. Frapper à vide consomme une frappe ; le lancer de l’objectif reste gratuit. Une réserve épuisée crée une occasion d’avancer ou de punir un adversaire.

**Choisir le repli.** Après 4,5 secondes sans attaquer, utiliser un pouvoir ou subir de dégâts, récupérer un PV toutes les 1,3 seconde, jusqu’au maximum du combattant. Le porteur de l’objectif ne peut pas se soigner ; après l’avoir lâché, il doit attendre à nouveau. Reculer pour survivre laisse donc du terrain à l’adversaire.

**Gagner puis dépenser le super.** Charge maximale de 100, dépensée entièrement lors d’un lancement valide. Une touche ordinaire ou avec le pouvoir de base rapporte 20 ; un dégât reçu rapporte 7 ; bloquer un coup rapporte 22 ; une interception rapporte 25 ; livrer rapporte 35. Une vraie passe attrapée par un allié rapporte 12 au passeur, au plus une fois toutes les trois secondes. Les dégâts du super ne rechargent pas le super de leur auteur. Les KO conservent 75 % de la charge du joueur mis KO. Un adversaire peut voir la réserve de frappes et la préparation du super dans la scène.

## Trois rôles

| Combattant | Super | Décision et réponse possible |
| --- | --- | --- |
| Flanflan | CATAPULTE ! | Onde dirigée à 2 dégâts et forte poussée dans un rayon de 175 unités, annoncée 0,38 s avant. Le rival peut esquiver, sortir de l’angle ou se protéger derrière un obstacle. |
| Cornichon | BOCAL GÉANT | Trois flaques après 0,3 s, actives quatre secondes. Elles ralentissent les rivaux et accélèrent les alliés de 18 %, sans multiplier les bonus si elles se recouvrent. Les obstacles arrêtent leur projection et leur effet. |
| Toast Costaud | BRUNCH SOLIDAIRE | Chaque allié vivant à 180 unités au plus, avec ligne de vue, reçoit un bouclier valable quatre secondes qui bloque un coup. Le bouclier inclut Toast, ne se cumule pas et ne rend pas invincible pendant toute la durée. |

L’entraînement utilise les mêmes règles : le bot dépense ses ressources et utilise ses supers sans charge gratuite ; il peut se replier à un PV.

## Commandes et données

Le bouton étoile sur le terrain affiche le pourcentage, puis SUPER lorsque la charge est complète. F utilise le super au clavier. Les trois munitions sont visibles sous les personnages et dans le pied de l’arène. La préparation de l’onde, les boucliers et les soins ont un rendu distinct.

Paramètres communs : `shared/arena-combat.json`. Identité et description des pouvoirs : `shared/snack-characters.json`. Ressources serveur : `api/games/arenaCombat.js`, intégrées à la simulation de `snack.js`. Le client n’envoie que des intentions. Il ne décide ni de la charge ni des dégâts, soins ou récompenses. Une pause de reconnexion conserve les délais de recharge, de soin, de garde et de préparation.

Aucun achat, gain monétaire ou bonus de puissance permanent ajouté. L’économie des parties reste celle de SlapTax. Le serveur compatible doit être déployé avant de diffuser les applications mises à jour.

Cette livraison ajoute des choix tactiques concrets. Elle ne prouve pas un équilibrage final, une rétention élevée ni une équivalence de finition avec Brawl Stars : ces points demandent des sessions de jeu observées et des tests réseau/appareils.
