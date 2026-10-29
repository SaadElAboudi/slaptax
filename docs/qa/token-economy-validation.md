# Audit des points et jetons — 28 octobre 2026

## Corrections

Règles communes dans `shared/token-economy.json`, journal des débits/crédits, calculs entiers en centièmes, cotation conservée par duel, réserve de mise et règlement/remboursement idempotents. Bonus quotidien, entraînements récompensés plafonnés et coup de pouce limité. Suppression du plafond caché sur les gains et du crédit automatique répétable après défaite.

Maîtrise attribuée une fois par manche ; XP de match séparée ; séries et rang mis à jour au résultat du match. Les crédits ne sont plus comptés comme des défaites. Les invitations par lien passent par les mêmes contrôles de duel que les invitations directes.

Reprise : remboursement des arènes interrompues au redémarrage, fermeture des tournois et matches enfants devenus invalides, remboursement unique des anciennes entrées solo, annulation des rounds inactifs depuis vingt minutes. Les sessions sont attendues avant le démarrage ; les contrôles de jeu restent dans l'écran après une revanche ; les erreurs audio ne doivent pas bloquer une partie.

Production : mode store automatiquement activé avec NODE_ENV=production, base persistante exigée, verrou d'instance PostgreSQL, copies des lectures, file d'écritures récupérable et attente de sauvegarde avant accusé HTTP/résultat final d'arène. Requêtes JSON invalides ou trop volumineuses refusées sans mutation.

## Preuves disponibles

- **282/282 tests serveur réussis**, Node 22, environ 33 s. Journal : `/tmp/slaptax-token-api-verified.log`.
- Tests couvrant demandes concurrentes de bonus, quota UTC et retour d'horloge, secours excluant les mises en cours, conservation du pot moins taxe, double règlement/remboursement, fonds insuffisants, quotas solo, XP/maîtrise/rang, reprise et clôture des tournois, demandes invalides, échec de sauvegarde et nouvelle tentative.
- Adaptateur PostgreSQL testé avec un pool simulé : exclusion d'une seconde instance, reprise après échec d'écriture, lecture sans mutation implicite et perte du verrou avec refus des accès. Aucun serveur PostgreSQL réel contacté dans cette intervention.
- **Six tests des outils de build réussis** (`/tmp/slaptax-token-build-tools.log`).
- Build web + mobile, synchronisation Android/iOS et contrôle des bundles réussis (`/tmp/slaptax-token-build-final.log`). Empreinte des sources frontend : `0ce22cbdd077`.
- Audit en lecture seule de `data/mvp_db.json` : 23 profils, 2 899,50 jetons disponibles, aucune anomalie détectée. Les soldes n'ont pas été réinitialisés et le fichier n'a pas été réécrit par cet audit.
- Audit en lecture seule de la base locale de prévisualisation : aucune anomalie détectée. Aucun accès à la base publique distante.

## Limites de livraison

Le serveur public n'a pas été déployé, et les installations natives existantes doivent recevoir un nouveau binaire. iOS synchronisé mais non compilé sur ce Mac sans Xcode 26. Aucun test physique sur téléphone, essai de charge ou validation de restauration PostgreSQL réelle. La configuration d'hébergement gratuite existante ne démontre pas une disponibilité continue. Le détail des conditions de préproduction et des limites des comptes anonymes est dans `docs/ECONOMIE_JETONS.md`.

## Parcours navigateur final

**34/34 scénarios réussis**, environ 3 min (`/tmp/slaptax-token-browser-verified.log`), desktop et mobile en mode store : bonus et journal, conservation après recharge, erreur réseau et reprise explicite, cotation avant mise, entraînement et crédit réel de 2 jetons, panne audio simulée, fiches et modes, challenges, suppression de profil, modération, puis 2v2 avec passes, interceptions, reconnexion, livraison et revanche.

Les premières campagnes ont révélé un besoin de synchronisation de session au départ et un débordement des commandes après une revanche. Le départ attend maintenant la session, le son est facultatif même en cas d'erreur, et l'affichage de partie est compact. Le pilote des déplacements de test attend aussi la réception de l'arrêt avant de viser. La campagne finale est réussie sans masquer les assertions de passe, interception ou visibilité des contrôles.

Captures visuellement inspectées : `token-wallet-desktop.png`, `token-wallet-mobile.png`, `token-team-rematch-desktop.png`, `token-team-rematch-mobile.png`.

## Android

Compilation finale réussie en **1 min 9 s** (`/tmp/slaptax-token-android-final.log`). APK debug et AAB non signé remplacés dans `mobile/artifacts`. Les deux manifestes embarqués correspondent au bundle commun `0ce22cbdd077`. Empreintes complètes dans `mobile/artifacts/manifest.json`. Aucun certificat de distribution, signature release ou publication store ajouté.

La reconstruction web de déploiement installe explicitement les dépendances de build même avec `NODE_ENV=production` ; la construction web reste indépendante des outils Xcode/Gradle de publication native.

Les écritures PostgreSQL passent par la connexion qui détient le verrou, afin qu’une perte de ce verrou ne laisse pas une autre connexion continuer à écrire. La suite serveur complète a été rejouée après cette correction : 282/282.
