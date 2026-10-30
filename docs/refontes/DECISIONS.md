# Décisions de refonte — 29 octobre 2026

Décisions validées par l’utilisateur : consigner l’audit puis lancer les travaux.
Ces priorités sont un jugement de conception ; elles ne proviennent pas encore de mesures de rétention ou de tests utilisateurs.

## Direction

Une arène principale, Braquage du Goûter, et trois jeux bonus à pousser : Tarte ta Face, Bagarre de Table, Panique aux Toilettes. Poule Position devient une variante forte de l’arène. La soirée à quatre conserve sa playlist braquage / tartes / tour : sa progression et ses salons ne doivent pas être cassés pour changer la vitrine.

| Jeu | Décision | Travail attendu |
|---|---|---|
| Braquage du Goûter | Arène principale | Lisibilité, attaques distinctes, routes et combats ; tester les sensations avant de multiplier les pouvoirs. |
| Poule Position | Variante de l’arène | Préserver poulet rebelle / œufs et développer les situations spécifiques. |
| Tarte ta Face | Bonus prioritaire | Visée, feintes, esquives et retournements lisibles. |
| Bagarre de Table | Bonus prioritaire | Impulsion précise, collisions satisfaisantes, chutes compréhensibles. |
| Panique aux Toilettes | Bonus prioritaire | Trajectoires, vol de canards et fuite devant la chasse. |
| Gonfle ou Pète | Refonte prioritaire | Remplacer le seul maintien/relâchement par cible, contre-jeu et risque lisible. |
| Ascenseur à Prouts | Refonte prioritaire | Plusieurs dangers, défense active et récompense des séries. |
| Passe ou BOUM | Refonte prioritaire orientée groupe | Passes parfaites utiles dès maintenant ; concevoir ensuite une vraie circulation à plusieurs. Le duel actuel ne devient pas artificiellement un mode groupe. |
| Pigeon Express | Enrichir avant mise en avant | Routes de largage, anticipation du vent et contre-jeu ; éviter une simple répétition de tirs. |
| Chef Couic | Bonus de précision | Conserver les challenges asynchrones, améliorer sensations et variantes de découpe. |
| Tour de Trop | Bonus de score | Conserver les challenges et la soirée ; construire une identité plus distinctive. |
| Pif Paf | Bonus tactique à évaluer | Mesurer lisibilité des choix et envie de revanche avant d’ajouter des actions. |

## Critères avant promotion d’un jeu

Comprendre l’objectif sans explication orale ; réussir une première action rapidement ; comprendre une défaite ; avoir plusieurs réponses à une attaque ; pouvoir réclamer une revanche sans friction. Vérifier avec de vrais joueurs l’envie de relancer, les abandons et les raisons de frustration. Aucun seuil de viralité inventé.

## Premier lot lancé

- Ballons : cibles 55/70/85 %, bonus de précision, explosion lisible à 100 %, sabotage annoncé et soupape défensive. Les règles sont serveur ; les points ne deviennent pas des jetons.
- Ascenseur : double danger toutes les trois vagues, récompense des séries et respiration défensive brève. Les annonces précèdent les impacts.
- Bombe : passes parfaites et récupération bornée d’un bouclier, mêmes critères en entraînement et duel. Le vrai mode groupe reste un chantier séparé, avec circulation et déconnexions à concevoir.
- Vitrine : présenter l’arène et ses trois bonus prioritaires ; conserver les autres jeux accessibles pour évaluation et les salons existants.

Les autres lignes sont des travaux planifiés, pas des refontes déjà livrées. Voir VALIDATION.md pour les résultats réellement vérifiés et les limites de publication.

## Deuxième lot — Pigeon Express

Implémentation et résultats : [PIGEON-VALIDATION.md](PIGEON-VALIDATION.md).

- Visée anticipée : silhouette de la voiture rivale à 0,9 s, correspondant à la durée réelle de chute ; conserver la dérive du vent et le risque de toucher sa voiture.
- Centres consécutifs : premier centre à 180 points, puis +20 par niveau, maximum +60 par tir. Raté, tir décentré, bloqué ou sur sa voiture : série interrompue.
- Parasol précis : ouverture dans les 200 ms avant un impact adverse, parade à 80 points au lieu de 40 ; aucun point sur ses propres tirs.
- Avertissement au sol des tirs adverses dans les 650 dernières ms, avec compte à rebours.
- Règles serveur communes aux entraînements, duels et matchs de tournoi ; aucun changement de jetons. Les nouveaux compteurs restent dans les états enregistrés pour les replays.
- Les routes de largage supplémentaires et la véritable bombe en groupe restent à concevoir. Ce lot améliore la précision et le contre-jeu du pigeon sans annoncer ces chantiers comme livrés.

## Troisième lot — Tour de Trop

