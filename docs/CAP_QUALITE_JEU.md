# SlapTax : faire rire par le jeu, donner envie de prendre sa revanche

28 octobre 2026. Direction produit et état local, sans promesse de viralité.

## Ce qui manque encore

Brawl Stars et Clash Royale sont des repères de profondeur, de contrôle et de finition. Un habillage cartoon ne remplace pas leurs années de réglage, leur infrastructure et leurs essais joueurs. SlapTax a besoin de sa propre raison de revenir : « mon ami m’a piégé, j’ai compris comment, je veux lui rendre la pareille ».

Le cœur reste la collection de défis entre amis. L’arène et son 2v2 sont une expérience phare de cette collection, pas un remplacement des autres jeux. Les quatre portes restent entraînement, défis entre amis, challenges et tournois. Un challenge de score différé et une invitation à jouer ensemble doivent rester explicitement différents.

## Barre de qualité par jeu

1. Une action agréable avant même de gagner : déplacement, tir, coupe ou pose lisible et réactif.
2. Une décision contre l’autre : feinte, prise de risque, interception ou contre, avec une réponse possible.
3. Une catastrophe compréhensible : anticipation visible, réaction du personnage et résultat fidèle à la simulation.
4. Un souvenir racontable en une phrase et une revanche facile à lancer.
5. Une difficulté qui se maîtrise avec l’entraînement, sans avantage acheté ni bonus aléatoire qui décide seul du vainqueur.

Avant d’ajouter un jeu, vérifier ces cinq points avec des amis qui découvrent réellement l’application. Si la blague ne survit pas après trois parties, retravailler la mécanique avant d’ajouter des récompenses.

## Améliorations jouables de cette passe

### Tarte ta Face : feinter par le placement

La moitié basse de la scène pilote le pâtissier. La moitié haute vise et lance. Deux curseurs et les boutons permettent aussi de jouer sans geste précis. Le déplacement reste assisté jusqu’au premier ordre de placement, puis le joueur contrôle sa destination jusqu’à la fin de la manche. Cette assistance initiale est indiquée dans les règles ; il ne s’agit pas d’un nouveau mode de match.

Le serveur applique une vitesse bornée, décide des impacts à l’arrivée et refuse les positions invalides. Quitter physiquement une trajectoire évite une tarte, mais ne donne pas la grosse tarte de riposte : celle-ci exige toujours une vraie esquive au bon moment. Les tirs partent visuellement du lanceur. Un repère prévient de la trajectoire entrante. Les impacts ajoutent des éclats courts sans modifier les scores.

Le moteur commun conserve ces règles en entraînement, duel et tournoi. Les replays enregistrent les positions et l’origine des nouveaux tirs ; les anciens replays gardent un rendu compatible.

### Pigeon Express : apprendre à placer une catastrophe

Un repère de chute prend en compte les 0,9 seconde de vol et le vent, avec la même intégration par pas de 50 ms que le serveur. Il ne révèle pas la position future des voitures et ne vise pas automatiquement. Le joueur doit encore anticiper leur mouvement et éviter sa propre voiture.

Le rendu projette les mouvements sur 100 ms maximum, sans décider des impacts. Les ailes, l’inclinaison et les éclats accompagnent les actions. Aucune modification du score ou de la collision n’est calculée par le client.

### Ascenseur à Prouts : rendre le piège lisible

Le changement de place s’anime sur 140 ms ; la position logique change immédiatement côté serveur. Le danger annoncé affiche son temps restant et une jauge. Les personnages réagissent au gaz et aux bonus. Le rendu n’annonce jamais une zone dangereuse que le serveur n’a pas encore révélée.

Les animations respectent la préférence de réduction des mouvements. Les boucles de dessin s’arrêtent de peindre quand le document est masqué. Aucune musique n’a été ajoutée.

## Suite priorisée, à construire et à valider

| Priorité | Travail | Critère de décision |
| --- | --- | --- |
| 1 | Tester contrôle et lecture sur de vrais téléphones, avec des connexions différentes | Comprendre la défaite et réussir volontairement un contre |
| 2 | Donner à chaque personnage une silhouette, une préparation d’action et une réaction propres | Reconnaître qui agit sans lire son nom |
| 3 | Approfondir les deux ou trois jeux qui donnent le plus de revanches spontanées | Les joueurs demandent eux-mêmes une autre partie |
| 4 | Renforcer le rendez-vous entre amis : session courte, alternance des jeux et classement de session clairement expliqués | Le groupe termine et relance une session sans aide |
| 5 | Finition audio facultative, tactile, chargement, accessibilité et appareils modestes | Mesures sur téléphones réels, pas seulement sur navigateur de bureau |

