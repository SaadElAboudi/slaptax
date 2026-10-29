# Poule Position

Une nouvelle arène de capture dans SlapTax : le trophée est un poulet couronné qui refuse de coopérer.

## Boucle de jeu

1. Rejoindre le poulet qui fuit quand on s’approche.
2. Le capturer et revenir au poulailler de sa couleur.
3. Lancer avant sa rébellion après 5,5 secondes de portage ; le rattraper ou l’intercepter au vol. Les obstacles font rebondir les lancers.
4. Quitter les cercles annonçant des œufs géants. Leur cible est figée 1,4 seconde avant l’impact : ils repoussent et font lâcher le poulet, sans infliger de dégâts. Une esquive au bon moment évite l’impact.
5. Livrer trois poulets, ou terminer devant après 60 secondes. Au chronomètre, les livraisons puis les KO départagent ; une égalité humaine demande une revanche acceptée par les deux joueurs.

Les œufs arrivent toutes les sept secondes, puis toutes les 3,5 secondes pendant la fin de partie (15 dernières secondes). La transition s’applique au renouvellement du prochain œuf.

## Modes et commandes

- Entraînement : un humain contre un bot explicitement annoncé.
- Défis entre amis : duel humain, règles et résultat calculés sur le serveur.
- Challenges : invitation à partager pour jouer en direct, sans faux score asynchrone.
- Tournois : jeu disponible dans le catalogue commun et les choix de jeux.
- Le salon quatre amis et sa playlist restent dédiés aux jeux déjà compatibles ; Poule Position n’y prétend pas proposer du 2v2.

Stick gauche ou ZQSD/WASD/flèches : mouvement. Stick droit à relâcher, clic ou J : baffe à mains vides, lancer quand on porte. Espace ou Maj : esquive. E : pouvoir du combattant. Trois combattants existants disponibles au briefing.

Les récompenses reprennent l’économie commune : mises, versements et journal serveur pour les duels ; entraînement récompensé seulement sur résultat serveur positif, avec les plafonds quotidiens existants. Aucun achat ou retrait monétaire ajouté.

## Production et direction artistique

Le jeu utilise la physique d’arène éprouvée du Braquage du Goûter, enrichie de règles d’objectif vivant et de dangers distincts dans `api/games/chicken.js`. Le rendu commun web/mobile ajoute un décor d’usine violet, marquages industriels, poulet royal original animé, signes au sol, jauge de rébellion, éclaboussures et réactions. Les bruitages synthétiques courts respectent les réglages audio ; pas de nouvelle boucle musicale imposée. Les préférences de réduction des animations sont respectées.

Les paramètres sont dans `shared/chicken-rules.json`. Le serveur garde l’autorité sur les mouvements, captures, coups, dangers, scores et récompenses. Les chronomètres spécifiques sont décalés lors d’une pause pour déconnexion.

Cette version est une première arène jouable. Une équivalence à un jeu de studio établi demanderait encore des sessions de tests joueurs, de l’équilibrage, des mesures de latence et des vérifications sur appareils réels. Le déploiement du serveur compatible reste nécessaire avant une diffusion publique des nouveaux bundles.
