# Publication du 29 octobre 2026

## Version des jeux

Le commit `dac117d36cfdd5a0ba75ea211f54fee1bc1b73b2` a été publié sur `main` et vérifié sur `https://slaptax-r9na.onrender.com/api/health`. L’API annonce le mode `store`, les fonctionnalités de suppression de compte et de registre des jetons. Les assets JS/CSS publics ont été comparés par SHA-256 au build local ; ils correspondent. `/api/tokens` et `/api/state` refusent les requêtes sans session (401).

Le correctif serveur `130da090bf219f697c08d674f66ef06000afc564` a ensuite été déployé avec succès : Render et `/api/health` confirment cette révision, `/api/startup` annonce `ready: true`, et `/api/tokens` reste protégé (401 sans session).

## Déploiement à écriture unique

Le redéploiement suivant a exposé un conflit entre le verrou PostgreSQL de l’instance active et le démarrage parallèle de Render. La protection contre les écritures concurrentes est conservée.

Sur Render, le stockage attend le verrou pendant au maximum 120 secondes. La connexion PostgreSQL est vérifiée avant l’ouverture du port. `/api/startup` distingue `processStarted` et `ready` : c’est une sonde de démarrage pour l’orchestrateur, pas une preuve de disponibilité du jeu. Les API retournent 503 avec `Retry-After: 3` et les upgrades WebSocket sont refusés tant que l’instance ne possède pas le verrou. Les pages et assets peuvent être servis pendant cette maintenance. Les soldes ne sont ni lus depuis un cache provisoire ni modifiés durant l’attente.

Render bascule le trafic puis arrête l’ancienne instance ; après sa fermeture et la libération du verrou, la nouvelle instance charge les dernières données et récupère les duels interrompus. La disponibilité réelle se vérifie avec `/api/health` (200 et bonne révision). Ce choix implique une courte maintenance, généralement autour de 60 à 90 secondes ; il ne promet pas un basculement sans interruption. Voir [le déroulement documenté par Render](https://render.com/docs/deploys#zero-downtime-deploys).

Une absence de PostgreSQL reste bloquante en production ; aucun repli vers un fichier éphémère n’est ajouté. Une perte du verrou fait refuser les lectures/écritures et l’admission de nouvelles actions. Un délai dépassé provoque un échec de démarrage, sans voler le verrou d’une autre instance.

## Validation et CI

- 333 tests serveur passent, dont l’attente du verrou, le chargement du dernier solde, le délai limite, les sondes distinctes et le refus des mutations/connexions avant acquisition.
- Le runner de validation mobile est fixé à Ubuntu 24.04, pris en charge par la version installée de Playwright.
- Le site de test est compilé sans origine API distante. Le bundle natif est compilé séparément avec l’origine publique. Le serveur E2E refuse un bundle web contenant cette origine publique, afin d’éviter les écritures de test en production.
- La sortie du salon est intégrée à l’arène immersive ; une seule commande est exposée pendant la partie, sur PC et sur mobile.
- Build web et synchronisation Android/iOS vérifiés (`450487deb7ac`). Les 30 parcours E2E de publication passent localement (soirée complète PC, soirée mobile, puis 28 parcours de compte, défis, tournois, récompenses et jetons). Les six tests des outils de build passent également.

Les APK debug et AAB release non signé ont été reconstruits avec succès. Le manifeste embarqué dans chaque archive correspond exactement au bundle mobile `450487deb7ac`. Les fichiers et leurs SHA-256 sont disponibles dans `mobile/artifacts/` (ignoré par Git). iOS est synchronisé mais ne peut pas être compilé localement avec le Xcode disponible ; la compilation CI et la signature restent des validations distinctes.
