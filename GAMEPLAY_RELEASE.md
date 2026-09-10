# Gameplay v4

## Experience et preparation des parties

Le catalogue propose huit jeux filtres par Reflexes, Precision, Reflexion et
Risque. Les affiches illustrent les mecanismes des jeux sans charger de police
ou d'image externe. L'arene masque la navigation pendant le jeu. Les jeux
signatures disposent d'un compte a rebours superpose ; les resultats de manche
et de duel affichent les victoires, la prochaine epreuve et une continuation
explicite, egalement dans les tournois. Les mouvements decoratifs respectent
la preference de mouvement reduit.

Chaque participant d'un nouveau duel bannit un jeu avant READY. Les deux bans
peuvent designer le meme jeu. La rotation affichee est persistee puis utilisee
au lancement ; changer un vote annule les confirmations des deux joueurs.
Les anciens duels sans veto restent compatibles.

En tournoi, chaque entrant vote pour une exclusion commune. Le jeu le plus
vote est retire des trois epreuves de tous les duels du bracket ; une egalite
est tranchee par l'ordre stable du catalogue. Une modification de vote, de
rotation ou de participants annule les confirmations. Quitter un salon en
attente libere la place et transmet le role d'hote au premier joueur restant.
Un salon vide est supprime. Un duel ami en attente peut etre annule sans debit.

La file de matchmaking elimine les doublons, les joueurs deja occupes, les
soldes insuffisants et les entrees sans signal depuis 60 secondes. Le navigateur
renouvelle sa presence pendant que l'application est visible. Rejoindre de
nouveau la meme file conserve l'anciennete ; une creation de duel echouee ne
supprime pas les deux joueurs de la file.

Le paquet npm `psql` inutilise et ses dependances ont ete retires (55 paquets).
Le serveur continue d'utiliser `pg` pour PostgreSQL. L'installation rapporte
zero vulnerabilite connue, contre 17 alertes avant ce nettoyage ; cela ne
remplace pas un audit de securite du code applicatif.

## Nouvelle selection

Trois jeux signatures apparaissent en premier sur l'accueil, avec acces direct
au solo et au defi ami. Les cinq jeux historiques restent dans le catalogue.

| Jeu | Regle | Resultat |
| --- | --- | --- |
| Faux Depart | Attendre GO, eviter le leurre, une feinte par joueur | Premier a trois points, sept essais maximum |
| Pile Chrono (Blind Clock) | Cible commune aleatoire de 2 a 10 secondes, depart 3-2-1 puis TOP, un appui STOP ; trois essais | Plus faible erreur cumulee |
| Encore Un | Empiler, accepter le risque ou securiser sa tour | Plus haute tour securisee ; chute = zero |

Les trois utilisent le meme moteur serveur en solo et en duel. Le solo ne
modifie pas le portefeuille ni l'historique competitif. Une egalite exacte
attend le consentement des deux joueurs pour rejouer. Un essai de precision
interrompu ou expire est penalise, jamais transforme en score parfait.

Pile Chrono conserve l'identifiant `onesecond` pour les liens existants. Chaque
essai tire une cible entiere commune, affiche trois secondes de preparation,
puis un signal TOP visuel et sonore. Il n'y a ni musique rythmique ni temps
ecoule dans l'etat public pendant l'estimation. Le resultat montre la mesure,
l'ecart signe et les erreurs cumulees. Apres reconnexion, seul l'essai inacheve
recommence avec la meme cible et un nouveau numero de tour. Les anciens appuis
sont rejetes. Les records solo de l'ancienne regle ne sont pas reutilises.

Encore Un interpole les positions entre les etats serveur pour un rendu fluide,
sans deplacer l'arbitrage dans le navigateur. Le verrou anti-double-appui est
repercute dans le bouton. Les niveaux solo inoperants des jeux signatures ont
ete retires ; les cinq jeux historiques conservent leurs niveaux.

Le resultat comprend une rivalite mensuelle calculee sur les duels arbitres,
des reactions avec temporisation, la revanche et un replay des trois dernieres
secondes (31 instantanes maximum). L'export portrait PNG fonctionne sans service
tiers ; la video utilise MediaRecorder lorsqu'il est disponible. Les pseudos sont
exclus par defaut. Le replay est une reconstruction des etats serveur, pas une
capture video du navigateur du rival ; les effets prives sont vus depuis le
premier joueur.

Le timing utilise la reception serveur : la variation de latence reseau peut
affecter les mesures. Ce n'est pas une mesure sportive certifiee a la milliseconde.
Les replays sont bornes par partie mais leur retention globale reste a definir
avant une forte croissance du stockage.

## Format

Cinq jeux historiques, disponibles en entrainement, duel humain et tournoi humain. Les
identifiants existants restent inchanges : les anciens liens restent utilisables.
Apres un entrainement, "Defier un ami" ouvre la preparation du duel avec le jeu
selectionne. Le partage des resultats et les demandes de revanche restent integres.

| Jeu | Epreuve | Arbitrage en duel |
| --- | --- | --- |
| Bounce Panic | Renvois, bonus offensifs, mort subite a 30 s, limite a 45 s | Physique et gagnant sur le serveur |
| Symbol Sprint | Sequence commune, restitution rapide, bouclier et brouillage | Reponses et penalites sur le serveur |
| Bomb Pass | Passer dans une zone qui retrecit avant explosion | Porteur, zone, meche et resultat sur le serveur |
| Cup Shuffle | Trois melanges progressifs, une selection par observation | Memes deplacements et jeton pour les deux joueurs |
| Duel Numeric | Cinq questions communes, six secondes et une reponse chacune | Reponse correcte jamais envoyee avant validation |

