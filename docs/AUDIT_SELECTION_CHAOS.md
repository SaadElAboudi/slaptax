# Audit de la sélection et de la version locale

## Catalogue actuel : dix jeux

| ID | Nom français | Expérience |
| --- | --- | --- |
| toilet | Panique aux Toilettes | Pilotage continu, vol de canards au turbo, chasses et retours en jeu |
| pigeon | Pigeon Express | Pilotage de pigeon, vent, largages sur voiture adverse et parasol |
| lift | Ascenseur à Prouts | Trois places, haricots, nuages annoncés et pièges ciblés |
| pie | Tarte ta Face | Tartes en vol, cible mobile, esquive et combos |
| balloon | Gonfle ou Pète | Gonflage à risque, points encaissés et sabotage payant du rival |
| table | Bagarre de Table | Collisions et éliminations sur une table qui rétrécit |
| garde | Pif Paf | Duel de lecture : attaque, charge et défense |
| onemore | Tour de Trop | Empilement, risque de chute et bouée gagnée par trois parfaits consécutifs |
| decoupe | Chef Couic | Découpe d'une pâtisserie expressive et défis de précision par lien |
| bombpass | Passe ou BOUM | Timing dans une zone sûre sous la pression d'une bombe |

`shared/game-selection.json` est la source commune des IDs actifs, des noms français/anglais et des accroches. L'accueil, les menus de solo et de duel, le veto et les rotations automatiques suivent cette sélection. « Jouer maintenant » lance Panique aux Toilettes.

## Changement de gameplay

Deux nouvelles épreuves rejoignent le catalogue : Pigeon Express et Ascenseur à Prouts. Les règles et modes sont décrits dans `PIGEON_ET_ASCENSEUR.md`. Leur validation et leur relevé de version courants figurent dans `qa/absurd-validation.md` et `qa/absurd-version.json`. Les relevés précédents ci-dessous conservent leur date et leur périmètre.


Pif Paf dispose maintenant d’une quatrième action (banane) et d’une défense qui renvoie les coups. Bagarre de Table ajoute trois coups de nappe annoncés et de vrais exports de sa scène finale. Les règles détaillées sont dans `CRASSES_ET_NAPPE.md`, et la validation courante dans `qa/wtf-validation.md` ; le relevé `qa/wtf-version.json` identifie la compilation correspondante.


Deux nouvelles épreuves de 22 secondes ajoutent des mécaniques différentes : la visée et l’esquive en temps réel de Tarte ta Face, puis le risque et le sabotage de Gonfle ou Pète. Voir `docs/CARNIVAL_GAMES.md`. Elles disposent de scores serveur, de duels humains, de trios solo et de scènes réelles exportables.


Panique aux Toilettes dispose de son propre moteur serveur et d'un nouvel ID. Il remplace Palets Panique dans la sélection. La commande continue, les vols au contact, les rebonds, l'aspiration, la réapparition et les canards dorés remplacent les réglages de tir et l'attente entre salves. Le butin final réel décide du gagnant ; le plafonnement du score solo ne provoque pas d'égalité artificielle en duel.

Tour de Trop gagne une récompense de maîtrise fonctionnelle : trois placements parfaits consécutifs donnent une protection contre un raté, utilisable une fois dans la manche. Elle conserve les blocs déjà posés et ne donne aucun point inventé. Voir `docs/TOILET_PANIC.md` pour les règles et commandes.

## Jeux retirés du catalogue principal

Les onze anciens jeux `ricochet`, `mat`, `duelnumeric`, `chroma`, `onesecond`, `symbolrush`, `cupshuffle`, `bounce`, `falsestart`, `contrepied` et `trace` ne sont plus proposés dans les menus ou les nouvelles rotations automatiques. Leurs moteurs et IDs restent interprétables pour préserver les historiques, replays et demandes explicites déjà existantes.

La sélection privilégie l'action visible, les interactions et les résultats faciles à comprendre. Il s'agit d'un choix de conception, pas d'une conclusion statistique sur la rétention.

Une préférence locale retirée revient à Panique aux Toilettes. Le trio du jour utilise les jeux actifs disposant d'un score solo serveur ; la bombe locale n'est pas artificiellement ajoutée au système XP. La migration des tâches conserve les reçus, les records, les badges, le plafond XP du jour et un éventuel bonus déjà gagné.

## Version contrôlée

Le relevé horodaté dans `docs/qa/selection-version.json` compare le DOM réellement affiché par le serveur de développement (`http://127.0.0.1:5173/`) et par l'application compilée (`http://127.0.0.1:8787/`). Il liste les huit noms et les scripts effectivement chargés. Aucun déploiement public n'est réalisé dans cette intervention.

Les résultats de validation des huit jeux sont consignés dans `docs/qa/carnival-validation.md`. L’audit précédent avait validé les six jeux antérieurs ; ses chiffres ne sont pas utilisés pour revendiquer une nouvelle validation complète. Les anciennes spécifications UI des jeux retirés ne sont pas présentées comme une validation du nouveau catalogue.

Le défaut intermittent du replay Table trouvé lors de l'audit précédent reste corrigé : son premier index est borné à zéro. La découpe réserve la place de son bouton de validation sur les écrans courts. Les animations secondaires respectent la préférence système de réduction des mouvements.
