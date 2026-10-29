# Soirée entre amis : validation du 28 octobre 2026

## Fonctionnalités livrées localement

Accueil recentré sur trois jeux, huit bonus toujours accessibles. Salon privé à quatre, confirmations de préparation, trois manches obligatoires, adversaires alternés, points cumulés calculés côté serveur, bilans entre manches, podium, titres fondés sur les statistiques, partage textuel et revanche avec le même groupe.

Les mécaniques utilisent les moteurs existants. Cette intervention ne prétend pas ajouter une nouvelle physique, une nouvelle direction artistique complète ou un export vidéo.

## Vérifications observées

- **265/265 tests serveur réussis**, dont cinq nouveaux scénarios de soirée et un contrôle des compteurs administrateur. Journal : `/tmp/slaptax-night-api-final.log` (48,2 s).
- Les scénarios serveur couvrent les quatre consentements, l'ordre des trois jeux, la séparation des paires, les gains d'équipe, les égalités, la non-duplication des points, les commandes périmées, l'attente de l'autre paire, la pause/reprise et l'interruption sans points.
- Build unifié web + mobile et synchronisation iOS/Android : réussis (`/tmp/slaptax-night-build.log`). Contrôle du contenu et de l'empreinte des sources réussi : `f546fabdbc68`.
- Compilation Android : **réussie en 1 min 47 s** (`/tmp/slaptax-night-android.log`). APK debug et AAB non signé remplacés dans `mobile/artifacts`. Le manifeste embarqué dans chacun correspond au bundle synchronisé ; SHA-256 complets dans `mobile/artifacts/manifest.json`.
- `git diff --check` : réussi.

## Limites

Pas de test physique iPhone/Android. Projet iOS synchronisé mais non compilé : Xcode 26 indisponible ici. Pas de workflow GitHub exécuté, de push, de déploiement du serveur ou de soumission aux stores. Les installations natives doivent être redistribuées ; le backend public doit recevoir cette version avant de pouvoir héberger les soirées. Les salons en mémoire ne survivent pas à un redémarrage du serveur.

Les tests automatiques ne remplacent pas les cinq groupes de playtest proposés dans `docs/SOIREE_ENTRE_AMIS.md`. Aucun résultat de rétention, de viralité ou de satisfaction réelle n'est annoncé.

## Parcours navigateur

**20/20 scénarios réussis**, environ 4,1 min (`/tmp/slaptax-night-browser.log`). Une soirée complète sur ordinateur a utilisé le navigateur du créateur et trois clients WebSocket de test authentifiés : reconnexion, trois jeux à leur durée normale, classement final puis revanche dans le même salon. Sur viewport mobile, le nouveau scénario vérifie la création/entrée à quatre, la scène de braquage, la reconnexion et la sortie ; il ne rejoue pas les trois manches complètes. Les autres scénarios couvrent les fiches, modes, invitations, défi de tour, suppression de profil et modération.

Captures : `friend-night-heist-desktop.png`, `friend-night-heist-mobile.png`, `friend-night-podium.png` dans ce dossier.
