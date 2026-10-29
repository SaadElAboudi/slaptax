# SlapTax sur iOS et Android

Studio proposé : **Gignoski Games**. Support : **gignoski@gmail.com**.
Bundle/application ID proposé : `com.gignoski.slaptax`. Vérifier sa disponibilité avant la première création dans les consoles. Aucun compte, achat, dépôt de marque ou publication n’est effectué par le code de ce dossier.

## Ce qui est préparé

- Capacitor 8, applications embarquant les scènes et assets localement ; serveur distant réservé aux API et au temps réel.
- Projets Xcode/Swift Package Manager dans `web/ios` et Gradle dans `web/android`. iOS minimum 15.4 (avec compatibilité Canvas pour les anciennes versions) ; Android minimum API 24 et WebView 107+, cible/compilation API 36.
- Partage et presse-papiers natifs, vibrations facultatives, gestion du retour Android, mise en veille audio/rendu, reconnexion de l’état au retour au premier plan.
- Liens publics HTTPS. Ouverture dans l’application installée via `slaptax://play/…` et un bouton explicite sur la page web. Pas d’Universal Links/App Links annoncés comme configurés : les associations de domaine attendent Team ID Apple et empreinte de signature Android.
- Suppression de profil serveur et locale, révocation des sessions, anonymisation des historiques conservés, annulation des compétitions concernées et remboursement des crédits fictifs engagés aux joueurs restants.
- Pages publiques `/privacy`, `/terms`, `/support`, `/delete-account` et confirmation `/account-deleted` sans recréation automatique d’un profil.
- Signalements persistants et blocage des prochains duels directs/matchmaking. Limites de la modération décrites plus bas.
- Icône originale et écrans de lancement ; source vectorielle dans `web/assets/icon.svg`. Fiches françaises/anglaises dans `mobile/store`.

## Jetons et reprises

Le solde ouvre un journal des jetons et les bonus gratuits. Les règles sont communes
aux trois clients : [économie et exploitation](../docs/ECONOMIE_JETONS.md). Le backend
compatible doit exposer `features.tokenLedger: true` et `tokenEconomyVersion: 1`.
En production, une base PostgreSQL et une seule instance applicative sont requises ;
un redémarrage rembourse les mises des arènes interrompues avant de rouvrir le service.

## Soirée entre amis

Le parcours « Créer une soirée à quatre » enchaîne Braquage du Goûter, Tarte ta Face
et Tour de Trop dans un même salon, avec classement et revanche. La playlist est
commune dans `shared/friend-night.json`. Le backend doit aussi être mis à jour ;
les salles en mémoire disparaissent au redémarrage. Voir
[le déroulement et les playtests](../docs/SOIREE_ENTRE_AMIS.md).

## Un seul développement pour le site et les apps

Les scènes, jeux, menus et règles sont communs : `web/src`, `web/public` et
`shared` (dont `shared/game-selection.json`). Aucun jeu natif dupliqué à maintenir.
Les différences de plateforme sont isolées dans `web/src/platform`.

Après chaque modification ou ajout de jeu, depuis la racine avec Node 22+ :

```sh
npm run build:all
```

Cette commande construit le site dans `web/dist`, puis le bundle embarqué dans
`web/dist-mobile`, synchronise **Android et iOS**, et vérifie leur contenu.
Les sorties séparées évitent qu'un build mobile remplace le site ou qu'un build
web écrase le bundle des apps. `npm run build` reste le build web de déploiement.

```sh
npm run mobile:check
```

Ce contrôle échoue si les sources ont changé depuis le build, si un fichier du
bundle a été altéré ou si l'un des projets natifs ne contient pas exactement le
bundle généré. L'empreinte couvre aussi les assets, le catalogue partagé, les
configurations et les dépendances frontend ; elle fonctionne même avant commit.
`mobile:ios` et `mobile:android` synchronisent avant d'ouvrir l'IDE.

Le workflow mobile s'exécute sur les PR concernées et les push sur `main` : tests
serveur, contrôles des bundles, scénarios navigateur desktop/mobile, puis
compilations Android et iOS simulateur. Il faudra pousser ces fichiers pour que
ce contrôle existe sur GitHub. La signature et la publication ne sont pas automatiques.

