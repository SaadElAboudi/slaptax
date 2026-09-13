# Gameplay v4

## GARDE

Quatorzieme jeu : un affrontement par epreuve du BO existant, sans BO3 interne.
Six PV, huit tours maximum. Trois secondes pour choisir attaque, charge ou
defense ; revelation simultanee de 1200 ms. Une attaque inflige un degat, deux
si le joueur etait charge. La defense bloque entierement mais ne peut pas etre
jouee deux tours consecutifs. Une charge est acquise meme sous attaque, ne se
cumule pas et expire au tour suivant. Recharger renouvelle la charge sans bonus
supplementaire ; defendre ou expirer consomme la charge precedente.

Une expiration n'inflige aucun degat et n'offre aucune protection. Le serveur
calcule les deux impacts a partir de l'etat anterieur, puis met a jour les PV.
KO ou tour huit : les PV restants decident. Double KO et egalite exacte attendent
l'accord des deux joueurs pour recommencer. Pas de mort subite ni de tirage au
sort du vainqueur. La reprise d'une coupure rejoue seulement le tour inacheve,
avec PV, charge et restriction de defense conserves, et un nouveau numero de tour.

Solo : bot explicitement identifie, decision prise avant celle du joueur a partir
de l'etat public. Resultat 1000/500/0 pour victoire/egalite/defaite, aucun debit
ni effet competitif. Defis, tournois, veto, recap et export PNG/video utilisent
les integrations existantes. Historique complet des actions, attaques chargees
et PV restants par tour. Les choix verrouilles ne sont visibles que par leur
proprietaire avant la revelation ; aucun changement de charge ou de defense
publique ne divulgue un choix secret.

Ce prototype ne constitue pas une preuve d'equilibrage : fenetre de trois
secondes, strategie de defense alternee et comportement du bot restent a
calibrer avec des joueurs. Pas de GARDE asynchrone, de deploiement public ni de
nouvelle garantie d'authentification ou de stockage multi-instance.

Validation GARDE : build TypeScript/Vite reussi, 113 tests serveur et 12 parcours
navigateur cibles reussis sur Chromium ordinateur/mobile. Matrice complete avec
les quatre configurations de charge, confidentialite, defense non consecutive,
expirations, KO/double KO, reprise et historique testes. Parcours tactiles solo
et duel de huit tours, resultat persiste et export PNG verifies, ainsi que les
parcours existants de matchmaking/veto/tournoi. Controle du build final en
francais a 1280 x 900 et 320 x 740 : trois actions visibles, non masquees,
aucun debordement horizontal ni erreur JavaScript. Suite navigateur historique
complete, Safari/iOS reel et tests de charge non rejoues.

## TRACE, resultats, defis par lien et DECOUPE

Le catalogue compte treize jeux. TRACE et DECOUPE sont disponibles en solo,
duel et tournoi, et peuvent etre bannis avant la rotation.

TRACE : deux secondes de preparation, deux secondes d'observation puis six
secondes pour dessiner un trait unique. Lever le doigt ou la souris engage
le trace. Trois formes communes, 2800 ms de revelation par essai. Le serveur
reechantillonne les traces par longueur d'arc, compare les deux sens de parcours,
tolere les petits tremblements et penalise les longueurs excessives. Pas de
bonus de vitesse. Les coordonnees sont normalisees et limitees a 128 points ;
le client les arrondit a quatre decimales pour respecter les messages de 4 Ko.

DECOUPE : trois polygones convexes, proportions cibles de 25 a 75 %, huit
secondes pour tracer une ligne, choisir le demi-plan conserve et valider.
La droite de coupe est prolongee jusqu'aux bords. Matter.js calcule les aires
des morceaux decoupes. Les pourcentages sont arrondis au dixieme ; l'erreur
totale minimale gagne. Une coupe qui ne traverse pas la forme est invalide.

