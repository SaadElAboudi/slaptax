# Passe de qualité sur les douze jeux — 28 octobre 2026

Cette intervention améliore les commandes, la lecture des actions et le rendu commun. Elle ne constitue pas une réécriture des douze moteurs et ne permet pas d’affirmer une équivalence à Brawl Stars ou Clash of Clans.

## Changements livrés

| Jeu | Améliorations |
| --- | --- |
| Braquage du Goûter | Retour distinct sur les livraisons, interceptions et KO ; boucle de rendu suspendue en arrière-plan ; ambiance dédiée. |
| Poule Position | Retours sur captures et interceptions, conservation du rendu du poulet et des dangers ; pause du dessin hors application. |
| Panique aux Toilettes | ZQSD/WASD et flèches ; arrêt au relâchement, blur et perte de capture ; retours sur butin et chute ; pause du dessin. |
| Pigeon Express | Flèches/A/D pour voler, J pour larguer, K pour le parasol ; retours sur blocages, livraisons et propre voiture touchée ; résolution Retina bornée à la taille affichée. |
| Ascenseur à Prouts | 1/2/3 pour choisir une place, Espace pour le prout ; retours sur points et pièges ; résolution et pause du dessin communes. |
| Tarte ta Face | Flèches pour le placement, J pour lancer, K pour esquiver ; réactions aux esquives et combos ; dessin Retina adapté. |
| Gonfle ou Pète | Espace maintenu pour gonfler, relâchement pour encaisser, K pour saboter ; arrêt si le focus quitte le jeu ; retour sur encaissement et casque gagné. |
| Bagarre de Table | Annulation de visée en cas de perte de capture ou de focus ; commandes de visée bloquées hors phase active ; retour sur KO ; pause du dessin. |
| Pif Paf | Retour distinct selon les coups réellement portés, dont banane ; ambiance dédiée ; focus clavier visible. |
| Tour de Trop | Retours sur bloc posé, placement parfait et sauvetage par la bouée ; arrêt du rendu en arrière-plan. |
| Chef Couic | Retour sur la précision réellement calculée après une coupe ; aucune réussite inventée ; pause du dessin. |
| Passe ou BOUM | Boucle de rendu sensible au cycle de vie de l’application ; vibrations respectant les préférences communes. La mèche continue de suivre le temps écoulé : masquer l’application ne prolonge pas une partie. |

Les nouvelles commandes sont documentées dans les règles françaises et anglaises des jeux concernés. Les raccourcis restent locaux au jeu : les champs, curseurs et boutons conservent leurs interactions natives.

## Retours de jeu

Les annonces utilisent uniquement les différences entre deux états confirmés par le serveur. Les points du rival, une reconnexion ou un nouveau tour ne créent pas de fausse récompense. Une seule annonce reste visible à la fois, avec limitation de fréquence. Les animations respectent la réduction des mouvements ; les vibrations restent optionnelles. Aucune nouvelle boucle musicale imposée.

## Rendu et stabilité

`startGameLoop` centralise la suspension et la reprise des canvas lorsque la page ou le webview natif devient inactif, sans accumuler de boucles au retour. Le rendu Retina de plusieurs jeux tient compte de la largeur affichée et reste plafonné à 2×. Ces changements réduisent le travail de dessin inutile ; ils ne constituent pas une mesure de consommation batterie sur appareil réel.

## Ce qui sépare encore SlapTax d’un jeu de studio établi

- Tests avec de vrais groupes d’amis : compréhension, envie de revanche et raisons d’abandon.
- Réseau réel : appareils modestes, latence, pertes de connexion et charge serveur.
- Équilibrage mesuré des personnages et des mécaniques de chaque jeu.
- Production artistique plus poussée : poses, animations et sons spécifiques, validés en jeu.

Les versions mobiles reçoivent les mêmes sources. Une synchronisation iOS ne vaut pas compilation ni publication. Voir le compte rendu de validation dans `docs/qa/game-polish-validation.md`.
