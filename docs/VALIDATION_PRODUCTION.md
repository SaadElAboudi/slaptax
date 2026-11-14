# Validation de lancement

Les commandes `npm --prefix web run qa:release` et `qa:e2e` construisent le site et testent les
parcours publics actuels sur ordinateur et mobile, avec les restrictions serveur
`APP_DISTRIBUTION=store`. Le script impose une API locale, même si le shell ou un
fichier `.env` configure habituellement Render. La suite comprend les six jeux du catalogue, les épreuves
3D, l’entraînement contre les robots, les défis par lien, les duels, les salons,
la compétition, les résultats, les remboursements et la reconnexion.

`npm test` isole sa base et ses variables de déploiement de l’environnement du
shell. Le serveur des tests navigateur utilise explicitement une base de fichiers
temporaire, même si `DATABASE_URL` est défini. Cette commande conserve les tests des moteurs historiques, de la persistance,
des jetons et de l’autorisation. Les anciens scénarios navigateur de menus et
jeux retirés restent dans le dépôt et dans la configuration Playwright historique (`qa:historical`) ;
ils ne constituent pas le contrôle de lancement de l’interface actuelle.
Les scénarios d’un jeu archivé et les contrôles réservés à un autre format d’écran
sont explicitement ignorés par leurs propres conditions, sans ignorer un échec actif.

La CI mobile exécute la suite de lancement, les tests web et les contrôles des
outils de build, puis compile Android et iOS. Un workflow distinct vérifie un duel
Safari/Chrome et le catalogue sur WebKit. Les rapports navigateur sont conservés
en artefacts, y compris en cas d’échec.

## Corrections de cette passe

- L’entraînement emploie l’identifiant aléatoire compatible avec les navigateurs
  sans `crypto.randomUUID`, une seule fois par session.
- Le guide reste facultatif et suit la préparation du jeu : il ne repousse plus
  le bouton de départ hors de la première vue sur un écran étroit.
- En attendant le premier état serveur, l’interface explique la connexion en cours.
  La reconnexion conserve l’identifiant de la partie.
- Le rendu 3D de la table rejoint celui de la course dans un Worker, afin de
  préserver les commandes sur un grand écran. La projection de la visée et le
  replay sont conservés, avec retour à la 3D classique si le Worker est indisponible.
- Une trame WebSocket trop volumineuse ferme sa connexion sans arrêter le serveur.
- Les réponses API ne sont pas mises en cache. Le cache immuable est réservé aux
  ressources versionnées. Un ancien fichier de build absent renvoie 404, plutôt
  que du HTML annoncé comme JavaScript ; un chemin mal encodé renvoie 400.
- Les contrôles navigateur utilisent les sessions authentifiées, les gestes actuels,
  la scène 3D et la liste des entraînements incluant les deux épreuves de compétition.

## Vérifier une publication

Après validation, construire avec `npm run build:all`, vérifier avec
`npm run mobile:check`, puis reconstruire les binaires avec les outils disponibles.
Après déploiement, vérifier le commit dans `/api/health`, `/api/startup`, les
fichiers réellement servis et les parcours publics sur petit écran. Une
synchronisation native ne constitue ni une compilation ni une publication store.

Les tests automatisés ne prouvent ni une capacité illimitée du serveur ni la
qualité sur tous les téléphones physiques. La configuration garde un seul serveur
écrivain pour la base ; ajouter des instances exige une autre architecture de
persistance et de salons. Les signatures, les validations sur appareils physiques
et les soumissions aux stores restent des opérations distinctes.

## Retour arrière

Si une publication provoque un incident, rétablir le code précédent par un revert
et laisser Render redéployer. Ne pas réinitialiser la base : les profils et le
journal des jetons doivent être conservés. Cette passe ne change pas le schéma des
données. Pendant une transition de serveur, l’API peut répondre 503 avec
`Retry-After: 3` ; le client garde son identité et propose de se reconnecter.