- Garder le choix central : sécuriser sa hauteur ou tenter un bloc supplémentaire. Aucun changement de jetons ou de conversion du score.
- La bouée gagnée après trois parfaits offre désormais deux usages exclusifs : absorber un raté ou réparer le sommet. Réparer rend jusqu’à 12 % de largeur de terrain, avec plafond à la largeur initiale, sans gagner de bloc ni de point.
- Une réparation consomme la bouée, remet la série à zéro et relance le mouvement ; une bouée dépensée ne se regagne pas.
- Montrer les parties coupées en rouge, le chevauchement conservé en vert et les placements parfaits en doré. Afficher la largeur restante.
- Même commande serveur et même composant de protection/réparation pour entraînement, duels, défis partagés et matchs de tournoi. Préserver les salons de soirée et les liens existants.
- Résultats et limites : voir TOWER-VALIDATION.md. Ce lot ne transforme pas ce bonus de précision en une nouvelle arène principale.

## Quatrième lot — Chef Couic

- Remplacer les trois formes proches par un menu de trois commandes : biscuit pentagonal libre, fromage triangulaire en coupe verticale, gâteau octogonal en diagonale descendante.
- Guider les deux directions imposées sur souris et tactile, sans calculer ni afficher la portion obtenue avant validation. Garder le choix du morceau à conserver.
- Valider aussi la direction côté serveur, avec une tolérance angulaire de 12 degrés ; le score reste fondé uniquement sur l’erreur de surface. Une coupe refusée ne consomme pas l’essai avant expiration.
- Afficher la progression des trois commandes et un conseil fondé sur le résultat réel : garder plus petit, plus grand ou féliciter la précision.
- Les anciens défis sans direction conservent leurs règles. Les nouveaux objectifs restent identiques pour les deux amis ; l’entraînement, les duels et les matchs de tournoi réutilisent la même simulation.
- Aucun changement de jetons ni de conversion du score. Ce lot ne livre pas les autres refontes restantes. Résultats : CUT-VALIDATION.md.

## Cinquième lot — prise en main de l’arène et compilation mobile

- Mémoriser l’assistance de visée et la vue compacte/immersive pour Braquage du Goûter et Poule Position, dans tous les parcours qui réutilisent l’arène. Si le stockage est bloqué, garder le réglage utilisable pour la session.
- Montrer un guide contextuel du personnage : description du pouvoir, recharge réelle du catalogue partagé, super et commandes adaptées au tactile ou au clavier. Préciser que la lecture ne met pas un match en pause.
- Réserver la hauteur du guide dans la vue immersive PC et réduire la scène à son ouverture ; éviter de couper les contrôles en haut de l’écran.
- Les raccourcis de combat doivent agir depuis l’arène, sans détourner les touches lorsqu’un bouton, un champ ou le guide a le focus. Ouvrir le guide remet le déplacement à zéro.
- Conserver les règles et les jetons : ce lot porte sur la prise en main, sans donner d’avantage dans les défis ni inventer de récompense.
- CI : les 30 parcours de publication de la version précédente sont verts à distance. Les échecs natifs viennent de `sdkmanager` absent du PATH et du choix par défaut de Xcode 16.4. Appeler explicitement le SDK Android et sélectionner un Xcode stable installé de version 26 ou supérieure avant de compiler.

Validation locale de ce lot : 4 tests des préférences et raccourcis en mode store, puis 8 tests des personnages et pouvoirs (dont duel humain contre humain), sur Chromium PC/mobile. Le build web et la synchronisation Android/iOS partagent la source `2b1819b4a5f7`. Les quatre nouveaux tests font désormais partie de la CI mobile. La sélection des outils natifs doit encore être vérifiée sur les runners distants ; un YAML valide ne prouve pas une compilation iOS.

## Sixième lot — interruption équitable et commandes mobiles simples

Incident signalé : défi planté à l’entrée dans l’arène, puis victoire attribuée sans partie jouée. Le jeu et l’appareil exacts restent à identifier ; ne pas présenter le scénario simulé comme le journal de cet incident.

- Cause reproductible dans le protocole : une déconnexion avant le démarrage pouvait être transformée en `disconnect-forfeit` après 20 secondes. Elle annule désormais le défi et rembourse les deux mises, sans manche ni gagnant. La même règle protège les interruptions techniques après démarrage. Un abandon volontaire après démarrage conserve sa signification sportive ; sortir avant le premier démarrage annule sans point.
- Si le second joueur n’entre jamais, annuler après 90 secondes au lieu de laisser une mise immobilisée. Un tournoi touché est fermé avec remboursement des duels actifs ; aucune progression de tableau n’est inventée.
- Protéger l’app contre les erreurs React et les erreurs de dessin des scènes : écran de récupération, identifiants de session conservés, déconnexion du jeu interrompu. Le serveur annule si la reconnexion échoue. Ce n’est pas une preuve d’absence de tout plantage.
- Arènes Braquage/Poule Position : par défaut tactile, un stick de déplacement et de grandes touches d’action. Le stick de visée reste disponible comme option avancée. Le lancer assisté vise son dépôt ; le lancer manuel permet les passes et les tirs libres. Agrandir la scène et enlever les marges internes empilées de la coque mobile.
- Les gestes et règles restent communs à l’entraînement, aux défis, aux tournois et aux apps natives. Ne pas ajouter de nouveau jeu avant validation de ces bases sur un vrai téléphone avec deux amis.

