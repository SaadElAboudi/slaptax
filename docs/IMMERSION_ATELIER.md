# Direction cartoon industrielle — 27 octobre 2026

Cette passe porte sur la présentation des dix jeux actifs. Elle ne change ni les règles serveur, ni les scores, ni les trajectoires, ni les collisions. Les réactions existantes restent déclenchées par les événements réels de la partie.

| Jeu | Traitement |
| --- | --- |
| Pigeon Express | Rue en plusieurs plans, façades, sacoche de livraison, ombres des voitures |
| Ascenseur à Prouts | Poutre, luminaires, tuyauterie, portes en métal, employés en uniforme |
| Tarte ta Face | Atelier de pâtisserie, éclairage, tabliers, ombres des personnages |
| Gonfle ou Pète | Atelier à pression, cuves et tuyaux en arrière-plan, tabliers |
| Panique aux Toilettes | Carrelage avec reflets, bordure rivetée, conduites latérales |
| Bagarre de Table | Cantine industrielle autour de la table, plateau plus grand |
| Pif Paf | Arène d’atelier, portique métallique et bande de sécurité |
| Tour de Trop | Entrepôt avec poutrelles et câble suivant le bloc mobile réel |
| Chef Couic | Planche sur établi de cuisine, veinage et ombre portée |
| Passe ou BOUM | Chambre à pression, bombe avec visage en solo et duel, piste mécanique |

## Lisibilité et commandes

- Habillage métallique commun avec une palette par univers ; commandes et dangers restent au premier plan.
- Bandeaux temps/mode redondants retirés lorsque le jeu possède déjà ces informations. Le mode bot/humain reste indiqué dans chaque jeu concerné.
- Commentaires des mascottes plus compacts ; sortie d’exercice conservée.
- Boutons du pigeon nommés même pendant leur recharge ; sélection de place de l’ascenseur visuellement marquée.
- Correction de la conversion du pointeur du pigeon quand le canvas comporte des marges latérales sur écran court.
- Netteté haute densité pour les canvases pigeon, ascenseur, tartes et ballons, limitée à 2× pour contenir le coût de rendu.
- Entrée de scène sans animation lorsque la préférence de réduction des mouvements est active ; aucune nouvelle musique automatique.

## Limites

Il s’agit d’une passe graphique et ergonomique Canvas/CSS, avec des personnages originaux. Elle n’établit pas une validation auprès de joueurs, une performance sur tout appareil ni une hausse de rétention. La musique, les règles, le réseau et la progression ne sont pas refondus dans cette passe.

Les résultats de contrôle sont consignés dans [la validation](qa/immersion-validation.md).
