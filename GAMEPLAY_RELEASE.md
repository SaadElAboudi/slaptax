# Gameplay v2

## Format

Cinq jeux, disponibles en entrainement, duel humain et tournoi humain. Les
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

- Les cinq jeux humains utilisent `arena.join`, `arena.state` et `arena.action`.
- Une reponse de course contient `stage` et `value`. Le serveur rejette les
  doublons, etapes obsoletes, options inexistantes et reponses hors delai.
- `POST /api/duels/:id/rounds` refuse les scores clients pour les cinq jeux.
- Une deconnexion suspend la manche pendant le delai existant de 20 secondes.
  La reprise conserve la question, les reponses, la sequence et le temps restant.
- Les messages WebSocket sont limites a 4 Ko et 90 messages par seconde par
  connexion ; un client lent ne cumule pas une file illimitee d'etats sortants.
- Les animations de timing solo utilisent une horloge monotone. Les callbacks
  de fin et animations sont nettoyes au demontage.
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

## Conditions avant ouverture massive

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

Les limites par connexion ne remplacent pas une limitation globale par identite/IP.
Les tests de navigateur ne constituent ni un audit anti-bot, ni un test de charge,
ni une validation sur Safari/iOS. Aucun deploiement public n'est effectue ici.
