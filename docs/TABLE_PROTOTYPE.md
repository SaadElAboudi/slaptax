# Dernier sur la table — premier prototype jouable

Objectif : vérifier si une mécanique de propulsion et de collisions produit des parties faciles à comprendre et des moments drôles, avant de développer les autres concepts proposés.

## Jouer

L’action principale de l’accueil lance ce jeu. Solo contre trois bots déclarés ; duel entre deux joueurs humains via les salons existants. Cette version ne propose pas encore de salon à quatre humains. Les autres jeux restent accessibles pour comparaison.

Glisser depuis le personnage jaune, viser et relâcher pour se propulser. La longueur du geste dose la force. Recharge de 950 ms entre deux impulsions. Au clavier : flèches pour viser puis Espace/Entrée ; le bouton Se propulser fournit également une action accessible.

Durée maximale : vingt secondes. La surface commence à rétrécir après dix secondes. Le dernier survivant gagne ; à l’échéance, le survivant le plus proche du centre gagne. Une égalité exacte en duel demande une revanche acceptée par les deux joueurs. Les bords sont des sorties, sans mur invisible qui ferait rebondir le joueur.

## Autorité et progression

Physique déterministe à pas fixe de 1/60 s côté serveur. Les clients envoient uniquement une direction et une puissance. Les valeurs non finies, actions trop rapides, joueurs extérieurs et tours périmés sont refusés. Bots clairement signalés en solo et absents des duels humains. Reconnexion : temps de simulation et cooldowns décalés pour conserver la partie.

Le score solo vient du temps de survie, des KO attribués après collision et d’un bonus de victoire. Une défaite reste plafonnée à 450 ; une victoire donne le bonus prévu par le moteur. Ce score normalisé entre 0 et 1000 s’intègre à l’historique et aux récompenses solo existantes. Aucun crédit démo n’est dépensé en solo.

Le navigateur conserve environ les trente derniers états reçus pour un replay court des dernières secondes avant l’écran de résultat. Le replay ne recalcule pas le résultat et ne fabrique pas d’action.

## Validation avant extension

Tests du moteur : types de participants, validation des impulsions, cooldown, collisions et KO, invariance au regroupement des ticks, pause et égalités. Tests navigateur : vrai geste souris/tactile, plateau non vide, reprise via le proxy Vite, résultat solo avec replay, duel humain avec résultat serveur et snapshots.

Prochain test produit : observer plusieurs groupes jouer, compter les revanches spontanées, les invitations et les retours, puis recueillir leurs explications des chutes. L’intérêt, l’humour et la rétention ne sont pas prouvés par les tests techniques. Ajuster les distances, la friction et la lisibilité à partir de ces observations avant d’ajouter terrains, pouvoirs ou quatre joueurs humains.

### Personnages cartoon

Le rendu Canvas comprend quatre silhouettes originales : Flanflan (flan jaune et cerise), Ronchon (bloc corail et sourcils froncés), Guimauve (fantôme mauve) et Cornichon (vert allongé). Leur apparence dépend de leur place dans la partie, identique chez les deux joueurs. Le repère « TOI » identifie le joueur local ; les adversaires artificiels conservent le préfixe BOT.

Les expressions réagissent aux collisions réelles, à la proximité du bord et aux éliminations. Les impacts déclenchent de brèves onomatopées ; les personnages ont des bras, des pieds et des réactions élastiques. Ces effets restent visuels et ne modifient ni les hitboxes ni la physique serveur. Le mode système de réduction des animations désactive les rotations, déformations, étoiles et particules. Le replay accélère les dernières images réelles pour laisser apparaître la chute finale.