Les reponses restent privees jusqu'a la revelation. Une expiration vaut zero
(equivalent a 100 points d'erreur pour DECOUPE). Une egalite exacte en duel
attend les deux consentements. En direct, une reconnexion recommence seulement
l'essai inacheve, avec la meme cible et un nouveau numero de tour. Le serveur
ne pretend pas pouvoir prouver qu'un trace a ete dessine par un humain.

Les recaps affichent les trois dessins/coupes compares, les couleurs CHROMA,
les ecarts de Pile Chrono ou les cinq echanges de CONTREPIED. Les images de
resultat incluent les trois essais des nouveaux jeux. La revanche conserve
mise et BO ; les preferences de draft suivent desormais leurs joueurs lorsque
les cotes sont inverses, avec consentement et veto toujours requis.

Les defis par lien sont proposes pour TRACE et DECOUPE, depuis l'entrainement.
Le createur joue une nouvelle epreuve avant de partager. Chaque ami joue les
memes trois cibles, une seule participation par session. Aucun score client
n'est accepte et le score du createur n'est communique qu'apres la participation.
Le resultat et les delais sont conserves dans le store existant : recharger ou
redemarrer le serveur ne remet pas le chronometre a zero. Un abandon consomme
les essais restants. Aucun debit, gain, classement ou bonus competitif.
Liens valables sept jours ; creation limitee a vingt par session sur 24 h,
cinq mille liens actifs et mille participations par lien maximum. Partage natif,
copie et champ de lien selectionnable ; images exportables avec noms optionnels.

Limites avant ouverture massive : la session anonyme n'empeche ni multi-comptes
ni automatisation. Le stockage JSON/PostgreSQL global reste mono-processus,
et PostgreSQL acquitte ses ecritures en arriere-plan. Pas de nouvelle garantie
transactionnelle multi-instance. Aucun test de charge, Safari/iOS reel ou
calibrage doigt/souris avec un panel humain ici. Aucun deploiement public.

Validation finale : build TypeScript/Vite reussi et 103 tests serveur reussis.
Vingt parcours Chromium ordinateur/mobile valides : dix-huit au premier passage,
puis les deux tests de catalogue rejoues avec leur attente mise a jour pour TRACE.
Les parcours incluent solo, duel, veto, matchmaking, tournoi et defi asynchrone
createur/ami avec rechargement du resultat. Les tests mobiles des dessins utilisent
des evenements tactiles. Controle complementaire du build final en francais a
1280 x 900 et 320 x 740 : aucun debordement horizontal, aucune erreur JavaScript,
bouton de coupe visible et non masque, trace dense accepte (1784 octets, sous
la limite WebSocket de 4096). La suite navigateur historique complete n'a pas
ete rejouee. Apercu local : http://127.0.0.1:8789.

## CONTREPIED

Onzieme jeu, disponible en solo, defi et tournoi, avec acces direct a l'accueil
et categorie Tactique. Chaque joueur dispose des cartes 1 a 5, utilisables une
seule fois. Les cinq recompenses 1 a 5 sont melangees une fois, puis leur ordre
complet est affiche aux deux joueurs. Chaque echange dure au maximum sept
secondes, suivi d'une revelation simultanee de 2,3 secondes.

La carte la plus forte remporte la recompense ; une egalite la defausse. Apres
cinq echanges, le plus grand total gagne un point dans la rotation du match.
Une egalite finale attend le consentement des deux joueurs pour rejouer.
Un joueur qui expire consomme sa plus petite carte restante, mais sa force est
nulle pour cet echange. Deux expirations defaussent la recompense. Aucun bonus
de vitesse ni choix aleatoire du vainqueur.

Le serveur valide carte disponible, numero de tour et appartenance au duel.
Il ne retire les cartes des mains publiques qu'a la revelation : les retirer
au verrouillage permettrait de deduire le choix secret. Le joueur retrouve son
propre choix apres reconnexion ; le rival et les spectateurs ne le recoivent
pas avant la revelation. Une pause conserve les choix et le temps restant.
L'historique des cinq echanges figure dans le resultat partage.

Le solo utilise un bot explicitement identifie, jamais presente comme humain.
Il choisit avant le joueur, selon la valeur relative de la recompense et une
variation aleatoire. Le solo ne modifie ni portefeuille ni classement competitif.
Le score d'entrainement normalise les points remportes sur les quinze possibles.
Les limites existantes de session sans authentification, de stockage et de
validation Safari/iOS restent applicables. Aucun deploiement public ici.

Validation CONTREPIED : build de production reussi, 86 tests serveur et 12
parcours navigateur cibles reussis sur Chromium ordinateur/mobile. Couverture
des cinq echanges solo et duel, des choix secrets, des expirations, du veto
en tournoi et des parcours existants de matchmaking et d'entree dans l'arene.
La suite historique complete des navigateurs n'a pas ete rejouee.

## RICOCHET

Dixieme jeu, disponible en solo, defi et tournoi, avec acces direct a l'accueil.
Trois salves : chaque joueur verrouille angle et puissance dans une fenetre de
dix secondes. Les deux tirs sont lances ensemble. Un joueur qui ne valide pas
perd son tir, sans proposition automatique. Chaque salve conserve les palets
precedents. Les deux sorties laterales eliminent les palets qui les traversent.
Le palet restant le plus proche du centre apres la troisieme salve gagne
l'epreuve ; les distances sont arrondies au dixieme d'unite du plateau 600 x 600.
Une egalite exacte attend l'accord des deux joueurs pour recommencer.

Matter.js arbitre les collisions cote serveur, sans gravite. Chaque salve est
simulee en 720 pas fixes de 1/120 seconde, puis restituee sur six secondes.
Le navigateur interpole les positions recues, sans determiner les collisions
ou le vainqueur. Le plateau est tourne de 180 degres pour le second joueur ;
angles, puissance, dimensions et positions de depart sont symetriques.
La visee adverse n'est pas envoyee avant le tir. Une pause conserve les tirs
verrouilles et la position dans la simulation. Le replay conserve la derniere
salve, huit secondes et 81 instantanes maximum ; les autres jeux restent a 31.

La simulation est bornee a six palets et reste executee dans le processus
serveur. Les essais de charge, la calibration du gameplay avec de vrais joueurs
et Safari/iOS restent necessaires avant une ouverture massive. Pas de physique
persistante entre redemarrages, ni de nouvelle garantie anti-usurpation.

Validation RICOCHET : 77 tests serveur reussis et 12 parcours navigateur cibles
reussis sur Chromium ordinateur/mobile. Les tests incluent trois salves solo
et duel, canvas non uniforme et pixels en mouvement, tirs secrets, entree/sortie
de salon, matchmaking, catalogue et tournoi. L'audit npm des dependances serveur
de production ne signale aucune vulnerabilite connue. La suite historique
complete des navigateurs n'a pas ete rejouee ; aucun deploiement public ici.

## CHROMA

Neuvieme jeu, disponible dans Precision, en solo, defi et tournoi, avec acces
direct depuis l'accueil. Trois essais par epreuve : preparation 3-2-1,
observation de la cible pendant deux secondes, reconstruction pendant dix
secondes maximum, puis revelation simultanee pendant 3,5 secondes.

La distance euclidienne entre les trois canaux RVB est calculee sur le serveur,
arrondie au millieme puis additionnee sur les trois essais. La plus petite
erreur totale gagne un point dans la rotation du match. Aucun bonus de vitesse.
Ce format ne constitue pas un BO3 interne : le BO du duel englobant est conserve.
Les egalites exactes attendent le consentement des deux joueurs pour rejouer.

Les canaux cibles sont tires entre 24 et 231 pour eviter les extremes dans cette
premiere version. Le nuancier combine un carre saturation/luminosite et trois
curseurs utilisables au clavier. La validation verrouille la proposition ; a
expiration, le serveur prend la derniere couleur recue (gris neutre par defaut).
Les propositions adverses ne sont diffusees qu'a la revelation. La cible cesse
d'etre envoyee pendant la reconstruction ; un client modifie peut toutefois
conserver la couleur recue pendant l'observation. Ce n'est pas un dispositif
anti-triche contre les clients modifies ou les captures d'ecran.

Une reconnexion rejoue uniquement l'essai inacheve, meme cible et nouveau numero
de tour, pour les deux joueurs. Les essais termines et leur score sont conserves.
Le resultat partage montre la cible et les deux propositions du dernier essai.
Les differences d'ecrans, filtres nocturnes et perception des couleurs restent
une limite d'equite : aucune calibration perceptuelle n'est revendiquee.

Validation CHROMA : 70 tests serveur reussis, dont confidentialite des couleurs,
validation des canaux, verrouillage, expiration, egalite, reprise et integration
au veto des tournois. Douze parcours Playwright reussis sur Chromium ordinateur
et mobile : CHROMA solo/duel et regressions catalogue, salons, matchmaking et
tournoi. La suite historique complete des navigateurs n'a pas ete rejouee pour
cet ajout. Aucun nouveau jeu TRACE ni deploiement public dans cette livraison.

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
