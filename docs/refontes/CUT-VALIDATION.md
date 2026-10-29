# Quatrième lot — Chef Couic

## Implémentation

Trois commandes distinctes : biscuit pentagonal en coupe libre, fromage triangulaire en coupe verticale, gâteau octogonal en diagonale descendante. Chaque ingrédient a sa couleur et sa texture, avec un visage réactif au tracé. La progression affiche les trois commandes et leurs résultats réels.

Les directions imposées sont guidées au doigt et à la souris : la position du geste décide du trait, jamais la portion cible. Un simple toucher ne devient pas une coupe. Le joueur choisit ensuite le morceau à conserver, sans voir le pourcentage obtenu avant validation. La direction est aussi vérifiée côté serveur ; une requête ne peut pas remplacer une commande verticale par une coupe libre. La tolérance angulaire est de 12 degrés.

Après validation, le conseil compare le résultat réel à la cible : garder un morceau plus petit, plus grand, ou féliciter une erreur d’au plus deux points. Le score reste 1000 moins dix fois l’erreur de pourcentage, planché à zéro. Les règles de jetons et de conversion des scores restent inchangées.

Les commandes sans direction des anciens défis continuent à accepter les coupes libres et à utiliser leur géométrie enregistrée. Les nouveaux défis entre amis emploient les mêmes objectifs pour les deux joueurs. Entraînement, défis partagés, duels et matchs de tournoi réutilisent la même simulation et le même composant de découpe.

## Vérifié

- 329 tests serveur passés : génération des trois commandes, sens de coupe, rejet des directions forgées, score borné, secret avant révélation, anciens objectifs, pauses et conservation du résultat réel dans les replays.
- 19 tests unitaires frontend passés, dont gestes guidés conformes à la validation serveur, coordonnées dans le terrain, gestes libres conservés et refus des simples touchers. Le retour « portion servie » affiche désormais la portion réelle, distincte du score de précision.
- Build web et mobile réussi ; parité Android/iOS vérifiée (`be26d71b22df`).
- 6 parcours navigateur PC/mobile passés : trois coupes en entraînement, défi hôte/invité avec reprise après rechargement, duel humain avec engagement secret et expiration du rival. Les directions et recettes annoncées sont vérifiées à chaque commande ; canvas, progression et validation visibles sur 320 × 650 dans les parcours hôte et entraînement.
- Après correction des retours visuels, deux parcours supplémentaires d’entraînement PC/mobile passent : chaque toast affiche le pourcentage réellement calculé par le serveur, distinct du score de précision. Les trois commandes sont jouées par gestes réels.
- Captures de la version finale : [biscuit PC](captures/cut-1-pc.png), [fromage PC](captures/cut-2-pc.png), [gâteau PC](captures/cut-3-pc.png), [biscuit mobile](captures/cut-1-mobile-650.png), [fromage mobile](captures/cut-2-mobile-650.png), [gâteau mobile](captures/cut-3-mobile-650.png).
- Android : APK debug et AAB release compilés ; manifestes embarqués comparés au bundle commun, binaires copiés dans `mobile/artifacts/` et SHA-256 consignés dans `manifest.json`. AAB non signé ; aucune publication réalisée.
- iOS : assets synchronisés et `Info.plist` valide ; compilation non réalisée faute de Xcode compatible sur cette machine.

## Limites

Les tests automatisés ne prouvent pas l’équilibrage ou l’envie de rejouer de vrais joueurs. Les autres chantiers de DECISIONS.md restent distincts.

Le backend compatible doit être déployé avec les nouveaux clients pour les nouvelles commandes. Les anciens objectifs enregistrés restent jouables ; ce n’est pas une preuve de compatibilité de toutes les anciennes versions clientes avec les nouvelles directions. Aucun déploiement public ni publication sur les stores réalisé par ce lot.