**Synchroniser les projets ne met pas à jour une app déjà installée.** Une
modification du gameplay embarqué nécessite de nouveaux binaires, un numéro de
build supérieur et une distribution via les stores ou la piste de test. Les
changements serveur nécessitent leur propre déploiement compatible. Les anciens
APK/AAB de `mobile/artifacts` ne sont pas régénérés par `build:all`.

Les consignes pour les prochaines interventions sont dans `AGENTS.md` à la racine.

## Installer et synchroniser

Node **22+** est nécessaire. Depuis la racine :

```sh
npm --prefix web ci
cp web/.env.mobile.example web/.env.mobile.local
npm --prefix web run mobile:sync
```

Si Volta/Node utilise encore Node 20 sur cette machine, exécuter la commande avec Node 22 :

```sh
cd web
npx --yes --package=node@22 --package=npm@10 npm run mobile:sync
```

Renseigner deux origines HTTPS publiques dans `.env.mobile.local` : `VITE_API_BASE_URL` et `VITE_PUBLIC_SITE_URL`. Le fichier d’exemple désigne le service Render existant ; cela ne prouve pas que ce service possède déjà cette version. `mobile:build` refuse une origine manquante, HTTP ou contenant des identifiants. Aucun secret ne doit être ajouté aux variables `VITE_*`, qui sont publiques dans le binaire.

`mobile:assets` régénère les images natives et les icônes des fiches. `mobile:doctor` vérifie les outils locaux. `mobile:release-check` ajoute les contrôles du checkout propre et du backend correspondant à la révision Git. Ces commandes diagnostiquent ; elles n’inscrivent pas de compte et ne publient rien.

## Android

Installer Android Studio/JDK 21 et Android SDK API 36. Une chaîne isolée a également été préparée sur ce Mac dans `~/Library/Caches/slaptax-native` ; son chemin n’est pas commité.

```sh
cd web/android
./gradlew :app:assembleDebug
./gradlew :app:bundleRelease
```

Sans paramètres de signature, le premier fichier est un APK de développement ; le second est un **AAB non signé**, qui ne doit pas être présenté comme directement publiable. Pour signer la release, fournir par variables d’environnement :

- `SLAPTAX_KEYSTORE_PATH` : chemin absolu de la clé d’upload conservée en lieu sûr ;
- `SLAPTAX_KEYSTORE_PASSWORD`, `SLAPTAX_KEY_ALIAS`, `SLAPTAX_KEY_PASSWORD` ;
- `SLAPTAX_VERSION_CODE` : entier à augmenter à chaque mise à jour, par défaut 1.

Le fichier signé sera dans `web/android/app/build/outputs/bundle/release/`. Ne commiter ni clé ni mot de passe. Activer et conserver correctement Play App Signing dans la console avant une diffusion publique.

## iOS

Xcode **26 minimum** avec le SDK iOS 26 ou ultérieur est requis pour une soumission. Ce Mac est sous **macOS 12.7.6** : il ne peut pas exécuter Xcode 26. Utiliser un Mac compatible ou le workflow de compilation sur un runner récent ; des Command Line Tools seuls ne suffisent pas.

```sh
npm --prefix web run mobile:ios
```

Dans Xcode : choisir l’équipe Apple Developer, vérifier `com.gignoski.slaptax`, utiliser une signature valide, tester sur iPhone/iPad et faire **Product → Archive → Distribute App → App Store Connect**. La version de départ est 1.0.0, build 1 ; augmenter le build pour les envois suivants. Aucun certificat ni Team ID inventé n’est inclus.

Le manifeste `PrivacyInfo.xcprivacy` décrit les identifiants et interactions du produit, sans suivi publicitaire. Les manifestes des SDK sont fournis par leurs packages. Vérifier le rapport de confidentialité du binaire Xcode et les déclarations App Store Connect avant l’envoi. Le paramètre d’export indique l’usage de TLS standard sans chiffrement non exempt ; revoir cette déclaration si des fonctions cryptographiques changent.

## Backend de distribution

Déployer **ce code** avec :

```text
APP_DISTRIBUTION=store
SLAPTAX_RELEASE=<SHA Git de la release>
ADMIN_TOKEN=<secret long et aléatoire conservé côté serveur>
```

Sur Render, `RENDER_GIT_COMMIT` peut fournir la révision si `SLAPTAX_RELEASE` n’est pas renseignée. Vérifier `/api/health` : `distribution: store`, `features.accountDeletion: true`, `release` correspondant au binaire.