Cup Shuffle et Duel Numeric : 1000 points par bonne reponse et un bonus de vitesse
plafonne a 150 points. Une bonne reponse supplementaire prime sur la vitesse sur
les trois/cinq etapes initiales. Une egalite exacte relance une etape commune.
Le jeton des gobelets est visible pendant la revelation et la correction seulement.
Les scores d'entrainement sont locaux, distincts des resultats competitifs. Les
records v2 ont une nouvelle cle de stockage pour ne pas melanger les baremes.

## Contrats techniques

- Les huit jeux humains utilisent `arena.join`, `arena.state` et `arena.action`.
- Le solo des trois nouveaux jeux utilise `party.practice` et les memes actions.
- Une reponse de course contient `stage` et `value`. Le serveur rejette les
  doublons, etapes obsoletes, options inexistantes et reponses hors delai.
- `POST /api/duels/:id/rounds` refuse les scores clients pour les huit jeux.
- Une deconnexion suspend la manche pendant le delai existant de 20 secondes.
  La reprise conserve la question, les reponses, la sequence et le temps restant.
  Exception : Pile Chrono relance l'essai inacheve avec un nouveau TOP.
- Les messages WebSocket sont limites a 4 Ko et 90 messages par seconde par
  connexion ; un client lent ne cumule pas une file illimitee d'etats sortants.
- Les animations de timing solo utilisent une horloge monotone. Les callbacks
  de fin et animations sont nettoyes au demontage.
- Le stockage JSON remplace les fichiers par renommage atomique afin de ne pas
  laisser un JSON partiellement ecrit apres une interruption.
- Les gobelets et la balle restent animes car le mouvement constitue l'epreuve.
  Les animations decoratives respectent la preference de mouvement reduit.

## Verification locale

```sh
npm test
npm --prefix web run qa:e2e
```

Les tests couvrent notamment : options mathematiques, confidentialite des
reponses, doublons, expiration, reprise sans temps gratuit, refus de scores
clients, entrainements, deux navigateurs concurrents, arbitrage persiste,
tournois, invitations et revanches. Playwright execute les parcours sur Chromium
desktop et mobile et produit des captures dans `web/test-results`.

Validation v4 du 10 septembre 2026 : build TypeScript/Vite reussi et 64 tests
serveur reussis. La suite navigateur initiale a produit 51 reussites, trois
exclusions mobiles et deux echecs de verification : connexion HTTP reinitialisee
et selecteur de bouton ambigu apres ajout du veto. Apres correction, la relance
ciblee a produit neuf reussites et une exclusion, incluant deux nouveaux cas
de sortie de salon. Au total, 55 parcours distincts ont reussi ; les trois
scenarios de synchronisation/rematch/salon multijoueur ignores sur mobile sont
executes sur desktop. Le catalogue est aussi controle a 320 pixels de large.
Les nouveaux jeux sont joues sur les deux formats. Le test francais
verifie aussi l'absence d'obstruction du bouton et de debordement horizontal.
L'export video est decode en 720 x 900 avec verification de pixels non uniformes.
`npm audit --omit=dev` rapporte zero vulnerabilite connue cote serveur et frontend.
Les tests mobiles emulent
Chromium : ils ne remplacent pas une validation sur appareils iOS reels.

## Recharge beta

100 SLAP$ virtuels additionnels par joueur existant, une seule fois pour
`beta-september-2026`. La trace est dans `user.creditGrants`, sans toucher aux
duels ni aux historiques. La commande est en simulation par defaut :

```sh
node api/scripts/grantBetaCredits.js
node api/scripts/grantBetaCredits.js --apply
```

Elle utilise `DATABASE_URL` si renseigne, sinon `DB_PATH` ou la base JSON locale.
Arreter l'instance applicative avant une execution sur la base publique : le
store PostgreSQL actuel conserve un cache en memoire. Sauvegarder PostgreSQL
avant application. En mode fichier, une copie `.bak` est creee automatiquement.
La recharge locale du 9 septembre a credite 23 joueurs (+2300 au total) ;
une seconde execution a credite zero joueur. La base publique n'a pas ete jointe.

## Conditions avant ouverture massive

La beta reste sans compte, conformement au choix produit. Les credits sont
virtuels et cette version n'est pas destinee a des mises en argent reel.
Cette refonte des jeux ne constitue pas une certification de production globale.
Les points suivants sont presents dans l'architecture existante et restent a traiter :

1. Authentifier les mutations HTTP et les connexions WebSocket : un `userId`
   fourni par le navigateur ne prouve pas l'identite du joueur. Limiter les messages
   et arbitrer les scores ne protege pas contre l'usurpation d'identite.
2. Fermer ou isoler les anciens endpoints de simulation, de reset et de reglement
   historique avant de considerer le classement ou le portefeuille inviolables.
3. Les arenes actives vivent dans la memoire d'un seul processus. Un redemarrage
   ne conserve pas leur etat. Pour plusieurs instances, il faut un routage stable
   des duels et un stockage/transport partage, ainsi que des essais de charge.
4. Les egalites de courses rejouent une etape jusqu'au departage. Une politique
   d'annulation et remboursement pour deux joueurs inactifs reste necessaire.
5. Retablir et verifier PostgreSQL sur Render, sauvegardes comprises, puis tester
   deux appareils reels avec latence reseau. La validation locale utilise JSON.
   Renouveler le mot de passe de connexion qui a ete partage dans la conversation.

Les limites par connexion ne remplacent pas une limitation globale par identite/IP.
Les tests de navigateur ne constituent ni un audit anti-bot, ni un test de charge,
ni une validation sur Safari/iOS. Aucun deploiement public n'est effectue ici.
