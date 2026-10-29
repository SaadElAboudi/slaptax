# Poule Position — validation du 28 octobre 2026

## Serveur

294 tests sur 294 réussis : suite complète `api/tests/*.test.js` sous Node 22, dont 12 nouveaux tests dans `chicken.test.js`.

Ces tests couvrent la fuite au sol sans traverser les obstacles, l’expiration du portage et la protection contre la reprise instantanée, le lancer et l’interception, les œufs annoncés à position fixe, l’esquive, l’absence de dégâts inventés, la fin accélérée, la conservation des chronomètres après pause, la victoire à trois captures, le score normalisé, le replay unanime et le refus des scores forgés.

## Interface et parties réelles

**24 tests navigateur sur 24 réussis**, sur Chromium ordinateur et téléphone : `chicken.spec.ts`, `friend-vision.spec.ts`, `home-ux.spec.ts`, `tokens.spec.ts`.

Playwright utilise le véritable serveur HTTP/WebSocket local en distribution `store`. Deux navigateurs indépendants jouent le nouveau duel avec de vrais déplacements, puis vérifient le résultat serveur, le versement de 3,4 jetons pour une mise de 2 par joueur (frais 0,6) et l’accès au replay. Le solo vérifie un seul bot annoncé et les gestes clavier ou tactiles. Les fiches des douze jeux, les quatre modes, les accès par code et le portefeuille sont inclus dans la même campagne.

Contrôle visuel supplémentaire à 320 × 740 et 390 × 844 : sticks et bouton de pouvoir dans la fenêtre, sans débordement de page. Captures `poule-position-320.png` et `poule-position-390.png`, ainsi que `poule-position-live-*` et `poule-position-result-*`.

## Plateformes et limites

`npm run build:all` réussi : web et bundle mobile construits, Android/iOS synchronisés, contrôle de parité réussi (25a48c184bbd).

Android : `assembleDebug` et `bundleRelease` réussis. APK de test et AAB non signé reconstruits dans `mobile/artifacts`, empreinte du bundle contrôlée dans les deux archives. Les 24 tests navigateur sont réussis. iOS synchronisé mais non compilé : pas de Xcode compatible sur cette machine. Aucun déploiement du backend ni publication store dans cette intervention. Les mesures de latence réseau réelle, tests sur appareils physiques et sessions d’équilibrage avec des joueurs restent à faire.
