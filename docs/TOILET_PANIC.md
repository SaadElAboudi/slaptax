# Panique aux Toilettes — gameplay

Ce nouveau moteur remplace **Palets Panique** dans les six jeux proposés. L'ancien moteur Ricochet et son ID restent disponibles pour lire les anciens historiques et duels explicites. Il ne s'agit pas d'un changement de nom appliqué au tir de palets.

## Action continue

- Une manche de 25 secondes, sans phase de réglage de tir ni attente entre les actions.
- Maintenir et glisser sur le terrain dirige une toilette à roulettes vers le doigt ; les flèches fonctionnent au clavier. Le sol glisse et les contacts rebondissent.
- Ramasser des canards augmente le butin. Le plus gros butin final gagne.
- Le **prout turbo**, disponible toutes les 2,8 secondes, propulse dans la direction choisie. Un choc rapide pendant le turbo vole un canard au rival, avec protection contre les vols répétés sur un même contact. Si les deux joueurs sont en turbo, ils rebondissent sans vol : aucun avantage au premier emplacement de joueur.
- Les deux ventouses renvoient les personnages. Une chasse géante revient toutes les six secondes : annonce pendant une seconde, aspiration pendant une seconde et demie. Entrer dans le trou fait perdre jusqu'à trois canards, puis replace le personnage sur le terrain après un bref étourdissement. Aucun joueur n'attend éliminé.
- Pendant les sept dernières secondes, les canards dorés valent trois. Le retournement reste lié aux canards réellement ramassés, pas à un bonus final aléatoire.
- Solo contre trois bots identifiés ; duel à deux humains. Une égalité en duel nécessite le consentement des deux pour rejouer.

## Fiabilité

La physique, les positions, les collisions, les ramassages, les vols et le score sont calculés côté serveur à 60 pas fixes par seconde. Le navigateur transmet uniquement une direction bornée ou une demande de turbo. Les commandes expirent si le contrôle est interrompu ; les pauses décalent les horloges sans faire avancer la simulation.

Le score solo normalisé vaut `min(1000, butin × 80)`. Les XP et les badges passent par le mécanisme serveur existant. Le duel conserve le butin réel pour décider du gagnant ; les snapshots réels alimentent le récapitulatif et l'export de scène.

Les commandes tactiles et clavier, les déplacements, ramassages, turbos et scènes finales sont vérifiés dans les parcours navigateur. Les mouvements secondaires respectent la préférence système de réduction des animations.

## Tour de Trop : récompense de maîtrise

Trois placements parfaits consécutifs donnent une **bouée**. Le prochain raté consomme cette protection et conserve la tour : le joueur peut continuer ou sécuriser. Il n'y a qu'une bouée consommable par manche ; après utilisation, un autre raté fait perdre la tour. La bouée ne donne ni bloc ni point fictif. Le compteur et la protection sont calculés côté serveur et affichés en jeu.

## Limite produit

Ces mécaniques sont jouables, pas une preuve de rétention ou de viralité. Le test humain décisif reste : comprendre le contrôle rapidement, rire d'un retournement, puis choisir volontairement de rejouer. Aucun achat ni service sonore payant n'est ajouté.