Critères de ce lot : plantage injecté à l’entrée d’un vrai défi avec mise → récupération visible et deux remboursements sans paiement de victoire ; un vrai geste tactile déplace le personnage ; la touche d’attaque envoie une action au serveur ; la scène et l’action principale restent accessibles à 320 × 650. Les jeux bonus ne sont pas annoncés comme entièrement refondus par ce lot.

- Bagarre de Table : supprimer sur tactile la contrainte de démarrer le geste dans un rayon de 85 unités autour du personnage. Toucher une destination puis relâcher déclenche désormais la propulsion vers elle. Le serveur conserve les mêmes limites de puissance et de recharge. Sur souris, le geste précis depuis le personnage reste inchangé. Un test tactile vérifie une propulsion initiée loin du personnage.

Validation du lot : 338 tests serveur, 20 tests unitaires web, puis 8 tests navigateur passent (2 cas PC non pertinents ignorés). Le test catalogue visite les 12 jeux à 320 × 650 ; il vérifie l’entrée, le rendu, l’absence de débordement horizontal et l’accès à la sortie, pas la profondeur du gameplay. Les tests de panne injectée vérifient réellement les soldes et l’absence de gagnant sur PC et mobile. Le test tactile actionne le déplacement et l’attaque de l’arène, puis une propulsion de Table démarrée loin du personnage. Captures : `captures/mobile-simple-snack-320-650.png` et `captures/mobile-touch-table-320-650.png`. Build web et bundle Android/iOS : source `0a793eab3706`.

- Rotation tactile en paysage : déplacement à gauche, terrain au centre, attaques à droite ; conserver une scène lisible plutôt que déduire toutes les commandes de sa hauteur. Les préférences avancées restent accessibles en portrait ; l’aide de la coque reste disponible en paysage.

- Salon entre amis sur téléphone : réutiliser la même coque plein écran que l’entraînement et les duels, avec une sortie « Quitter le salon ». Le jeu ne reste plus coincé sous le menu du salon et la navigation. La barre du poulet reste visible en paysage.

Validation du complément : les six parcours mobiles ciblés passent, dont la panne avec remboursement et la soirée à quatre avec reconnexion/sortie. Le contrôle paysage a été relancé après ajustement de caméra et vérifie une scène d’au moins 300 × 190 px, le déplacement à gauche du terrain et l’attaque à droite. Capture : `captures/mobile-simple-snack-landscape.png`. Source commune web/Android/iOS : `c51fa541e081`. La CI du correctif principal (`65f4fbb`) est entièrement verte, compilations natives comprises ; le complément a sa propre validation de publication.

## Poule Position — une action contextuelle (30 octobre 2026)

Décision : priorité à la compréhension immédiate sur téléphone. Un déplacement et
un seul bouton BAFFE / LANCE. Ramassage automatique, visée de frappe vers le rival
et lancer vers son propre poulailler calculés côté serveur. Une baffe fait lâcher
la poule sans attendre un KO. Un lancer arrivant au poulailler marque réellement.
Trois livraisons gagnent ; au chrono seules les livraisons départagent, puis revanche
commune en cas d'égalité. Les KO n'ajoutent pas de points dans ce jeu.

Pas de pouvoir, super, esquive, choix de combattant ou munitions dans ce jeu ; le
bot obéit aux mêmes restrictions. Arène entièrement visible, pas de caméra à gérer
ni de minimap. Le conseil visible évolue entre ramassage, interception et retour.
Le rebondissement des œufs et la fuite de la poule restent des obstacles visibles.
Les bonus supplémentaires attendent une validation de ce cœur de jeu simplifié.

Le serveur commun applique ces règles en entraînement, défi, challenge et tournoi.
Braquage du Goûter conserve son gameplay actuel ; ce travail n'est pas une refonte
terminée de l'ensemble du catalogue. Ne pas confondre tests de fonctionnement et
validation du plaisir par de vrais joueurs sur leurs téléphones.

Validation : 341 tests serveur passent avant les deux derniers cas ajoutés ; les
17 tests Poule Position et les 5 scénarios de remboursement passent ensuite.
Les 21 tests unitaires web passent. Quatre E2E mobiles passent : entraînement avec
déplacement tactile, duel à deux avec lancer contextuel/résultat/replay, portrait
320 × 650 et paysage 800 × 390. L'entrée et les commandes clavier sur ordinateur
passent aussi. `build:all` synchronise la source `88a2a4bc2d02` dans Android/iOS.
Les essais WebKit et la compilation iOS doivent être confirmés par la CI du push.

Contrôle visuel complémentaire : correction du maximum de largeur hérité en paysage. Les deux E2E de dimensions repassent avec un terrain de 280 × 180 px au minimum et des commandes dans la fenêtre. Source finale synchronisée : `398e8aa77988`.
