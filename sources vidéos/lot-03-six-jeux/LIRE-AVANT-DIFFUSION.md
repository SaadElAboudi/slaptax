# Six jeux. Six défis. — révision du 5 novembre 2026

Objectif : faire comprendre le geste avant de demander un partage. Une vidéo de 15 secondes par jeu du catalogue actif ; aucune promotion de jeu retiré. Les anciens concepts restent dans les archives du Studio.

| Jeu | Accroche | Ce qu’on voit | Conséquence réelle |
| --- | --- | --- | --- |
| Chef Couic | 37 %. Tu couperais où ? | Une ligne puis le morceau choisi | 43,3 % servis, 6,3 points d’écart calculés par le moteur |
| CHROMA | Tu t’en souviens vraiment ? | Couleur visible deux secondes, cible cachée, réglage de la réponse | Comparaison cible/réponse d’un essai accepté par le moteur |
| Tour de Trop | Encore un. Mauvaise idée ? | Empilement, pause au choix, un bloc supplémentaire | Tour perdue ; la branche « sécuriser » conserve réellement six blocs |
| Braquage du Goûter | Ton goûter. Son problème. | Ramassage, livraison, baffe, butin lâché puis repris | Trois livraisons et deux baffes présentes dans les événements du moteur |
| Bagarre de Table | Un bon angle. Il est dehors. | Visée, impulsion, collision, ralenti de la même action | Éjection et KO confirmés par le moteur |
| Tarte ta Face | Il vise. Tu te baisses. | Tirs, esquives et ripostes | Touches et esquives acceptées, scores calculés par le moteur |

## Montage commun

- Dès la première image : une scène du jeu, son nom et une question lisible.
- Pendant l’action : une consigne à la fois, textes hors du plateau et marges conservatrices en haut, en bas et à droite.
- À 12 secondes : « Tu peux faire mieux ? », puis « Joue. Défie un ami. Prends ta revanche. » et le site réellement déployé.
- Démo scénarisée signalée dans chaque vidéo, y compris à la fin. Aucun joueur réel, record, réaction humaine, gain ou chiffre de popularité inventé.
- Une tentative montrée pour Chef Couic et CHROMA ; la partie complète en comporte trois. Pause éditoriale de la tour et ralenti de table identifiés.
- Exports muets, sans musique ni voix payante. Les scripts vocaux restent des textes de travail et ne constituent pas des pistes intégrées.

## Destination

https://slaptax-r9na.onrender.com

Les légendes livrées contiennent un lien direct vers le mode solo du jeu concerné (`?tab=training&game=…`). Le carton vidéo affiche le domaine court. Le CTA ne présume ni lien en bio configuré ni défi privé déjà créé. Dans une publication, on peut placer ce site dans le champ de lien effectivement disponible. Aucun envoi ou achat de diffusion n’est exécuté.

## Source et contrôle

`campaign.json` fixe les six compositions. `scripts/prepare.mjs` vérifie qu’elles couvrent exactement une fois les six identifiants de `shared/game-selection.json`. Les nouveaux scénarios CHROMA, table et tartes appellent les moteurs serveur ; les autres scénarios existants sont conservés et rendus dans le nouvel habillage commun.

Les Canvas réutilisent les fonctions de dessin du jeu. CHROMA présente une vue rapprochée éditoriale des couleurs publiques du moteur, pas une capture complète de l’interface. Aucune mécanique n’est ajoutée à l’app pour les vidéos.

Contrôler les MP4 sur téléphone avant diffusion : compréhension sans son, lisibilité du résultat, interface de plateforme sur les marges et exactitude du lien. La présence d’un export ne prouve ni publication ni performance marketing.
