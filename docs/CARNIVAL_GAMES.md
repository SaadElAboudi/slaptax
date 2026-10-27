# Deux nouvelles épreuves : tartes et ballons

Deux nouvelles mécaniques, utilisables dans les menus solo, duel ami et tournoi. Durée : 22 secondes. Un seul bot annoncé en solo ; uniquement les deux humains en duel. Le serveur décide des impacts, des explosions et du score. En cas d'égalité entre humains, chacun doit accepter de rejouer.

## Tarte ta Face / Pie in Your Face (`pie`)

Le rival se déplace latéralement. On touche la scène pour viser et lancer directement, ou on règle le curseur puis on utilise le bouton ; la tarte vole pendant 350 ms et la position réelle à son arrivée décide du résultat. L'adversaire peut esquiver pendant 450 ms, une fois toutes les 2,2 secondes. Une tarte toutes les 950 ms évite le spam. Touche : 100 points ; plein centre : 200. Les touches consécutives ajoutent 25, puis 50, puis 75 points de bonus. Un raté ou une esquive casse la série. Une esquive ne compte que si la tarte allait réellement toucher : elle arme une grosse tarte pour le lancer suivant, avec une tolérance de visée de 17 % au lieu de 12 % et +100 points en cas de touche. Le bonus est consommé au lancer, même si on rate. Les pouvoirs ne se cumulent pas. Le bot solo a une marge d’erreur de visée qui le fait aussi rater des tirs ; il ne touche pas systématiquement. La chantilly, le gonflement des joues et les réactions correspondent aux vraies actions.

## Gonfle ou Pète / Pump or Pop (`balloon`)

Maintenir le bouton gonfle à 18 % par seconde, relâcher encaisse `arrondi(volume² / 20)`. Le seuil secret est tiré pour chaque nouveau ballon entre 78 et 108 %. L'avertissement commence à 70 %. Une explosion perd uniquement le ballon courant ; les points encaissés restent acquis. Encaisser un ballon à 70 % ou plus donne un casque passoire qui bloque un sabotage. Il ne se cumule pas ; le sabotage bloqué coûte quand même 25 points à son auteur et utilise sa recharge. Le maintien envoie un signal périodique borné ; une entrée interrompue s'arrête après 500 ms. Perte de focus / fin de geste : arrêt du maintien. Même un relâchement sous 10 % arrête immédiatement le gonflage, sans attribuer de points. Les commandes de maintien et d’encaissement portent le numéro du ballon : une commande retardée après explosion, encaissement ou reprise ne peut pas agir sur le ballon suivant. Garder le doigt posé après une explosion ne relance pas le gonflage ; il faut un nouveau geste.

On peut dépenser 25 points encaissés pour ajouter 12 % au ballon adverse, une fois toutes les quatre secondes. Il faut que ce ballon soit déjà à 10 %. Cette attaque peut le faire exploser ; elle ne vole pas de points déjà gagnés. Pas de commande de score ou de seuil acceptée du client.

## Défis et progression

Les invitations de duel et les revanches existantes fonctionnent avec les nouveaux IDs. Les scènes finales et les replays exportables utilisent les vrais instantanés serveur. Les ratings solo sont plafonnés à 1 000 (score tarte / 4 ; ballon / 2), les scores de duel ne sont pas plafonnés. Un joueur inactif ne marque aucun point ni récompense de progression. Les deux jeux participent aux trios du jour sans modifier les récompenses déjà encaissées.

La conception vise les renversements de situation et les gags provoqués par les joueurs. L'humour, l'équilibrage et l'envie de revenir restent à valider avec de vrais groupes d'amis ; aucun résultat de rétention ou de viralité n'est revendiqué.

## Reprise et rendu

Le client attend un état de partie valide avant d’activer les commandes. Après trois secondes sans état frais, il désactive les contrôles ; après huit secondes de silence en cours de partie, il ferme le canal pour reconnecter la même partie. Les réponses des anciens canaux sont ignorées. Les scores encaissés restent conservés par la session serveur lors d’une coupure temporaire, dans la fenêtre de reprise existante de vingt secondes.

Les instantanés des nouvelles épreuves suivent l’horloge simulée : leurs visuels restent figés pendant une pause. Le client lisse au maximum 100 ms de mouvement des personnages et des tartes ; il ne prédit ni points, ni explosion, ni pouvoirs. Le lissage et les effets de déformation respectent la préférence de réduction des mouvements.

L’arrêt du serveur ferme d’abord les WebSockets, attend leur nettoyage et termine après une seconde les clients qui ne répondent pas. Cela évite qu’un ancien processus reste attaché aux navigateurs après un redémarrage. La reprise décrite plus haut concerne une coupure réseau temporaire d’une session encore en mémoire, pas la restauration d’une partie après redémarrage complet du processus.
