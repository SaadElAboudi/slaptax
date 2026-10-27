# Validation des nouveaux jeux — 27 octobre 2026

- Compilation TypeScript/Vite finale réussie : `index-Bo9_mjSH.js`.
- Suite backend complète : **211 / 211** tests réussis, dont 18 tests des nouveaux moteurs. Cas couverts : entrées invalides, cadence, dérive réelle des projectiles, livraison adverse et sur soi-même, protection, absence de récompense sur son propre tir, confirmation des places, avertissements, esquives, haricots, munitions, pauses, replays, égalités et absence de score pour les humains inactifs.
- Campagne navigateur : **34 / 34** scénarios réussis sur ordinateur et mobile. Les deux nouvelles épreuves sont jouées jusqu’au résultat, en solo et en duel à deux humains. Le catalogue FR/EN et les contrôles des dix jeux sont vérifiés.
- Les tests utilisent les vrais contrôles. Le pilote de test anticipe une trajectoire à partir des états publics ; il ne fournit aucun score, impact ou position autoritaire au serveur. L’ascenseur est joué sur plusieurs passages avec confirmations et attaque ciblée.
- Les résultats de duels et les scènes exportables sont vérifiés dans les instantanés serveur. Les portefeuilles solo restent à 25 crédits démo.
- Les retouches graphiques finales séparent les étiquettes de voitures et remplacent les contours internes des nuages par une silhouette lisible.
- Le relevé `absurd-version.json` contrôle les dix titres et les scripts réellement servis sur les ports 5173 et 8787, ainsi que le lancement des deux moteurs actuels avec un bot annoncé en solo. Aucune erreur JavaScript. Aperçus : `pigeon-live.png`, `lift-live.png`.
- Aucun commit ni déploiement public. Les résultats ne constituent pas une mesure de viralité ou de rétention.

Après la compilation des retouches graphiques, les quatre contrôles d’affichage Pigeon/Ascenseur ont été rejoués sur ordinateur et mobile : **4 / 4 réussis**. `git diff --check` passe également.