Pour les premiers essais, observer le temps avant la première action volontaire, les erreurs de compréhension, les revanches proposées sans sollicitation et les interruptions techniques. Les relever avec consentement ; aucun nouveau suivi analytique n’est installé par cette passe. Des petits essais orientent le travail, ils ne prouvent ni rétention à grande échelle ni potentiel de téléchargement mondial.

La prochaine étape de qualité ne consiste pas à multiplier les jeux ou à ajouter une connexion quotidienne obligatoire. Elle consiste à conserver les situations que les amis veulent réellement rejouer et à leur donner une exécution nettement meilleure.

## La proposition créative à pousser

**Un dessin animé jouable dans lequel tes amis deviennent tes meilleurs ennemis.** Chaque manche doit produire une petite histoire : provocation, piège annoncé, tentative de contre, catastrophe, revanche. Le drôle vient de ce que le joueur a fait et compris. Le texte et les effets soulignent cette histoire.

### Trois expériences à approfondir en premier

| Expérience | Promesse | État actuel | Prochain saut de qualité proposé |
| --- | --- | --- | --- |
| Braquage du Goûter | « Passe-moi le goûter, je couvre ta fuite ! » | Arène, trois combattants, livraison, passes, interceptions et salon privé 2v2 | Mieux régler les espaces de poursuite et les fenêtres de contre, créer de vraies animations de préparation et de récupération pour chaque combattant |
| Tarte ta Face | « Tu m’as raté ; regarde arriver la réponse. » | Placement contrôlable dans cette passe, visée, esquive et grosse tarte de riposte | Différencier les attitudes des deux pâtissiers, améliorer le geste de lancer et rendre le duel immédiatement compréhensible sans lire les règles complètes |
| Pigeon Express | « Ton pare-brise était tellement propre… » | Pilotage, vent, tirs balistiques, voiture personnelle et parasol | Mieux faire ressentir la vitesse et le largage, rendre les intentions défensives plus expressives, régler la difficulté du bot avec de vrais débutants |

Ces propositions ne sont pas présentées comme implémentées. L’ascenseur reçoit déjà les améliorations de rendu décrites plus haut ; les autres jeux restent accessibles pendant l’évaluation. Le catalogue ne doit pas grandir avant de connaître les expériences que les groupes redemandent réellement.

### Des personnages qui appartiennent à SlapTax

Faire évoluer les créations originales déjà présentes, avec des silhouettes reconnaissables en petit : le flan tremblant qui se donne des airs de héros, le cornichon sournois qui prépare ses coups, le toast massif qui s’interpose. Leurs fonctions et pouvoirs existent dans l’arène ; leur incarnation animée reste à approfondir.

Pour chaque personnage : attente, déplacement, préparation, action, récupération, impact, victoire et défaite. Une préparation doit laisser voir comment répondre. Une réaction doit montrer qui a été touché. La victoire doit célébrer le joueur sans rallonger chaque revanche.

Étendre progressivement cette troupe aux costumes des autres jeux, tout en préservant leur lisibilité. Les pouvoirs d’arène ne donnent pas d’avantage statistique caché dans une découpe ou un jeu de précision. L’identité visuelle et l’équité doivent rester compatibles.

### Une soirée de défis comme rendez-vous central

La session entre amis devrait devenir aussi claire que le choix d’un jeu : invitation, joueurs présents, courte rotation, résultat collectif, revanche ou nouvelle rotation. Le tournoi conserve son enjeu et son classement ; le défi de score conserve son intérêt quand les amis ne sont pas disponibles en même temps ; l’entraînement permet de préparer sa revanche.

Avant d’ajouter une nouvelle couche de progression, exploiter et tester les parcours de duel et de tournoi existants. Une future session de groupe simplifiée est une proposition de produit, pas une fonctionnalité livrée par cette passe.

Le partage doit porter sur un vrai moment de partie et son défi, en masquant ce qui doit rester privé. Les replays existants fournissent une base ; un export vidéo vertical avec son, sous-titres et lien de revanche exige encore une réalisation et une validation propres.
