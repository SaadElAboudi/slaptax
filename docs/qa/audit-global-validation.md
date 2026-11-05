# Validation de l’audit global

Périmètre : catalogue commun, retour CHROMA, accueil, boucle solo, trio quotidien et contrôles tactiles.

- `npm test` : 322 tests serveur réussis. Les trois tests de sélection/migration ont également été relancés après renforcement du contrôle des anciennes parties Chicken.
- `npm --prefix web run test:build-tools` : 6 tests réussis.
- `npm run build:all` avec Node 24.11.0 : build web, bundle mobile et synchronisation Capacitor Android/iOS réussis. Le build conserve un avertissement de paquet JS supérieur à 500 Ko.
- `npm run mobile:check` : sources communes, bundle et copies natives cohérents, empreinte source `47253eeebab7`.
- Android : `:app:assembleDebug` et `:app:bundleRelease` réussis avec le JDK et SDK isolés de ce Mac. Le manifeste embarqué de l’APK et de l’AAB a été ouvert et ses empreintes source/bundle comparées au bundle courant : correspondance exacte. APK de développement et AAB sans signature de distribution configurée ; aucune publication store.
- iOS : ressources synchronisées, aucun binaire compilé. `xcode-select -p` pointe sur `/Library/Developer/CommandLineTools`, pas sur une installation Xcode.
- Parcours mobiles : le catalogue complet à 320 × 650, l’accueil, le défi CHROMA asynchrone (hôte absent, reprise, score masqué et revanche), et le duel CHROMA entre deux joueurs ont réussi.
- Douze contrôles de scène à 320 × 740 réussis : rendu, commandes visibles dans la hauteur, aide et sortie, absence de débordement horizontal, suspension/reprise du dessin canvas pour les jeux concernés.

Un ancien test de portefeuille attendait encore 25 jetons après un solo alors que le bonus configuré est de 2. Son attente est désormais calculée à partir de `shared/token-economy.json`. Les premiers essais détaillés ont aussi rencontré des expirations de délai ; ils ne servent pas de preuve de réussite. La relance finale réussit les 8 parcours : solo CHROMA et récompense configurée, duel à deux et revanche, navigation Manufacture, épisode replié, accueil, code salon, puis trois essais tactiles complets et objectif de revanche à 320 × 650 et 390 × 844. Les quatre commandes CHROMA ont des cibles d’au moins 44 px et restent dans la hauteur disponible.

La validation navigateur utilise Chromium mobile émulé. Aucun playtest humain, test sur téléphone physique, test Safari iOS, déploiement backend ou publication publique n’est revendiqué.

Captures conservées : [accueil mobile](audit-home-refined.png), [CHROMA 320 px](audit-color-reveal-320.png), [CHROMA 390 px](audit-color-reveal-390.png).
