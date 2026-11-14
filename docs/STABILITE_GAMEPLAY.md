# Stabilité du gameplay mobile

## Course et table : garder les commandes réactives

Sur les navigateurs compatibles, le rendu Three.js de la course et de la table utilise un Worker
et OffscreenCanvas. Les commandes, le maintien toutes les 100 ms et l’interface
restent sur le fil principal. La scène et les règles restent les mêmes.
Le Worker reçoit les états réels du serveur ; il ne calcule aucun score.
Il s’arrête en arrière-plan et se libère en quittant la manche.

Sans Worker/OffscreenCanvas, ou si le Worker échoue, une nouvelle surface reprend
le rendu 3D sur le fil principal. Si WebGL est réellement indisponible, la vue
légère existante explique la situation et propose de réessayer. Une baisse de
performance adapte la résolution et la cadence sans supprimer la scène 3D.
La visée de la table reste calculée immédiatement à partir d’une copie de la
caméra réelle. La projection est actualisée après un changement de taille ; une
visée en cours est annulée pendant cette transition. Le replay continue à recevoir
les états réels des dernières secondes de la manche.

## Biscuit : conserver le geste

Les segments sont interpolés avec un pas maximal de 0,01, puis envoyés dans
l’ordre, douze points toutes les 100 ms. Cela reste sous le budget serveur de
1,6 unité par seconde. La file ne supprime plus les premiers points d’un geste
rapide, ce qui préserve les angles du contour. Elle est bornée à 240 points ;
si elle est pleine, le jeu demande de ralentir et de reprendre au point blanc.

L’aiguille suit immédiatement le doigt ; le point blanc, la progression, les
fautes et le résultat restent validés par le serveur. Le jeu signale que le
tracé se valide lorsque des points restent en attente après avoir levé le doigt.

## Table : une intention claire

La visée apparaît dès l’appui et utilise la projection capturée au début du geste.
Une perte de focus, un changement de taille, le passage en arrière-plan ou un
changement de rendu annulent le geste. Relâcher ensuite ne propulse pas le joueur.
Un appui pendant la recharge ne prépare plus une propulsion différée.

## Vérification

Les tests de stabilité utilisent le vrai moteur et les commandes réelles :
contour rapide terminé au score parfait, absence de propulsion après perte de
focus, course 3D dans un Worker terminée au score parfait et repli vers la 3D
classique quand le Worker est bloqué. La compétition complète à quatre est
contrôlée avec un client WebGL et trois clients légers, jusqu’à la revanche.
Ces tests navigateur ne remplacent pas un playtest sur des téléphones physiques.

Bilan navigateur : 25 scénarios mobiles réussis, sans forcer la compétition en
mode léger. Tests web : 38 réussis. `npm run build:all` et
`npm run mobile:check` valident le même code partagé web/Android/iOS.

Les 345 tests serveur passent. APK debug et AAB release reconstruits ; tous les
fichiers du bundle mobile, y compris le Worker, sont contrôlés octet par octet
dans les deux archives. iOS est synchronisé mais non compilé : Xcode complet
n’est pas installé sur cette machine. Aucun de ces contrôles ne vaut publication
sur les stores.
