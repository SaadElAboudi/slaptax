# Validation locale — combattants du Goûter

27 octobre 2026. Cette évolution n’a pas été poussée ni déployée.

## Vérifications

- Serveur sous Node 22 : **231 tests réussis**, dont 19 tests spécifiques à l’arène (choix et verrouillage, pouvoirs, collisions, contre-jeu, pauses, KO et recharges).
- TypeScript et compilation Vite réussis. Artefacts : `index-FZlO82Ng.js`, `index-DcVamnCG.css`, `Snack-CeeMaZVE.js`.
- Parcours Playwright Chromium bureau et mobile : **22 scénarios réussis en 3,9 minutes** sur le build final.
- Contrôle local supplémentaire via Vite et l’API réelle : 1280×900, 390×844, 320×740 et 320×650. Aucun événement `pageerror`, tous les contrôles du jeu dans le viewport. Voir [les mesures](cast-version.json).
- `git diff --check` sans erreur.

Les parcours couvrent chaque personnage, la préférence non enregistrable, le pouvoir réellement exécuté par le serveur, le duel entre deux comptes humains (blocage, ralentissement, esquive), le déplacement et son arrêt, les livraisons, les résultats, le catalogue et le matchmaking ciblé. Les positions et les scores ne sont pas injectés par les tests.

## Corrections issues des tests

Une première passe a révélé un débordement des commandes sur ordinateur ; les trois boutons occupent désormais une rangée. Cette passe a été interrompue pour correction. La suivante a réussi 21 scénarios sur 22 : le bouton de démarrage pouvait être recouvert par la navigation flottante sur mobile. La navigation est maintenant masquée pendant le choix du combattant ; la suite ciblée a ensuite réussi les 22 scénarios sur le nouveau build.

## Captures

- [Choix des trois combattants sur mobile, build final](cast-picker.png)

- [Flanflan sur ordinateur](cast-flan-900.png)
- [Cornichon, écran 390×844](cast-pickle-844.png)
- [Toast, écran 320×740](cast-toast-740.png)
- [Cornichon, écran court 320×650](cast-pickle-650.png)

Ces captures de gameplay précèdent uniquement la correction de navigation du briefing ; les pouvoirs et les commandes sont identiques au build final.

## Limites de la preuve

Chromium émulé ne remplace pas une session sur iPhone et Android physiques. Les tests valident des règles et parcours précis, pas un équilibre compétitif, une latence de production, une rétention ou une viralité. Le mode reste solo avec bot annoncé ou duel humain ; pas de 2v2. L’ensemble des anciens scénarios E2E historiques n’a pas été relancé dans cette passe.
