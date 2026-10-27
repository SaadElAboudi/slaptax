# Validation crasses et coups de nappe — 27 octobre 2026

- Suite backend complète : **193 / 193** tests réussis. Les 18 tests ciblés Garde/Table passent, dont les seize paires d’actions sous les quatre configurations de charge, les effets de banane, le renvoi de poisson, la physique déterministe, les avertissements de nappe, la pause et l’égalité d’impulsion pour humains et bots prêts à se propulser.
- Campagne navigateur : **30 / 30** scénarios réussis sur ordinateur et mobile. Catalogue et contrôles des huit jeux, catalogue FR/EN, Pif Paf solo et duel, Bagarre de Table solo et duel.
- Le duel Pif Paf joue réellement une banane contre une charge, une défense contre une attaque chargée, puis une nouvelle banane et un KO. Les choix restent cachés, la défense récupère correctement, les PV et le gagnant serveur sont vérifiés. L’historique, le compteur de crasses et l’export PNG sont contrôlés.
- Le duel Table attend le véritable avertissement de nappe, constate le déplacement du personnage, joue une propulsion et vérifie le résultat, la vraie scène finale et les instantanés du replay.
- Les textes d’accueil et les accroches indiquent les nouveautés. Les contrôles Garde passent à quatre actions et restent accessibles à 320 px de large. Le dernier ajustement de texte du guide est recompilé et les quatre contrôles d’affichage Garde/Table sont rejoués sur ordinateur/mobile.
- La vérification locale des ports 5173 et 8787 est enregistrée dans `wtf-version.json`. Le nouveau backend accepte réellement l’action `prank` et publie les gags autoritaires. L’ancien processus local s’est arrêté proprement avant le démarrage de celui-ci.
- `git diff --check` réussi. Aucun commit ni déploiement public.

Les résultats mesurent la cohérence technique et les interactions réellement jouées. Ils ne prouvent pas une rétention, une viralité ou un niveau d’humour auprès du public.
