# La Manufacture SlapTax

## Promesse

Des potes, une rivalité, un défi simple et une revanche. Les mises et gains en
jetons restent dans les parcours existants. Le récit n'ajoute ni monnaie, ni
boutique, ni verrouillage de jeux, ni tâche obligatoire avant de pouvoir jouer.

La Manufacture est une usine cartoon où l'Intendant taxe même le goûter. Les
joueurs forment des brigades concurrentes pour reprendre les caisses de la
Cantine. Ils restent des rivaux amicaux : leur but est de se défier, pas de suivre
une campagne solo imposée.

## Arène centrale et ateliers

**Braquage du Goûter, à la Cantine**, porte l'expérience principale : une caisse,
deux dépôts, trois livraisons. Un stick et une action contextuelle. Les mêmes
règles s'appliquent en entraînement, duel et salon à quatre.

Les autres jeux racontent les incidents de cette même manufacture :

- Ferme royale : le poulet couronné du fournisseur refuse de livrer la Cantine.
- Cuisine : le chef partage le butin, avec une portion précise à servir.
- Entrepôt : empiler les caisses sans perdre le stock.
- Pâtisserie : des représailles à la chantilly.
- Quai : les livreurs se vengent sur les voitures du parking.
- Bureaux : survivre à l'ascenseur pour atteindre l'Intendant.
- Chaufferie : gonfler les ballons de la fête sans les faire éclater.
- Canalisations : récupérer les canards qui se sont échappés.
- Réfectoire : la bagarre après le casse.
- Vestiaire : les différends se règlent à la poêle et à la banane.
- Bureau des taxes : le colis explosif de l'Intendant.

Le contrat bilingue est `shared/slaptax-world.json`. Il alimente les lieux affichés,
l'accueil, les fiches, les briefings et le retour vers la Cantine. Tous les
ateliers restent accessibles. Le mode entraînement, les défis entre amis, les
challenges et les tournois conservent leurs fonctions et leur résultat réel.

## Lisibilité et sensations

- L'accueil présente d'abord l'arène centrale et le défi entre amis. La soirée à
  quatre reste accessible comme mode secondaire.
- Une phrase de récit au briefing, puis les commandes. Pas d'exposition narrative
  à lire pendant les combats.
- En portant une caisse, son dépôt est entouré et marqué « ICI », en plus de sa
  couleur. Le résultat ne dépend pas de la capacité à distinguer deux couleurs.
- L'impact visuel et sonore part d'un événement de touche confirmé par le serveur.
  Le mouvement réduit et les préférences sonores sont respectés. Pas de musique
  imposée. Le retour haptique existant reste optionnel.
- L'ancien message « Super prêt » est retiré : il ne correspondait plus aux
  commandes disponibles après simplification.

## Multijoueur : fonctionnement vérifiable

Les commandes sont coupées dès l'événement réseau hors ligne, ou quand le dernier
état serveur a plus de trois secondes. Le message explique la synchronisation
interrompue. Le retour en ligne et le retour au premier plan relancent la connexion
sans conserver deux sockets actives. Les déplacements maintenus sont remis à zéro.

La reconnexion retrouve le même défi. Le serveur conserve le résultat, les pauses
et les délais d'annulation existants ; le client ne crée jamais de gagnant ou de
paiement pour masquer une panne. Un E2E vérifie pause, reprise, identité du défi,
absence de résultat et maintien des mises retenues. Les E2E de panne/remboursement
restent requis. Un événement réseau simulé ne remplace pas un essai radio réel.

## Conditions avant de parler de finition comparable aux références

Ces éléments constituent une itération, pas une preuve de sensations parfaites.
Il reste à mesurer sur les appareils réels :

1. Deux amis comprennent le but et les commandes sans explication orale.
2. Le premier déplacement répond immédiatement et les corrections réseau ne
   traversent jamais les obstacles.
3. Dix essais sur iPhone Safari et Android Chrome, dont arrière-plan, bascule
   Wi-Fi/4G et reconnexion ; aucun mauvais résultat ni double règlement.
4. Lisibilité des personnages, de la caisse et du dépôt sur les petits téléphones.
5. Stabilité du rendu pendant plusieurs parties et avec une connexion dégradée.
6. Demandes spontanées de revanche : observation de joueurs, pas affirmation
   déduite du nombre de tests techniques.

Les tournois et la progression doivent valoriser cette rivalité réelle. Ajouter
encore des jauges, monnaies ou pouvoirs avant ces validations disperserait le travail.