Les clients joignent leur session via les en-têtes `X-SlapTax-User` et `X-SlapTax-Client`. Le mode store protège les accès, vérifie les acteurs des mutations et bloque les routes de démonstration globales. Les WebSockets exigent aussi la session du profil. Ne pas exposer les identifiants de session dans les invitations ou les journaux publics.

Utiliser un stockage persistant et une disponibilité adaptée aux parties en direct. L’état temps réel est encore géré dans un processus : ne pas lancer plusieurs réplicas sans architecture partagée. Les sauvegardes/journaux de l’hébergeur nécessitent une politique de conservation réelle et un traitement des suppressions. Compléter l’identité légale de l’exploitant et revoir cette politique avant lancement public.

## Modération et protection des joueurs

Les réglages permettent de signaler un joueur et de bloquer ses prochains duels directs et rencontres rapides. Un filtre simple rejette certains contenus manifestement injurieux dans la distribution store ; il n’est pas exhaustif. Le blocage n’annule pas une partie en cours. Les nouvelles entrées de salons 2v2 et de tournois refusent aussi une paire bloquée. Les résultats publics déjà partagés restent soumis à leur visibilité propre.

Les signalements sont accessibles à l’opérateur via **GET `/api/admin/player-reports`**, protégé par `Authorization: Bearer <ADMIN_TOKEN>`. La résolution se fait par **POST `/api/admin/player-reports/:id/resolve`**, avec `{ "action": "dismiss" }` ou `{ "action": "suspend" }` et le même en-tête administrateur. Une suspension coupe les sockets du profil et empêche ses prochaines connexions et rencontres ; la suppression de ses données reste accessible. Il n’y a ni e-mail automatiquement envoyé ni équipe de modération déjà en place : organiser la prise en charge effective des signalements avant lancement et revoir la règle Apple 1.2. Le support public est gignoski@gmail.com.

## Vérification automatisée

`.github/workflows/mobile.yml` prépare un APK debug/AAB unsigned sur Linux et une app de simulateur iOS non signée sur Mac. Le workflow se lance sur les PR concernées et les push sur main ; il peut aussi être lancé manuellement et ne téléverse rien vers les stores. Un workflow écrit n’est pas une exécution CI réussie : consulter les résultats avant de déclarer le binaire validé.

Les résultats effectivement observés sont consignés dans `docs/qa/mobile-readiness-validation.md`.

## Comptes et lancement

1. Vérifier la disponibilité du nom de studio et choisir le statut réel de l’éditeur. **Gignoski Games est un nom de studio proposé, pas une société créée.** Avec une inscription Apple individuelle, le vendeur affiché est le nom légal de la personne. Une organisation nécessite une entité juridique et les justificatifs Apple.
2. Créer et vérifier Apple Developer et Google Play Console soi-même ; aucune inscription payante n’est effectuée ici.
3. Préparer les signatures et les fiches avec `mobile/store`, les questionnaires de confidentialité/sécurité des données et les classifications d’âge. Ne pas sélectionner « aucune donnée collectée » : profils invités, identifiants de session, résultats, replays et interactions sont conservés côté serveur.
4. Tester les binaires sur de vrais appareils : touchers multiples, écran verrouillé, fond/premier plan, interruptions réseau, partage, liens, suppression, 2v2 et tournoi. Réaliser les captures natives finales demandées par les consoles.
5. Pour un nouveau compte Google personnel, prévoir le test fermé requis : au moins **12 testeurs inscrits continuellement pendant 14 jours**, puis demande d’accès production. Ce n’est pas remplacé par les tests automatisés du dépôt.
6. Soumettre après vérification de la disponibilité du backend, des politiques et de la modération. L’acceptation appartient aux stores ; aucune promesse d’acceptation ou de viralité n’est faite.

Sources officielles vérifiées le 28 octobre 2026 : [Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup), [SDK Apple](https://developer.apple.com/news/upcoming-requirements/), [Google API cible](https://support.google.com/googleplay/android-developer/answer/11926878), [inscription Apple](https://developer.apple.com/help/account/membership/program-enrollment), [tests Google](https://support.google.com/googleplay/android-developer/answer/14151465), [règles Apple](https://developer.apple.com/app-store/review/guidelines/).
