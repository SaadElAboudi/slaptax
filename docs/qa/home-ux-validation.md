# Accueil : simplification des parcours — 28 octobre 2026

## Changements

- Une action principale : créer une soirée à quatre, gratuite et en trois jeux.
- Rejoindre directement depuis l’accueil avec un code de six caractères hexadécimaux ; normalisation en majuscules, validation avant navigation et erreur récupérable dans le salon.
- Accès secondaires regroupés : braquage 2v2 et découverte solo. L’entrée 2v2 efface le mode soirée précédent pour ouvrir le bon parcours.
- Suppression des cartes de duel/challenges qui dupliquaient les quatre modes.
- Nombre de jeux visible cohérent avec le filtre ; titre adapté aux jeux bonus.
- Cartes de jeux en une colonne sur téléphone : illustrations, noms et actions plus lisibles ; catégories défilantes sans débordement de page.
- Contrôles tactiles, focus clavier, réduction des animations selon les préférences système.

## Vérification

`npm run build:all` sous Node 22 : construction web et native, synchronisation Android/iOS, contrôle de parité réussi (empreinte 14468fc0e96b).

**20 tests Playwright réussis sur 20** : `home-ux.spec.ts`, `friend-vision.spec.ts`, `tokens.spec.ts`, sur Chromium ordinateur et téléphone. Le nouveau test mobile utilise une largeur de 320 px et vérifie l’absence de débordement horizontal. Captures : `home-ux-desktop.png`, `home-ux-mobile.png`.

Android : `assembleDebug` et `bundleRelease` réussis. APK de test et AAB non signé reconstruits dans `mobile/artifacts` ; empreinte embarquée vérifiée dans les deux archives. iOS est synchronisé mais n’est pas compilé sur ce Mac sans Xcode compatible. Aucune publication ou modification du serveur distant dans cette intervention.
