# Développement commun web / Android / iOS — 28 octobre 2026

## Changements

- Une source de gameplay commune : `web/src`, `web/public`, `shared`.
- `npm run build:all` construit le site et le bundle natif, synchronise les deux projets et contrôle leur contenu.
- Sorties indépendantes : `web/dist` pour le serveur web, `web/dist-mobile` pour Capacitor.
- Empreinte SHA-256 des sources/configurations/dépendances et du bundle ; contrôle des fichiers copiés dans Android et iOS, même avec des modifications non commitées.
- Ouverture des IDE précédée d'une synchronisation ; contrôle de publication renforcé.
- Workflow PR/main : tests serveur, contrôles des outils, build commun, scénarios navigateur, puis compilation Android et iOS simulateur. Préparé localement, pas encore exécuté sur GitHub.
- Instructions persistantes dans `AGENTS.md`, guide dans `mobile/README.md`.

## Vérifications

- Six tests des outils réussis : bundle conforme, modification de gameplay non commitée, ajout dans shared, altération du build, divergence Android, divergence iOS.
- Build complet web + mobile et synchronisation Android/iOS réussis. Contrôle d'égalité des bundles réussi. Journal : `/tmp/slaptax-unified-build.log`.
- Le site conserve son bundle web et n'embarque pas le manifeste du build natif.
- Syntaxe YAML du workflow validée et `git diff --check` vérifié.

## Limites

Une synchronisation ne met pas à jour les installations existantes. Reconstruire, signer et distribuer chaque nouvelle version via les pistes de test/stores. Les changements d'API nécessitent le déploiement du backend compatible. Xcode 26 n'est pas disponible sur ce Mac : aucun binaire iOS compilé ici. Aucun push, déploiement ou envoi aux stores dans cette intervention.

## Binaires Android reconstruits

Compilation Gradle réussie en 1 min 53 s (`/tmp/slaptax-unified-android.log`). APK debug et AAB non signé remplacés dans `mobile/artifacts`. Leur manifeste embarqué correspond exactement au nouveau bundle synchronisé. Les empreintes de la livraison précédente sont historiques ; les empreintes actuelles sont dans `mobile/artifacts/manifest.json`.

- slaptax-debug.apk : SHA-256 `24e2fd6011f84645807cca8abf86a14abaa0b54cc194d65d068f1109eb020f55`.
- slaptax-release-unsigned.aab : SHA-256 `abb6a02c71b221d91bf9965859039e487d6c1f6d7ea854a65276cab9011147ac`.

- Scénarios navigateur : **18/18 réussis** sur les sorties web séparées, desktop et mobile, backend en mode store (`/tmp/slaptax-unified-browser.log`).
