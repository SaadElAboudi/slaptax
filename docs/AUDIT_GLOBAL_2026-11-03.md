# Audit produit et jouabilité — 3 novembre 2026

## Direction

Conserver la Manufacture, sa brigade, son humour et les couleurs de la nouvelle identité. Donner la priorité à une première partie compréhensible, une maîtrise mesurable et une revanche entre amis. Un nouvel habillage ne suffit pas à justifier un nouveau jeu. Les jetons restent fictifs ; aucune récompense commerciale ou victoire sociale n’est inventée.

## Constats et corrections

| Priorité | Constat dans le code | Évolution |
| --- | --- | --- |
| Haute | Snack et Chicken partagent déplacement, ramassage automatique, baffe/lancer et trois livraisons. Les œufs et le poulet ne suffisent pas à différencier la décision principale. | Garder le Braquage comme arène ; retirer Chicken des nouvelles sélections communes, sans effacer moteurs, historiques ou parties explicites. |
| Haute | CHROMA est implémenté, avec score serveur, liens privés et revanche, mais absent des menus. | Retour au catalogue, au veto, aux rotations et à l’univers de la Manufacture. Création de lien depuis le solo. |
| Haute | Les curseurs CHROMA avaient des surfaces de 12 ou 28 px ; l’empilement vertical était risqué sur écran court. | Surfaces de 44 px, piste de teinte conservée, scène compacte, commandes clavier natives et indicateurs de focus. |
| Haute | Les règles annoncent des supers, réparation, parasol, respiration et soupape alors que leurs commandes ont été retirées. | Retrait des consignes inaccessibles ; les moteurs historiques ne sont pas réécrits. |
| Moyenne | L’accueil empile feuilleton, histoire, nouveauté et modes avant le catalogue. | Accès direct au catalogue, histoire repliable, retour CHROMA compact. Quatre incontournables aux gestes distincts. |
| Moyenne | Le trio quotidien est un simple décalage d’indices. | Une épreuve d’action, une d’observation et une de sang-froid à chaque nouveau jour. Préservation des reçus, records, bonus et plafonds acquis. |
| Moyenne | Le solo propose surtout de rejouer ou de quitter. | Objectif chiffré vers une étoile ou le record, invitation au duel, suggestion évitant les trois derniers jeux locaux. Aucun XP local ajouté. |

## Catalogue retenu : douze gestes distincts

| Jeu | Décision principale | Geste mobile |
| --- | --- | --- |
| Braquage du Goûter | Choisir sa route, intercepter ou livrer | Stick + baffe/lancer |
| CHROMA | Reconstituer une nuance de mémoire | Palette et trois curseurs |
| Panique aux Toilettes | Collecter sans se faire aspirer | Déplacement continu + turbo |
| Pigeon Express | Anticiper vent et déplacement | Glisser + larguer |
| Ascenseur à Prouts | Lire la prochaine zone sûre | Trois places + piège |
| Tarte ta Face | Viser et lire la riposte | Toucher la cible + esquiver |
| Gonfle ou Pète | Choisir quand encaisser | Maintenir puis relâcher |
| Bagarre de Table | Préparer une impulsion sans sortir | Destination puis relâchement |
| Pif Paf | Contrer le choix caché adverse | Une carte par tour |
| Tour de Trop | Aligner et sécuriser | Poser au bon moment |
| Chef Couic | Estimer une surface | Tracer puis servir |
| Passe ou BOUM | Lire une fenêtre rythmique | Un bouton au bon moment |

Les familles servent à varier le trio quotidien ; les mécaniques servent à discuter les doublons. Deux jeux peuvent demander du sang-froid sans reproduire le même geste ni le même calcul. Les autres jeux historiques restent archivés : pas de réintroduction en masse sans qualité démontrée.

## Ce qui exige encore des humains

L’absence de débordement et un bouton atteignable ne prouvent ni le plaisir ni la rétention. Faire jouer 5 à 8 personnes sur de vrais téléphones, sans explication orale : observer le premier geste, les erreurs, la fatigue des pouces et la demande spontanée de revanche. Tester aussi réseau mobile, latence et interruption de l’app. Une émulation Chromium ne remplace pas Safari iOS ou un appareil Android.

Critères de validation produit à mesurer, pas résultats acquis : comprendre le geste après le briefing ; finir une première manche sans assistance ; distinguer les jeux après les avoir essayés ; vouloir retenter un objectif ou défier un ami. Mesurer invitations acceptées et revanches effectivement jouées, plutôt que les seuls clics. Après trois sessions, demander quels jeux deviennent répétitifs. Pas de séries punitives ni de compteurs de rareté artificiels.

## Livraison

Sources communes web/Android/iOS. Le backend doit accompagner le frontend pour le nouveau catalogue et le trio varié. Aucun déploiement, compte store ou envoi externe n’est réalisé par cet audit. Les résultats techniques et les limites de compilation sont consignés dans `qa/audit-global-validation.md`.

## Lecture technique transversale

Le catalogue partagé pilote réellement les choix du serveur et du client : changer seulement les cartes de l’accueil aurait laissé des rotations incohérentes. Les scores CHROMA restent calculés côté serveur et les liens conservent le résultat adverse masqué pendant les essais. La progression possède des reçus de récompense et un plafond quotidien, qu’il faut préserver lors des migrations.

Le build web signale encore un paquet principal supérieur à 500 Ko. C’est un sujet de démarrage sur réseau mobile à profiler sur appareil ; aucune amélioration de performance réseau n’est revendiquée ici. Les jeux dessinés sur canvas exigent également une vérification visuelle et tactile : un contrôle de DOM ne suffit pas. Les parcours navigateur complètent les tests de logique, sans constituer un audit de sécurité exhaustif ou une certification des stores.
