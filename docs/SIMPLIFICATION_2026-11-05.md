# Slap Tax — simplification du 5 novembre 2026

## Sélection

Six jeux actifs, pilotés par `shared/game-selection.json` dans les menus, le veto et les rotations automatiques du serveur.

| Conservé | Défi | Geste |
| --- | --- | --- |
| Chef Couic | Estimer la meilleure portion | Tracer, choisir un morceau |
| CHROMA | Retrouver la couleur de mémoire | Ajuster puis valider |
| Tour de Trop | Monter davantage sans perdre sa tour | Poser et sécuriser |
| Braquage du Goûter | Voler et livrer avant le rival | Déplacement et baffe/lancer |
| Bagarre de Table | Éjecter le rival sans sortir | Viser une impulsion |
| Tarte ta Face | Toucher et éviter la riposte | Viser et esquiver |

Retirés des nouvelles sélections : Panique aux Toilettes (collecte et vol déjà couverts par le Braquage), Pigeon Express (deuxième jeu de visée), Ascenseur à Prouts (évitement déjà présent), Gonfle ou Pète (prise de risque déjà couverte par la tour), Pif Paf (matrice de coups plus longue à apprendre), Passe ou BOUM (timing déjà présent dans la tour). Poule Position et les autres anciens jeux restent archivés.

Ce tri est une décision éditoriale sur les mécaniques et la clarté. Il ne prouve pas que les jeux retirés sont moins amusants, ni que les jeux retenus sont originaux sur le marché. Le plaisir, la fatigue tactile et l’envie spontanée de revanche exigent des essais humains.

Les moteurs historiques, données, records et récompenses acquis sont préservés. Les identifiants des anciennes parties restent interprétables. Les anciens choix stockés dans le navigateur reviennent à un jeu actif. Les nouveaux parcours visibles ne proposent que les six jeux. Les trois défis de score et la rotation de soirée à quatre restent compatibles.

## Interface

L’accueil contient une promesse, un premier bouton « Jouer maintenant », les six jeux et un salon à quatre replié. Suppression des catégories, du feuilleton, du parcours quotidien et des modes répétés sur l’accueil. La progression existante n’est pas effacée.

Chaque jeu propose « Jouer seul » et une invitation adaptée : défi par lien pour les trois scores asynchrones, duel pour les trois jeux en direct. La navigation distingue « Jeux », « Scores à battre », « En direct » et « Tournois ». Les fiches narratives ne précèdent plus le geste. Le résultat solo conserve trois actions : revanche, défi et autre jeu.

## Mobile et chargement

Cartes sur une colonne à 320 px, deux colonnes au-delà de 380 px, commandes d’accueil d’au moins 44 px, formulaire avec clavier à 18 px et briefing compact sur téléphone court. Le sélecteur de jeu apparaît après le briefing ; l’en-tête solo répétitif et l’illustration sur écran court sont retirés pour rendre le démarrage accessible sans défiler. Les scènes utilisent toujours le viewport de jeu commun et les commandes tactiles existantes.

Les grands écrans sont chargés à la demande : solo, duels, tournois, défis, historique et classement. Le premier build observé après cette séparation produit un fichier JS principal de 274,60 Ko (91,51 Ko gzip), sans avertissement de paquet supérieur à 500 Ko. Ce poids n’est pas une mesure de temps de démarrage ou de FPS sur un téléphone physique.

L’accueil ignore les changements de présence qui ne nécessitent pas de recharger les parties et invitations ; les changements d’état rapprochés sont regroupés. Le matchmaking reste disponible dans les duels.

## Livraison et validation

Résultats techniques consignés dans `qa/simplification-validation.md`. Les builds locaux ne constituent ni un déploiement serveur ni une publication store. Le catalogue serveur doit accompagner le frontend lors de la publication.
