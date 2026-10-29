# Validation locale — passes et salons 2v2

Validation finalisée le 28 octobre 2026. Aucun déploiement, achat, publication sur les stores ou envoi d’invitation externe n’a été réalisé.

## Serveur et compilation

- **247 tests serveur réussis sous Node 22**, zéro échec ou annulation, sur la source finale. Exécution isolée avec `node --test --test-concurrency=2 api/tests/*.test.js` : 36,9 secondes.
- Parmi eux, 28 tests de règles du Goûter et 7 tests de salons : vol, rebonds, interception, passes et assistance, tirs alliés, score partagé, choix de personnage, capacité du salon, contrôle de l’hôte, commandes périmées, départ, reconnexions répétées, expiration et votes de revanche.
- TypeScript et compilation Vite réussis. Build final : `index-C72XM4SS.js`, `Snack-KUR4iKJI.js`, `SnackTeams-C1A_GXnC.js` ; composants de jeu et salon chargés séparément.
- Vite signale le bundle principal à 501,74 ko minifié, légèrement au-dessus de son seuil indicatif de 500 ko. Aucun benchmark de chargement sur appareil physique n’est établi.
- `git diff --check` sans erreur.

## Navigateurs

- Les 22 parcours de régression de l’arène, des personnages, du catalogue et du matchmaking ont réussi sur ordinateur et mobile dans la suite élargie.
- Les trois scénarios de salons ont réussi sur ordinateur sur le build final : partie complète, code invalide et nouveaux visiteurs.
- La relance mobile isolée, avec lancers tactiles et sans enregistrement continu de traces, a réussi les trois scénarios en **44,9 secondes**. Aucun événement `pageerror` dans la partie complète.
- L’enregistrement de traces est désactivé pour ce fichier à quatre sessions afin de limiter la charge du poste de test ; les captures et les observations des vrais états WebSocket restent actives. Cette mesure concerne les tests, pas les contrôles de fraîcheur du jeu.

Le scénario 2v2 utilise quatre identités et quatre contextes indépendants. Il crée un salon depuis l’accueil, rejoint par invitation, choisit Toast pour un coéquipier, joue une passe réellement attrapée, livre, recharge une page et reprend le même match, réalise une interception adverse, termine à trois livraisons et confirme les quatre revanches. Les positions, résultats et scores ne sont pas injectés. Sur mobile, les lancers passent par des événements tactiles Chromium sur le stick droit.

Les contrôles et le terrain sont mesurés dans le viewport : ordinateur 1280×900, puis mobile 320×650, 390×844 et 320×740. Un autre parcours vérifie qu’un code invalide donne une erreur compréhensible et laisse créer un salon. Un troisième crée deux identités anonymes depuis des navigateurs vierges et les fait rejoindre le même salon par invitation, sans inscription préalable.

Les régressions ciblées couvrent aussi les trois pouvoirs, la préférence locale non enregistrable, le duel humain, son résultat exportable, l’arrêt des commandes, l’audio optionnel, les dix mini-jeux bonus et la file ciblée.

## Problèmes trouvés pendant la validation

La première passe a trouvé un contrôle hors écran sur ordinateur ; la place réservée au terrain et les styles de boutons ont été corrigés. Elle a également montré qu’un placement de test faisait pousser le porteur par son coéquipier avant de lancer : le scénario fait désormais se démarquer les joueurs.

La suite de 26 parcours a ensuite réussi 25 cas, avec une interruption de flux dans le scénario à quatre mobiles émulés. Une exécution serveur concomitante a aussi dépassé le délai d’un test d’arrêt. Les suites ont été séparées pour la validation suivante ; un autre passage mobile a atteint la limite d’assistance de cinq secondes et un autre a interrompu son déplacement. Le scénario a été précisé pour effectuer la passe vers le dépôt et la capture continue des traces a été retirée du fichier à quatre sessions. La relance mobile complète a ensuite réussi ; les contrôles de fraîcheur n’ont pas été assouplis pour faire passer le test. Sans nouvel état, les commandes restent suspendues et le canal tente de se reconnecter.

## Captures et relevé

- [Partie sur ordinateur](team-rematch-desktop.png)
- [Salon mobile](team-lobby-mobile.png)
- [Partie sur écran court 320×650](team-320-650.png)
- [Partie 390×844](team-390-844.png)
- [Résultat mobile avec statistiques réelles](team-result-mobile.png)
- [Revanche mobile](team-rematch-mobile.png)
- [Relevé de version et de validation](team-version.json)

## Limites

Les émulations ne remplacent pas quatre téléphones physiques sur des réseaux mobiles. Ni la qualité d’un jeu natif fini, ni l’équilibrage, ni la capacité de charge, ni la rétention ne sont démontrés. Les salons restent privés et en mémoire dans un seul serveur ; un redémarrage les efface. Le test humain de plaisir de jeu reste à conduire selon [le protocole proposé](../PLAYTEST_GOÛTER.md).
