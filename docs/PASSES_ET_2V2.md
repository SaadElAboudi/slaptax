# Braquage du Goûter — passes et 2v2

Développement local des 27 et 28 octobre 2026. Cette tranche construit la mécanique signature et un vrai salon de quatre amis. Elle ne constitue pas une publication sur les stores.

## La partie

Deux équipes de deux humains, une boîte, trois livraisons pour gagner, 90 secondes maximum. À l’échéance, les livraisons de l’équipe puis ses KO départagent ; une égalité reste une égalité. Le groupe confirme ensuite sa revanche. Les trois combattants précédents sont conservés, tous accessibles immédiatement.

Le bouton principal et le relâchement du stick droit produisent une baffe à mains vides et un lancer quand on porte. La direction vient de la visée réelle ; aucun coéquipier n’est téléporté vers la boîte. Une trajectoire pointillée aide le porteur à anticiper le premier segment et les rebonds proches. Viser manuellement reste prioritaire sur l’assistance ; en 2v2, celle-ci propose un coéquipier proche au porteur, un rival proche à mains vides.

La boîte vole à 720 unités par seconde, pendant au plus 1,05 seconde. Les bancs et les limites du terrain la font rebondir avec perte de vitesse ; elle s’arrête au troisième rebond ou à la fin du vol. La collision avance en petits pas pour éviter de traverser un banc. Le lanceur ne peut pas la reprendre avant 450 ms ; les autres peuvent l’attraper après 80 ms. Une boîte volante peut être interceptée ; elle ne blesse personne et ne marque pas seule en traversant un dépôt. Il faut la réceptionner et la porter dans le dépôt.

Les coéquipiers ne se blessent pas et ne se ralentissent pas avec la saumure. Les collisions physiques entre corps restent actives : on peut gêner un partenaire, ce qui demande de se démarquer. Le score de livraison est partagé ; les deux joueurs utilisent le même dépôt. Un rival aussi proche de la boîte peut la contester, y compris si deux coéquipiers sont également proches.

## Jouer à quatre

1. Ouvrir l’accueil, puis « Jouer entre amis · 2v2 ».
2. Créer un salon, transmettre son code ou son lien.
3. Chaque ami rejoint avec sa propre identité. Les arrivées 1 et 3 forment une équipe, les arrivées 2 et 4 l’autre.
4. Choisir les combattants. Le créateur démarre quand les quatre sont connectés.
5. Jouer, consulter le résultat, puis confirmer la revanche chacun à son tour. Le groupe et les personnages restent en place.

Aucun bot ne complète ce salon. Pour découvrir les contrôles seul, « Découvrir l’arène en solo » conserve l’entraînement contre un bot explicitement annoncé. Le duel humain existant reste accessible.

Le lien d’invitation pointe vers `?tab=team&room=CODE`. Le partage natif est utilisé quand disponible ; sinon le lien est copié. Le champ du lien permet aussi une copie manuelle.

## Résultats et revanche

Le résultat présente les livraisons, KO, passes réussies, interceptions et passes décisives de chacun. Une passe est comptée quand un autre joueur de la même équipe attrape la boîte en vol ; une interception implique une réception adverse en vol. Une passe décisive revient au dernier passeur si le receveur livre dans les cinq secondes, sans nouvelle passe ni perte de boîte. Ce sont des événements du serveur, pas des distinctions inventées au résultat.

Les quatre confirmations sont nécessaires pour relancer. Une confirmation répétée ne compte pas deux fois. Les anciennes commandes d’une autre manche sont refusées. Les salons ne modifient ni portefeuille, ni classement, ni progression : pas de mise ni de récompense artificielle associée à des parties privées.

## Déconnexions et limites

Une déconnexion suspend la partie jusqu’à 20 secondes. Si l’ami revient, un nouveau décompte reprend le même terrain et les mêmes scores ; les échéances du jeu sont décalées de la pause complète, y compris les décomptes de reprise interrompus. Après expiration, le match est interrompu sans déclarer de vainqueur.

Quitter explicitement rend les joueurs restants au salon et libère la place. Un hôte qui rafraîchit son navigateur garde temporairement sa place ; après un départ explicite, le premier joueur restant devient créateur. Les places hors ligne d’un salon d’attente sont libérées après 20 secondes. Les salons inactifs expirent après 15 minutes.

Les salons et les matchs résident en mémoire dans un seul processus serveur. Un redémarrage les efface ; il n’y a pas de coordination entre plusieurs instances, de matchmaking public 2v2, de choix manuel d’équipe, de mode spectateur d’équipe ni de migration d’un match vers un autre serveur. Les quatre amis sont requis pour commencer. Le dispositif doit donc être testé avec un groupe avant toute campagne d’acquisition.

Voir [la validation technique](qa/team-validation.md) et [le protocole de playtest](PLAYTEST_GOÛTER.md).
