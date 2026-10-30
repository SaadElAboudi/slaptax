# Jouabilité simple sur téléphone — 30 octobre 2026

Principe : une intention à la fois, un geste principal, puis au maximum une action
secondaire. Les choix de tactique restent possibles sans gérer plusieurs sticks,
curseurs ou jauges de pouvoir. Les douze jeux proposés au catalogue sont audités.
Les onze jeux archivés restent compatibles avec les anciens parcours/replays ; ils
ne sont pas remis au catalogue par cette refonte.

| Jeu | Geste principal | Simplification appliquée |
| --- | --- | --- |
| Poule Position | Stick + BAFFE/LANCE | Visée automatique, poule moins rapide et portage de 8 s ; terrain entier visible |
| Braquage du Goûter | Stick + BAFFE/LANCE | Même commande que Poule Position, sans pouvoirs, esquive ni munitions ; lancer au dépôt marque ; une baffe fait lâcher ; seules les livraisons départagent |
| Pigeon Express | Glisser + LARGUE | Retrait du parasol et du curseur redondant, identique pour le bot |
| Ascenseur à Prouts | Choisir une place + PROUT facultatif | Retrait de la respiration ; les dangers se contournent en changeant de place |
| Tarte ta Face | Toucher pour lancer + ESQUIVE | Déplacement assisté pour tous, retrait du placement manuel et des deux curseurs |
| Gonfle ou Pète | Maintenir puis relâcher | Retrait de la soupape ; relâcher évite le sabotage sur le ballon suivant ; sabotage facultatif conservé |
| Panique aux Toilettes | Maintenir/glisser + TURBO | Deux commandes existantes conservées, objectif et aide raccourcis |
| Bagarre de Table | Toucher puis relâcher une destination | Même geste à la souris et au doigt, pas besoin de commencer sur le personnage |
| Pif Paf | Une carte par tour | Choix séquentiels conservés ; deux instructions au briefing, effet indiqué sur chaque carte |
| Tour de Trop | Poser ou sécuriser | Bouée automatiquement consommée sur une chute ; suppression du choix de réparation |
| Chef Couic | Tracer puis toucher le morceau | Le toucher sert immédiatement ; le bouton alternatif reste disponible pour servir le côté surligné |
| Passe ou BOUM | Passer au bon moment | Le bouton unique est conservé ; aide et objectif raccourcis |

`shared/simple-play.json` décrit les objectifs, gestes et anciennes actions refusées.
Le briefing et les aides utilisent ce même contrat. Le serveur refuse les anciennes
commandes : les masquer dans l'interface ne suffit pas. Les salons à quatre gardent
les mêmes statistiques et commandes que l'entraînement et les défis. Les points,
wallets et remboursements restent calculés sur le serveur.

Les tests des anciennes capacités retirées ont été remplacés par des scénarios
sur les nouvelles règles : visée, interception, livraison, refroidissement des
baffes sans munitions, absence de pouvoirs, placement assisté, évitement des nuages,
relâchement avant sabotage et protection automatique de la tour. Les tests de
physique, identité, pause, scores, règlements et remboursements restent nécessaires.

La simplicité fonctionnelle et les captures ne prouvent pas que le jeu est drôle
ou immédiatement compris. La prochaine validation produit consiste à faire jouer
deux amis sans explication et observer les hésitations et demandes de revanche.

## Validation locale

- 319 tests serveur et 21 tests unitaires web passent.
- Le catalogue mobile ouvre les douze scènes à 320 × 650 sans crash ni débordement.
- Commandes d'arène, protection après erreur et remboursement testés ; terrain et
  commandes accessibles en paysage. Le test devenu obsolète sur le Super est corrigé.
- Chef Couic testé jusqu'au résultat en entraînement, challenge partagé et duel.
- Gonfle ou Pète encaisse par maintien/relâchement tactile ; l'Ascenseur marque par
  choix d'une place sûre. Tour de Trop conserve sa protection automatique et peut
  sécuriser la tour en entraînement et challenge partagé.
- Les trois E2E de TRACE sont ignorés explicitement car le jeu est archivé. Ses
  règles serveur restent testées. Les douze jeux du catalogue ne sont pas ignorés.
- `build:all` construit le web et synchronise Android/iOS : `d36a0001752b`.
- La CI dédiée ajoute le contrôle des douze scènes sous WebKit, en complément des
  défis croisés WebKit/Chromium. Cette CI doit être vérifiée après le push.
