# La soirée des mauvaises excuses

Une soirée privée à quatre, sans mise ni bots. Le parcours principal présente trois jeux ; les huit autres restent accessibles dans « Tous · jeux bonus », avec leurs modes existants.

## Déroulement

1. Depuis l'accueil, « Créer une soirée à quatre ». Le créateur partage un lien ou le code à six caractères.
2. Chaque ami choisit son personnage et confirme qu'il est prêt. Le créateur lance lorsque les quatre sont connectés et prêts.
3. **Braquage du Goûter** : 1 + 3 contre 2 + 4. Les deux partenaires gagnent les points de leur équipe.
4. Bilan de manche et confirmation de chacun, dans le même salon.
5. **Tarte ta Face** : 1 contre 2 et 3 contre 4, simultanément. Chaque paire conserve son propre état et ses propres scores.
6. Même bilan, puis **Tour de Trop** : 1 contre 4 et 2 contre 3, simultanément.
7. Podium, faits de jeu réels, titres amusants, partage textuel du classement et revanche à quatre sans nouvelle invitation.

Victoire : 3 points, égalité : 1 point par joueur, défaite : 0. Les trois manches sont jouées même si quelqu'un mène déjà. Les égalités finales sont affichées comme telles. Les titres proviennent des interceptions, esquives, touches et blocs effectivement réalisés ; le titre de consolation est clairement humoristique.

Le partage du bilan ouvre la création d'une nouvelle soirée : il n'invite pas un cinquième joueur dans un salon déjà plein. Ce chantier ne génère ni extrait vidéo ni replay public persistant.

## Architecture et stabilité

La playlist unique est dans `shared/friend-night.json`, utilisée par le serveur et le frontend. Le mode réutilise les moteurs de jeu existants, leurs commandes et leurs scores calculés côté serveur. Aucun score n'est transmis par le client pour décider du classement.

Le salon 2v2 classique reste disponible. Les rounds portent un numéro qui change à chaque manche/revanche ; les anciennes commandes sont refusées. Une paire terminée attend l'autre. La déconnexion suspend les manches inachevées pendant un délai de reconnexion de 20 secondes, avec conservation des chronomètres. Au-delà, la manche est interrompue sans points ni champion artificiel. Si quelqu'un quitte volontairement, les autres reviennent au lobby et le bilan de la soirée est remis à zéro.

Les salons restent en mémoire sur une seule instance serveur ; ils expirent après 15 minutes sans activité de jeu. Un redémarrage du serveur les supprime. Le code doit donc être déployé sur le backend et le processus maintenu disponible avant un test public. Les projets web, Android et iOS embarquent le même frontend via `npm run build:all` ; les installations existantes nécessitent une nouvelle distribution.

## Mesure et premier playtest

Événements serveur persistés : `night_created`, `night_joined`, `night_started`, `night_round_completed`, `night_completed`, `night_rematch`. Les partages utilisent les événements existants avec `source: friend_night`. Aucun envoi à un service d'analytics tiers n'est ajouté.

Le endpoint administrateur protégé `/api/admin/monitoring` expose `nights` : créations, entrées, salons démarrés distincts, participations démarrées/terminées, confirmations de revanche et partages. Une revanche compte quatre confirmations ; ces compteurs ne constituent pas un taux de rétention. La fenêtre est limitée aux 10 000 derniers événements conservés, après application des suppressions de comptes. Un partage réussi côté client ne prouve pas qu'un destinataire a ouvert le lien.

À faire avec cinq vrais groupes de quatre amis, sans expliquer oralement les règles :

- Chronométrer l'arrivée dans la première manche ; relever les hésitations et boutons incompris.
- Noter les moments où les joueurs rient et les moments où ils ne comprennent pas une défaite.
- Observer s'ils demandent et confirment une revanche spontanément.
- Demander à chaque groupe quel jeu il souhaite relancer et lequel il supprimerait.
- Observer les invitations et les retours un autre jour avec leur accord.

Ces playtests restent à réaliser. La réussite des tests automatiques ne prouve ni le plaisir, ni la viralité, ni une qualité équivalente à Brawl Stars.
