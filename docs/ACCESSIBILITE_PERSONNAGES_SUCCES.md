# Accessibilité, personnages et entraînement

Cette tranche reprend les demandes des trois sessions fournies : confort de jeu,
identité des personnages, salons, succès et guide d’entraînement. Le quatrième
fichier fourni est un doublon de la troisième session.

## Confort de jeu

Dans Profil et réglages : contraste renforcé, textes agrandis et réduction des
animations. Les préférences sont conservées sur l’appareil. La réduction des
animations complète celle du système : CSS, scènes 3D, rendus Canvas et vibrations.
Dans le Braquage, les amis et rivaux ont des formes distinctes sous leurs pieds,
en plus des couleurs et libellés. Le mode Confort visuel agrandit les repères et
supprime les secousses. Une secousse brève accompagne les coups en mode normal.
Les règles, dégâts, collisions et commandes restent communs aux joueurs.

## Personnages

Les quatre identités existantes (Étincelle, Visière, Couronne, Fantôme) utilisent
les avatars et déblocages du serveur. Les choix verrouillés sont lisibles dans
le profil. Une sélection est confirmée par l’API avant d’être affichée.
`shared/characters.json` contient les identifiants publics et leurs noms.
Les salons de duel et de compétition exposent uniquement l’identifiant d’avatar
public du profil ; une valeur envoyée par le client lors de l’entrée ne remplace
pas le choix enregistré. Les robots restent annoncés et utilisent Visière.
Les personnages sont cosmétiques. Leurs déblocages n’ajoutent pas de statistiques.

## Succès

Cinq objectifs : premier entraînement, entraînement parfait à 1 000 points,
premier duel gagné, trois duels gagnés et victoire en compétition à quatre.
Les duels et compétitions s’appuient sur les résultats terminaux du serveur ;
un résultat annulé, une égalité ou une compétition contre les robots n’accordent
pas le succès de victoire entre amis. Chaque reçu possède un identifiant stable
pour ne pas compter deux fois un résultat revu ou rechargé.

Ces succès sont conservés **sur cet appareil et par profil**, sans récompense de
jetons. Ils ne remplacent pas les badges, l’XP ou les déblocages du serveur. Ils
commencent avec l’activité enregistrée après cette mise à jour. La liste se trouve
dans Historique ; une notification annonce les nouveaux succès. Les profils ne
partagent pas leurs succès, et la suppression locale du compte les efface.

## Guide d’entraînement

Un guide en quatre étapes montre le but du jeu choisi, ses commandes, son réglage
d’intensité et la revanche. Il est intégré à la préparation de la manche ; le
bouton de départ reste utilisable. Passer ou terminer le guide, ou lancer la manche, mémorise le choix
pour ce profil et ce jeu sur cet appareil. « Revoir le guide » permet de le rouvrir.
Il ne modifie pas les paramètres de jeu, n’accorde pas de victoire et n’affiche
pas de récompense fictive. Les commandes présentées suivent le mode tactile/clavier.

## Vérifications

- Tests web : confort, formes d’équipe, dédoublonnage des résultats, absence de victoire
  accordée pour une défaite ou un entraînement, scores invalides et seuil exact du score parfait.
- Tests serveur : avatar public filtré et choix réellement enregistré dans le salon.
- Tests navigateur : préférences persistantes, choix serveur et verrouillage,
  progression/relecture du guide et vraie découpe terminée débloquant les succès.
- Contrôles de régression : compétition, entraînement robots et maintien des scènes 3D.
- Build commun web/Android/iOS ; compilation Android et contrôle des fichiers embarqués.
  La compilation iOS nécessite Xcode complet.

## Limite du contrôle multi-écran sur ce Mac

Le test de compétition combinant un client WebGL et trois clients légers ne
qualifie pas le premier joueur sur cet environnement. Le même échec a été
reproduit sur la révision précédente `17c5565`, dans un worktree isolé. La cause
n’est pas attribuée à cette phase sur la seule base de ce test.

Le scénario reste actif par défaut. Pour vérifier séparément le parcours à quatre,
`SLAPTAX_COMPATIBILITY_E2E=1` utilise quatre clients légers, avec les mêmes règles,
les gestes réels, la revanche et l’attribution du succès au véritable gagnant.
Les scènes WebGL, la visée tactile en perspective et une victoire réelle en duel
sont contrôlées par des scénarios distincts. Cela ne constitue pas un playtest
sur quatre téléphones physiques.

## Bilan de cette intégration

- `npm test` : 345 tests serveur réussis.
- `node --test web/tests/*.test.ts` avec Node 24 : 36 tests web réussis.
- Scénarios ciblés de préparation en navigateur bureau/mobile : 12 réussis.
- Suite mobile incluant les nouveautés, l’entraînement robots, la 3D et la
  compétition en mode léger : 21 scénarios réussis avec
  `SLAPTAX_COMPATIBILITY_E2E=1`.
- Le scénario mixte à quatre avec WebGL reste soumis à la limite décrite ci-dessus.
