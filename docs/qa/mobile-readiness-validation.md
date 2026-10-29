# Validation de la préparation mobile — 28 octobre 2026

Éditeur proposé : Gignoski Games. Support : gignoski@gmail.com. Ce nom ne constitue pas une société créée ni une marque vérifiée.

## Vérifications réalisées

- Serveur : **259 tests réussis sur 259**, Node 22, 40,4 secondes. Journal local : `/tmp/slaptax-mobile-api-verified.log`.
- Navigateur : **18 scénarios réussis sur 18**, desktop et mobile, backend en distribution store, 1 min 1 s. Suppression de profil, confidentialité, signalement/blocage, invitations, entraînement et compatibilité Canvas/identifiants anciens navigateurs. Journal : `/tmp/slaptax-mobile-browser-verified.log`.
- Compilation mobile et synchronisation Capacitor : réussies. Journal : `/tmp/slaptax-mobile-sync-verified.log`.
- Android : APK debug et bundle release générés, compilation Gradle réussie en 1 min 7 s. Journal : `/tmp/slaptax-android-build-verified.log`.
- APK : `com.gignoski.slaptax`, version 1.0.0 (1), Android minimum 24, cible 36.
- Bundle AAB : absence de fichiers de signature vérifiée dans son archive ; livraison **non signée**.
- Audit npm du frontend : zéro vulnérabilité signalée, `/tmp/slaptax-mobile-audit-final.json`.
- Plist iOS, manifeste de confidentialité et projet : syntaxe validée. Pas de compilation iOS sur cette machine.
- `git diff --check` : réussi.

## Artifacts locaux

Fichiers ignorés par Git dans `mobile/artifacts/` :

| Fichier | Taille | SHA-256 |
| --- | ---: | --- |
| slaptax-debug.apk | 5068752 octets | 0e904e6299907c626aaed7dea30d825260d98c4fd3d785bfd287ec1bbfd5e1d7 |
| slaptax-release-unsigned.aab | 3557107 octets | 697ff8600bb170abd76887ce43f1c1dcb832ef6ab603d6494b1060fbe587cd85 |

Chaque bundle embarque un mobile-build.json indiquant les origines de production et la provenance : revision db72e244f0042d9bb1840161b9ecaebfcda1cf41 avec dirty=true. Les changements locaux courants sont inclus ; ce SHA seul ne représente donc pas leur contenu complet.

## Limites et étapes avant publication

- Le backend public est encore l'ancienne version. Déployer le nouveau backend avec `APP_DISTRIBUTION=store`, persistance et configuration de production avant de tester les parties natives en ligne. Les anciens CORS ne suffisent pas aux nouveaux en-têtes de session.
- Aucun compte Apple Developer ou Google Play Console créé. Aucun achat, envoi aux stores, push Git ou déploiement effectué.
- APK de développement ; AAB non signé. Signature de distribution et stockage sûr des clés restent à effectuer.
- Projet iOS préparé, mais **non compilé** : macOS 12.7.6 et Command Line Tools seulement sur ce poste. Xcode 26 requis sur un Mac compatible.
- Aucun test sur appareil physique effectué. Workflow CI préparé, non exécuté. La compilation simulateur prévue en CI ne remplace pas une archive signée pour l'App Store.
- Vérifier sur téléphones réels les performances, invitations, reprise après arrière-plan, réseau, audio et suppression de compte.
- La vérification de publication bloque volontairement un checkout non commité, l'absence de Xcode et un serveur ne correspondant pas au mode store et à la révision attendus. Un HTTP 200 sur une URL juridique ne prouve pas que son nouveau contenu a été publié.
- Prévoir la modération opérationnelle des signalements, valider les déclarations de confidentialité et les informations légales avant soumission.
- Avertissement Vite persistant : bundle principal supérieur à 500 ko ; optimisation des performances à poursuivre sur appareils réels.

Voir [le guide mobile](../../mobile/README.md) pour les commandes, signatures et étapes de publication.
