# La compétition des potes

Quatre vrais joueurs, chacun sur son téléphone, dans un salon privé sans mise.
Accès : accueil → Jouer à quatre, ou `?tab=survival&room=CODE`.
Le créateur lance après quatre confirmations explicites. Aucun bot ne remplit les places.

Le parcours est défini dans `shared/survival-games.json` :

1. **Avance… STOP !** — 28 secondes. Maintenir fait avancer, relâcher immobilise.
   Le signal jaune LÂCHE précède STOP de 550 ms, avec 180 ms de tolérance réseau.
   Une faute retire 12 % de progression ; trois fautes éliminent. Il faut franchir
   la ligne pour se qualifier. Les trois premiers passent ; les arrivées séparées
   d'au plus 100 ms au seuil de qualification passent ensemble.
2. **La forme fragile** — 30 secondes. Suivre le triangle depuis le point blanc
   dans le sens des flèches. Lever le doigt est permis ; reprendre au point blanc
   qui suit la progression validée. Trois sorties de contour cassent la forme.
   Les deux premiers contours terminés passent ; même tolérance de 100 ms.
3. **Dernier sur la table** — moteur Table commun. Les survivants sont tous humains.
   Le dernier debout gagne ; à vingt secondes, le survivant le plus proche du centre
   gagne. Une égalité fait rejouer la finale, sans tirage au sort.

Une épreuve sans aucun qualifié termine la compétition sans vainqueur. Un unique
qualifié remporte la compétition immédiatement. Les ex æquo peuvent donc conserver
plus de joueurs que le nombre nominal de places dans la manche suivante.

## Groupe et réseau

Les éliminés voient les épreuves suivantes, sans envoyer de commandes ni bloquer
le départ de la manche suivante. Les qualifiés confirment leur disponibilité.
Après la compétition, les quatre joueurs confirment une revanche dans le même salon.
Le verdict peut être partagé avec un lien vers l'application.

La perte de connexion d'un joueur encore en lice suspend l'épreuve pour vingt
secondes maximum. La reconnexion relance un décompte et décale les chronomètres ;
les commandes maintenues sont annulées. Une coupure expirée interrompt la compétition
sans décerner de victoire. La déconnexion d'un spectateur ne suspend pas l'épreuve.
Un départ volontaire ramène le groupe au salon et efface le parcours en cours.

Les salons restent en mémoire serveur et expirent après quinze minutes sans
activité. Un redémarrage du serveur les ferme : l'interface signale le salon
introuvable et permet d'en créer un autre. Il n'y a pas de promesse de persistance.

## Implémentation commune

- `api/games/survivalGames.js` : temps serveur, progression, fautes, validation de
  tracés ordonnés, limite de déplacement par seconde et expiration des commandes.
- `api/games/survivalRooms.js` : salon, qualifications, spectateurs, reprise, revanche.
- `web/src/components/Survival` : mêmes scènes pour entraînement et compétition.
- Les deux nouvelles épreuves sont disponibles dans l'entraînement. Le catalogue
  des six jeux de duels et de défis par score est conservé : ces épreuves de
  qualification n'y sont pas proposées comme des défis asynchrones non pris en charge.
- Web, Android et iOS utilisent les mêmes scènes et règles.

## Validation

`api/tests/survival.test.js` couvre commandes invalides, temps serveur, tolérance
humaine, tracé réalisable, raccourcis, qualifications et égalités, spectateurs,
déconnexions, multionglets, finale sans bots et revanche commune.

`web/e2e/survival.spec.ts` fait jouer quatre sessions sur des vues mobiles de
320 × 650, par les commandes de l'interface, jusqu'à la finale et la revanche.
Il vérifie également un vrai tracé d'entraînement. Aucun endpoint de test n'accélère
les chronomètres ni ne force les résultats du navigateur.