## Validation de cette livraison

- 321 tests serveur et 25 tests unitaires web réussis.
- Six parcours navigateur ordinateur/mobile réussis : accueil et retour des ateliers,
  reconnexion de la Cantine et de Passe ou BOUM, sans victoire ni règlement anticipé.
- Le serveur fige désormais aussi le temps publié pendant une pause : le temps de
  transport reste distinct du temps de jeu, pour éviter une mèche qui avance à tort.
- Construction web et synchronisation Android/iOS réussies, source `06c576e4c02d`.
- Les essais sur téléphones physiques et les mesures de plaisir restent nécessaires.

## Le feuilleton de la brigade

Une nouvelle couche comique suit les parties sans ajouter de commande :
- À la Cantine, les trois livraisons déroulent le gag du stagiaire et du frigo.
- Une égalisation réellement confirmée et le franchissement des 15 secondes
  déclenchent un commentaire bref. Aucune annonce de victoire locale.
- Les captures produisent une courte gerbe de confettis autour du dépôt ; les
  mouvements sont réduits avec la préférence système. Pas de nouvelle musique.
- Les douze ateliers ont un épilogue visible en entraînement et au verdict du duel.
- L’accueil suggère quatre épisodes cycliques d’après le nombre de parties dans
  l’historique chargé et les entraînements enregistrés sur cet appareil. C’est
  une suggestion narrative, pas une campagne persistante ou une récompense.
  L’historique local peut être effacé et tous les jeux restent accessibles.

La prochaine validation produit doit mesurer si les joueurs comprennent la blague,
se rappellent l’Intendant et proposent spontanément une revanche. Cette version
améliore les réactions et la continuité ; elle ne prouve pas à elle seule la rétention.

## Stabilisation tactile et compréhension

- Avant le choix du mode, le but et le geste principal sont visibles dans chaque
  fiche, à partir de `shared/simple-play.json` ; les règles détaillées restent accessibles.
- Le stick Cantine/Ferme ignore les mouvements inférieurs à 6 px puis monte
  progressivement à pleine vitesse à 30 px, sans avantage diagonal.
- Lancer la caisse n’attend plus la récupération de la baffe ; une attaque encore
  en cours de résolution reste protégée et une caisse ne peut être lancée deux fois.
  Cette règle s’applique au moteur commun, en entraînement, duel et tournoi.
- Panique aux Toilettes annule la destination maintenue quand le jeu est désactivé.
  Les gestes simultanés ne remplacent plus le doigt de pilotage dans ce jeu et Pigeon.
- Les commandes du cadre de jeu tactile ont une cible minimale de 44 × 44 px.
- Les épisodes utilisent le total des entraînements du profil si disponible, avec
  l’historique de l’appareil comme solution de repli ; ils ne dépendent pas de séries quotidiennes.

Validation : 322 tests serveur et 30 tests web réussis. La validation humaine de
la facilité, du rythme et de l’envie de revanche reste un critère de sortie produit.

Contrôle navigateur : 18 scénarios réussis et 3 exclusions de plateforme dans la
matrice ciblée ; un clic d’entrée mobile est resté au briefing sans erreur JS.
Ce scénario a ensuite réussi trois fois en isolation, sans modification du test.
L’intermittence n’est pas considérée résolue ; suivre les prochaines exécutions CI
et les essais sur appareils physiques. Les douze scènes à 320 px, les commandes
portrait/paysage et les parcours panne/remboursement/reconnexion ont réussi.

## Entrée mobile et récupération explicite

La CI de `0d27ff4` a terminé avec succès, y compris les navigateurs croisés et
les compilations natives Android et iOS. Le clic manqué isolé n’a pas de cause
racine démontrée. Deux améliorations réduisent les ambiguïtés :
- Aucun déplacement animé du panneau sur un écran tactile ; le bouton d’entrée
  utilise le comportement tactile de bouton et conserve une cible de 48 px.
- Une connexion absente affiche un message et « Réessayer la connexion » ; la
  vérification de santé, la session et le profil sont rechargés sans créer de défi.
  L’utilisateur entre ensuite volontairement dans la partie.

Un test navigateur simule une panne, vérifie l’échec explicite, restaure la santé
serveur puis entre en entraînement ; aucune création de duel n’est autorisée dans
ce parcours. La source de l’intermittence reste à surveiller sur appareils réels.
