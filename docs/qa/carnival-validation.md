# Validation gameplay et stabilité — 27 octobre 2026

## Version finale

- Compilation TypeScript + Vite réussie : `index-CHthv8Np.js`.
- Suite backend complète : **189 / 189** tests réussis, dont 23 tests Carnival et deux tests d’arrêt du serveur avec sockets actives ou non répondantes.
- **34 scénarios navigateur distincts validés sur ordinateur/mobile**, répartis entre `club-catalog.spec.ts` (18), `solo-rewards.spec.ts` (2), `carnival.spec.ts` (12) et `realtime-recovery.spec.ts` (2).
- La première campagne de 32 scénarios a révélé une course de reconnexion sur ordinateur (31 réussites). Après correction, la campagne finale de huit scénarios a validé les deux solos rééquilibrés, la coupure silencieuse et l’absence de premier état, sur les deux formats : **8 / 8 réussis**. Les autres interactions et mises en page avaient déjà été validées dans la première campagne.
- Audit réel des ports 5173 et 8787 : huit noms attendus, bon script compilé, moteur publiant les nouveaux pouvoirs, rendu en réduction des mouvements et aucune erreur JavaScript (`selection-version.json`, `carnival-stability.png`).
- `git diff --check` réussi. Aucun déploiement public ni commit réalisé.

## Comportements vérifiés

- Une esquive de tarte réellement dirigée sur le personnage donne une grosse tarte. Un tir hors cible ne donne pas de fausse esquive ni de pouvoir gratuit. Le bonus est consommé au lancer et les points réels apparaissent à l’impact.
- Encaisser au-dessus du seuil de risque donne un seul casque. Le sabotage consomme ce casque une fois, coûte bien les points annoncés et ne vole pas les points déjà encaissés.
- Relâcher très tôt arrête le gonflage sans créer de points. Garder le doigt posé après une explosion ne gonfle pas le ballon suivant. Les commandes retardées et celles d’avant une reprise sont rejetées par leur numéro de ballon.
- Après trois secondes de silence, les commandes sont désactivées. Le canal est recréé après huit secondes, avec son propre délai d’attente ; la même partie et les points encaissés sont conservés lors de la reprise réseau. L’absence de premier état est également récupérée automatiquement.
- Le bot de tartes marque et rate des tirs : sa visée n’est plus infaillible. Les scores des humains inactifs restent à zéro.
- L’arrêt HTTP attend la fermeture des WebSockets. Un client non répondant est terminé après une seconde ; un ancien processus ne reste plus accroché à ses connexions de jeu.

Ces résultats concernent les scénarios ciblés énumérés. Les anciennes spécifications navigateur de jeux archivés ne sont pas présentées comme une suite complète validée. L’humour et la rétention restent à mesurer avec de vrais groupes d’amis.
