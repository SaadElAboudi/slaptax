# Validation — collection de défis entre amis

28 octobre 2026. Évolution locale, sans push Git, déploiement ou publication sur les stores.

## Résultats

- **248 tests serveur réussis** sous Node 22, zéro échec ou annulation. Suite complète exécutée avec concurrence 2 en 34,1 secondes.
- **40 scénarios navigateur réussis** sur Chromium ordinateur et mobile en 5,1 minutes : démarrage et commandes des onze jeux, collection FR/EN, fiches des jeux, entraînement, sélection d’un jeu pour les invitations, tournoi avec préférence bloquée, challenges persistés et compatibilité des anciens liens CHROMA.
- Après le recentrage et la nouvelle grille mobile des fiches, **8 scénarios ciblés réussis** sur ordinateur et mobile en 47,3 secondes. La dernière correction de taille des illustrations mobiles a ensuite été contrôlée visuellement, sans changement des règles ni des parcours.
- Compilation TypeScript et Vite réussie ; les fiches de jeux sont chargées séparément.
- `git diff --check` sans erreur.

Le nouveau test serveur de Tour de Trop vérifie un placement et une sécurisation réels, l’ignorance d’un score client forgé, le résultat conservé après reprise du service, le score adverse masqué avant la fin, les anciennes commandes refusées et les portefeuilles inchangés.

Le test navigateur crée un challenge, joue et sécurise un bloc, affiche le vrai résultat puis recharge la page pour retrouver ce résultat. Le test de tournoi crée une vraie coupe locale et vérifie que le jeu choisi est sélectionné, même lorsque l’enregistrement de la préférence est bloqué.

## Vérifications visuelles et de rendu

- [Accueil de la collection](vision-home-desktop.png)
- [Fiche cartoon sur ordinateur](vision-guide-desktop.png)
- [Fiche mobile avec les quatre modes](vision-guide-mobile.png)
- [Jeu de tartes sur mobile](vision-pie-mobile.png)
- [Challenge de tour terminé](vision-tower-score-mobile.png)
- [Contrôle de mise en page](vision-guide-layout.json)
- [Contrôle du cache de décors](vision-manual.json)

L’aperçu local ne remonte aucun événement `pageerror` lors du contrôle manuel. Sur 320×740, la fiche est centrée, sans débordement horizontal ; ses quatre choix et son bouton de fermeture sont dans l’écran.

Le contrôle du décor de rue observe 25 appels de tracé `roundRect` à sa première préparation et zéro au dessin suivant, avec un seul `drawImage` au second passage. Cela vérifie la réutilisation du décor ; ce n’est pas une mesure d’images par seconde.

## Corrections issues de la validation

Le choix initial d’un jeu de tournoi était remplacé par la rotation par défaut après création : la rotation est désormais configurée avant de charger le salon. L’historique est accessible depuis les challenges, et le test d’ancien lien a été adapté à la navigation actuelle. Un sélecteur de test ambigu et une variable de capture absente ont été corrigés dans les nouveaux tests. La première suite a été arrêtée pour appliquer ces corrections ; la relance complète a réussi les 40 scénarios.

Le contrôle visuel a ensuite trouvé une fiche non centrée et un défilement trop important sur mobile. La fiche est maintenant centrée, avec quatre choix en grille et une illustration compacte entièrement contenue dans son cadre.

## Limites

La couche commune de navigation, les briefings et le rendu ont évolué ; les moteurs des onze jeux n’ont pas été réécrits. Ces contrôles ne prouvent ni une finition équivalente aux jeux de référence, ni la rétention ou la viralité. Il reste à mesurer la fluidité, le chargement, la lisibilité et le plaisir de revanche sur des téléphones physiques avec des groupes extérieurs.

Vite signale encore un bundle principal légèrement supérieur au seuil indicatif de 500 ko minifiés. Aucun benchmark de chargement mobile réel n’est revendiqué. Les challenges de score publics concernent Chef Couic et Tour de Trop ; les autres jeux proposent une invitation pour jouer en direct. Le 2v2 reste un salon privé du Goûter.

Voir [la vision produit et la couverture réelle des modes](../VISION_DEFIS_ENTRE_AMIS.md).
