# Validation — simplification du 5 novembre 2026

## Périmètre

Catalogue actif de six jeux, accueil, navigation, résultat solo, briefing mobile et chargement différé des écrans. Le checkout contenait déjà les évolutions de l’audit du 3 novembre : elles sont conservées et incluses dans les builds testés.

## Résultats établis

- `npm test` : 323 tests serveur réussis, zéro échec. Catalogue partagé, rotations, veto historique, migration du trio quotidien, reçus et plafonds de récompense couverts.
- `npm --prefix web run test:build-tools` : 6 tests réussis.
- `npm run build:all` avec Node 24.11.0 : build web, bundle mobile et synchronisation Android/iOS réussis.
- Fichier JavaScript principal web : 274,60 Ko, environ 91,5 Ko gzip. Aucun avertissement de chunk supérieur à 500 Ko sur ce build. Les modules des grands écrans sont chargés à la demande.
- Premier parcours mobile : accueil, lancement Chef Couic, défi depuis une carte, code salon invalide, scènes des six jeux à 320 × 650, trois couleurs jouées avec commandes visibles à 320 × 650 et 390 × 844. Les captures de l’accueil et de Chef Couic ont été inspectées.
- Android : `:app:assembleDebug` et `:app:bundleRelease` réussis avec le JDK/SDK isolés du Mac. Après resynchronisation finale, les deux binaires ont été recompilés. Les 54 fichiers web embarqués dans chacun ont été comparés octet par octet au bundle courant ; les empreintes source et bundle correspondent, source `48a3d387282e`.

- Contrôle navigateur supplémentaire à 1280 × 900 et 390 × 844 : six cartes, premier bouton visible sans défilement, ouverture de Chef Couic et absence de débordement horizontal. Captures conservées dans ce dossier.
- `git diff --check` : réussi.

## Parcours navigateur de référence

- La passe étendue a réussi 16 parcours, notamment CHROMA solo et duel/revanche, Chef Couic solo/lien/duel, progression de tour solo et défi partagé, table en duel, briefing et accueil. Elle a révélé le démarrage hors écran et des attentes obsolètes.
- Après correction et build final : 7 parcours réussis couvrant accueil, défi depuis une carte, code salon, les six scènes à 320 × 650 et le catalogue français/anglais.
- Le parcours table solo a été relancé séparément avec les attentes de revanche et récompense actualisées : 1 test réussi.
- Les trois contrôles qui échouaient ont ainsi une relance réussie. Les passes interrompues ou avec échecs ne sont pas présentées comme entièrement vertes.

## Limites

Tests navigateur sous Chromium avec émulation tactile ; aucun téléphone physique, Safari iOS ou playtest humain. Pas de mesure de FPS ou de temps de démarrage sur appareil : la réduction du poids du fichier principal ne démontre pas à elle seule une fréquence d’images stable.

iOS : ressources synchronisées, aucun binaire compilé ; `xcode-select -p` pointe sur CommandLineTools, sans Xcode complet. APK Android de développement ; aucune signature de distribution n’est revendiquée pour l’AAB. Aucun déploiement backend, envoi externe, publication de vidéo ou publication store.

Les essais ont révélé un défaut réel du briefing à 320 × 650 : le bouton de démarrage était hors écran. Le sélecteur de jeu a été déplacé après le briefing, l’en-tête solo répétitif retiré et l’illustration masquée sur écran court. La relance vérifie que les six boutons de démarrage sont dans le viewport avant tout défilement, puis entre dans les six scènes. Des attentes obsolètes de poster, de libellé de revanche et de récompense ont aussi été mises à jour ; les relances finales servent de référence.

## Incident de validation résolu

Le disque local a saturé pendant une passe E2E et la copie Capacitor (`ENOSPC`). Cette passe interrompue ne compte pas comme validation réussie. Les rapports et caches générés de test ont été nettoyés, puis `cap sync` et `mobile:check` ont réussi avant la recompilation Android et la comparaison des fichiers embarqués. Aucun fichier métier ni donnée réelle n’a été supprimé.
