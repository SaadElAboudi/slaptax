# Économie des jetons et séparation des points

La configuration commune est `shared/token-economy.json`. Les jetons sont fictifs, gratuits, sans achat ni conversion en argent. La taxe retire des jetons de la circulation ; elle ne constitue pas un revenu monétaire pour le studio.

## Règles

- Nouvelle identité : 25 jetons. Les soldes existants sont conservés, y compris les soldes à zéro et les centièmes hérités.
- Bonus quotidien : 10 jetons, réclamés explicitement une fois par jour UTC.
- Entraînement : 2 jetons par partie ayant un score positif calculé par le serveur, trois récompenses maximum par jour UTC. Une répétition du même résultat ne rapporte rien. Il n'est pas nécessaire de battre le bot ; une partie sans point ne rapporte pas de jetons.
- Coup de pouce : 10 jetons, une fois par jour UTC, uniquement sous 2 jetons disponibles et sans mise en cours. Il n'est jamais déclenché automatiquement à chaque défaite.
- Défis en direct : mises possibles de 2, 5, 10 et 20 jetons. Les deux mises sont débités ensemble au démarrage, pas lors de la création de l'invitation. Les fonds sont recontrôlés au démarrage.
- Gagnant : versement de 85 % du pot ; taxe de 15 % du pot, annoncée avant le départ. Le versement inclut la mise du gagnant. Aucun plafond quotidien caché ne réduit le versement annoncé.
- Exemple : chacun mise 5 ; pot 10, taxe 1,50, versement 8,50, bénéfice net du gagnant 3,50 ; perte du perdant 5.
- Entraînement, soirées à quatre, challenges par lien et tournois multijoueurs restent sans mise. Les récompenses d'entraînement s'appliquent au mode entraînement autoritaire, pas aux tentatives des challenges par lien ou aux soirées.

Les calculs comptables utilisent des centièmes entiers. Le journal sépare mises, versements, remboursements et bonus. Le solde initial est un point de reprise, pas un nouveau crédit de migration ; les anciens historiques ne sont pas réinventés comme des transactions.

## Points, XP et classements

- Points des manches : propres au jeu, calculés côté serveur pour les arènes en direct.
- Soirée : victoire 3, égalité 1, défaite 0 ; aucun lien avec les jetons.
- Maîtrise et XP : chaque manche compétitive effectivement jouée est comptée une fois (70 XP victoire, 35 XP défaite). Le bilan du match n'ajoute pas une manche fictive.
- Bilan de match : 55 XP pour le gagnant, 15 pour le perdant ; 100 XP pour la première victoire du jour. Rang +42 / -18, plancher zéro. Les séries évoluent au résultat du match, sans être effacées par une simple manche perdue. Pas de récompense de progression pour les forfaits/no-show identifiés.
- Les crédits et remboursements ne sont pas des défaites dans le taux de victoire.

## Reprises et remboursements

Le champ d'escrow du duel empêche un second débit, un second versement ou un second remboursement. Le résultat enregistré conserve la cotation de la mise. La suppression d'un profil rembourse les survivants via le même mécanisme.

Les arènes en mémoire ne peuvent pas être restaurées fidèlement après un redémarrage : les duels actifs sont annulés et leurs mises remboursées avant d'accepter les requêtes HTTP. Les tournois interrompus et leurs matches enfants sont fermés ; les anciens tournois solo encore ouverts sont remboursés une fois. Un round resté bloqué plus de vingt minutes est annulé et remboursé, sans inventer de gagnant.

Une déconnexion dans une arène suspend la manche pendant le délai de reconnexion de 20 secondes. Si la reconnexion échoue, le défi est annulé et les mises sont remboursées sans gagnant, score de manche ni progression. Si le rival n’entre jamais, l’attente initiale expire après 90 secondes. Un abandon volontaire après démarrage conserve la règle de forfait ; avant le premier démarrage, il annule le défi. Cette politique privilégie les incidents techniques entre amis : le serveur ne prétend pas distinguer une panne réseau d’une fermeture volontaire de l’app.

## Stockage et exploitation

- En production : `NODE_ENV=production`, `APP_DISTRIBUTION=store`, `DATABASE_URL`, `ADMIN_TOKEN` long et secret. L'absence de base persistante empêche le démarrage de production.
- HTTP : une mutation réussie attend la sauvegarde avant l'accusé de réception. Les résultats d'arène attendent aussi la sauvegarde avant leur émission finale ; les écritures en échec sont réessayées sans rejouer l'attribution.
- PostgreSQL : une instance applicative détient un verrou exclusif. Une seconde instance est refusée pour éviter deux caches concurrents du même état JSON. Perte du verrou : accès refusés jusqu'au redémarrage. Prévoir un déploiement avec arrêt de l'ancienne instance avant le démarrage de la nouvelle ; la reprise rembourse alors les duels interrompus.
- La file des écritures se remet d'une erreur temporaire à la tentative suivante. Les lectures renvoient une copie, afin d'éviter les mutations du cache hors sauvegarde.
- `GET /api/admin/token-audit`, avec `Authorization: Bearer <ADMIN_TOKEN>`, vérifie les soldes et journaux et expose les mises en cours et taxes enregistrées. Ne pas publier ce endpoint sans son contrôle administrateur.
- `GET /api/tokens` et `POST /api/tokens/claim` exigent la session du propriétaire, même dans la distribution de développement. Le client ne choisit ni le montant du bonus ni le résultat d'un match. Les anciens endpoints de simulation, crédit manuel et progression fournie par le client sont bloqués dans la distribution de production.

## Mise en production restant à valider

Faire une sauvegarde de la base et un audit des données existantes, déployer d'abord le backend compatible puis les clients, contrôler l'audit protégé et tester une mise, une victoire et une interruption réelles sur une base de préproduction. Les tests PostgreSQL locaux utilisent un adaptateur simulé ; ils ne remplacent pas la validation de la connexion, du verrou, des sauvegardes et de la restauration chez l'hébergeur.

La configuration Render existante indique encore un hébergement gratuit susceptible de se mettre en veille : elle ne démontre pas une disponibilité adaptée au jeu temps réel. Aucune montée de gamme payante ni aucun déploiement n'est effectué ici. Tester la charge sur une seule instance avant de définir sa capacité ; cette architecture n'est pas annoncée comme distribuée.

Les profils restent anonymes par installation : récupération multi-appareils et protection contre la création répétée de profils sont des chantiers distincts. Les quotas empêchent les doubles bonus d'un même profil ; ils ne constituent pas une preuve d'identité humaine.
