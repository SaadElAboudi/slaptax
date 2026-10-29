# SlapTax : développement commun web, Android et iOS

Les jeux, scènes, règles, menus et ressources ont une seule implémentation dans
`web/src`, `web/public` et `shared`. Ne pas maintenir de copies de gameplay dans
les projets natifs. Les adaptations de plateforme vont dans `web/src/platform`.

Pour chaque modification ou ajout de jeu :

1. Mettre à jour les règles et le catalogue partagés ainsi que les modes concernés
   (entraînement, défis, challenges, tournois). Tester le comportement concerné.
2. Exécuter `npm run build:all` à la racine avec Node 22+, après installation des
   dépendances web et configuration de `web/.env.mobile.local`.
   Cette commande construit le site et synchronise le même code dans Android/iOS.
3. Exécuter les tests pertinents. Ne pas annoncer un binaire mobile mis à jour
   sur la seule base de `cap sync` : reconstruire APK/AAB et iOS avec les outils
   disponibles ; signaler explicitement les plateformes non compilées.
4. Ne jamais éditer `web/dist`, `web/dist-mobile` ou les dossiers natifs `public`
   générés. Ne pas les commiter. `npm run mobile:check` détecte leur obsolescence.
5. Un changement serveur nécessite aussi le déploiement du backend compatible.
   Ne pas présenter une synchronisation locale comme une publication store.

Le site est produit dans `web/dist`, le bundle embarqué dans `web/dist-mobile`.
Les signatures, comptes et soumissions aux stores restent des étapes distinctes.
Voir `mobile/README.md`.
