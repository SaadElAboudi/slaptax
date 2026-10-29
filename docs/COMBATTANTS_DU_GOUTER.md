# Trois combattants pour Braquage du Goûter

Développement local du 27 octobre 2026. Les dix mini-jeux bonus restent disponibles ; cette passe approfondit l’arène principale.

## Choix et contre-jeu

Les trois combattants sont disponibles immédiatement dans le briefing, avec portraits, rôle et description. Le choix est transmis au serveur avant les commandes de jeu, conservé pendant la manche et validé côté serveur. Il fonctionne aussi lorsque l’enregistrement local de cette préférence est bloqué. Une tentative de changement après mouvement, attaque, dégât, récupération de boîte ou confirmation du choix est refusée.

| Combattant | Base | Pouvoir | Réponse possible |
| --- | --- | --- | --- |
| Flanflan | 4 PV, vitesse 215 | BOING : préparation de 0,3 s, onde à 135 unités, 1 dégât et recul accru. Recharge 7 s. | Sortir de la zone, esquiver, bloquer de face ou interrompre par un KO. Les bancs protègent. |
| Cornichon | 4 PV, vitesse 205, frappe plus longue mais moins fréquente | SAUMURE : flaque visée à 150 unités maximum, annoncée 0,3 s avant activation. Rayon 85, durée active 2,2 s, vitesse adverse réduite à 55 %. Recharge 8,5 s. | Contourner, sortir ou esquiver. Aucun dégât direct ; son auteur ne ralentit pas dans sa propre flaque. |
| Toast Costaud | 5 PV, vitesse 190, frappe plus lente et recul renforcé | CROÛTE : protège d’un coup de face pendant 1,2 s maximum, repousse son auteur, puis disparaît. Recharge 8 s. | Attaquer par-derrière, attendre ou provoquer le blocage. Attaquer soi-même annule la garde. |

Les vitesses sont des unités de simulation par seconde. Porter la boîte applique le même facteur de ralentissement à chacun. Les valeurs sont celles du prototype ; leur équilibre n’est pas validé par des joueurs extérieurs.

## Contrôles et lisibilité

Un bouton de pouvoir et le raccourci E s’ajoutent à la frappe et à l’esquive. Le bouton montre la recharge réelle et reste inactif pendant une préparation incompatible. La visée manuelle reste prioritaire tant que le doigt tient le stick droit.

Les silhouettes diffèrent dans l’arène et dans les résultats : flan avec cerise, cornichon allongé avec feuilles, toast avec croûte. Les PV reflètent le personnage. Le cercle de préparation, la flaque annoncée puis active, le ralentissement et le bouclier correspondent aux états du serveur. Les animations décoratives respectent la préférence de réduction des mouvements.

## Autorité et stabilité

Les clients ne choisissent ni dégâts, ni durée de protection, ni vitesse. Le serveur valide le personnage, le moment du choix, la préparation et les recharges. Les zones, la garde et les échéances sont décalées lors d’une pause réseau. Un KO annule la garde et une onde encore en préparation ; une flaque déjà lancée expire normalement. La recharge n’est pas offerte à nouveau après réapparition.

Les coups simultanés et les ondes sont collectés avant application des dégâts pour conserver les échanges de KO. Une victime déjà à zéro PV ne subit pas un second KO ni des PV négatifs dans la même étape.

## Adversaire d’entraînement

Le bot est annoncé. Il emploie un autre combattant selon le choix du joueur, navigue autour des bancs, utilise ses pouvoirs et attend une fenêtre de réaction avant de tenter une esquive sur une préparation visible. Il ne reçoit pas de dégâts ou de points de faveur. Les duels humains ne contiennent aucun bot.

## Limites

Le duel et l’entraînement sont complétés par [un salon privé 2v2](PASSES_ET_2V2.md), développé dans la tranche suivante. Les compétences sont jouables et testables, mais ne démontrent ni rétention, ni viralité, ni équilibre compétitif. Pas de nouveau son ou service vocal payant dans cette passe. Voir [la validation](qa/cast-validation.md).
