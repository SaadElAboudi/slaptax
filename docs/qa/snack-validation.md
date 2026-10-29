# Validation — Braquage du Goûter

27 octobre 2026. Prototype local ; aucun déploiement de cette nouvelle arène n’est déclaré.

## Résultats

- **224/224 tests backend réussis sous Node 22**, dont douze tests spécifiques du moteur : déplacement borné et arrêt sans signal, validation des actions, bancs, préparation de frappe et direction verrouillée, recharge, dégâts/recul, esquive, KO, réapparition, portage/livraison, résultat, absence de récompense inactive, déterminisme, pause des délais, double KO simultané et boîte disputée. La file d’attente préférentielle possède aussi un test de service.
- **14/14 scénarios navigateur ciblés réussis** sur Chromium ordinateur et Pixel 7 émulé : arène dans l’accueil, dix jeux bonus en français/anglais, sélecteurs, contrôles dans la fenêtre à 320 × 740, déplacement souris/tactile, deux doigts indépendants, annulation/relâchement/perte de focus, vrai duel à deux contextes humains, frappe diminuant les PV réels, esquive rechargeable, trois livraisons, vainqueur et replay serveur, téléchargement PNG, audio volontairement indisponible et appariement par activité via HTTP.
- Après agrandissement du plateau portrait et adaptation de sa résolution : **6/6 contrôles ciblés supplémentaires réussis**, couvrant affichage, déplacement/arrêt et file d’attente sur les deux formats. Aucun nouveau changement de moteur pendant cet ajustement visuel.
- Compilation TypeScript/Vite et `git diff --check` réussis. L’arène est chargée séparément ; le bundle principal reste sous le seuil Vite de 500 kB.

## Version et captures finales

Asset principal : `index-DTYqmcAz.js`. Module d’arène : `Snack-CAYPEoPb.js`.

- [Accueil et bibliothèque bonus](snack-home.png)
- [Ordinateur 1280 × 900](snack-1280.png)
- [Portrait 390 × 844](snack-390.png)
- [Portrait 320 × 740](snack-320.png)
- [Petit écran 320 × 650](snack-320-short.png)
- [Mesures des commandes et du canvas](snack-version.json)

Ces quatre sessions supplémentaires passent par Vite et l’API locale réelle : deux participants dont un bot déclaré, aucune erreur JavaScript, boutons, sticks, case de visée et canvas entièrement dans la fenêtre. Le backing canvas suit la taille affichée : 714 × 476 pour l’ordinateur à DPR 1, 668 × 668 pour le portrait 390 à DPR 2. Les coordonnées de gameplay restent indépendantes de cette résolution.

## Traçabilité des passages

Logs locaux : `/tmp/slaptax-snack-node22-final.log`, `/tmp/slaptax-snack-browser-shipping.log`, `/tmp/slaptax-snack-portrait-final.log`, `/tmp/slaptax-snack-build-final.log`.

Les premiers essais ont révélé un mauvais chemin d’accès à l’export dans le pilote navigateur et une file bonus non nettoyée entre deux projets de test. Les pilotes ont été corrigés pour ouvrir le résultat puis le moment décisif et pour retirer leurs utilisateurs des files en fin de scénario. Le premier essai d’entrée de briefing a échoué une fois ; il n’a pas récidivé lors des deux derniers passages d’affichage. L’initialisation audio facultative a été durcie et testée explicitement avec un périphérique indisponible.

## Limites

Les suites historiques complètes de tous les mini-jeux ne sont pas déclarées entièrement vertes pour cette modification. Le catalogue bonus est vérifié en FR/EN ; le focus est la nouvelle arène et ses parcours. Aucun test de téléphone physique, mesure de rétention, benchmark de charge multi-salons ou validation réseau mobile dégradé n’est revendiqué. Les interactions du duel de validation sont scénarisées pour vérifier les règles ; elles ne prouvent pas l’équilibrage face à de vrais adversaires.
