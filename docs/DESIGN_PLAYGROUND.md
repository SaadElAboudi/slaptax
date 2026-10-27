# SLAP TAX — Playground

Direction : jeu de poche cartoon, rivalité amicale et gestes faciles à comprendre. Une identité propre au produit : mascottes géométriques, bleu profond, violet, jaune et cyan, contours encrés et relief court. Aucun asset de Brawl Stars ni ressource externe ajoutée.

## Parcours

- Accueil immédiatement utilisable, sans tutoriel imposé en trois écrans.
- « Jouer maintenant » ouvre Découpe en solo ; le sous-titre nomme explicitement le jeu.
- Chaque carte propose « Jouer » ou « Défier » et transmet le vrai jeu choisi.
- Solo : jeu sélectionné, trois étapes de règle, détail facultatif, lancement. Le catalogue complet reste dans « Changer de jeu ».
- Avec un ami : jeu favori puis lien d’invitation. Mise en crédits de démo, format et invitation directe sont dans les options. Le bannissement et le consentement des deux joueurs restent appliqués par le serveur.
- Défis : score partagé, jeu asynchrone. Un nouveau défi peut être créé sur Découpe, Trace ou Chroma au choix.
- Navigation permanente : Jouer, Amis, Défis, Tournois ; masquée pendant les manches pour laisser les contrôles accessibles.
- Classement et historique accessibles depuis l’accueil. Profil, pseudo, langue, cosmétiques et préférences audio regroupés dans les réglages.
- Retour via le logo et prise en compte de Précédent / Suivant du navigateur, y compris pour quitter un lien de défi.

## Visuel et interaction

- Tokens principaux : `web/src/styles/cartoon.css`, importés après les styles historiques.
- Tuiles illustrées en SVG/CSS natif ; palette par jeu ; aucun téléchargement de police ou d’image ajouté.
- Contours marqués, boutons qui s’enfoncent brièvement, choix actifs lisibles sans dépendre uniquement de la couleur.
- Plateau lisible et animations existantes conservées. Seul le rendu change : aucun réglage de difficulté, calcul de score ou géométrie de collision modifié.
- Musique désactivée par défaut tant que le joueur ne l’a pas activée ; préférences explicites existantes préservées. Les effets et vibrations restent configurables.
- Réduction des animations selon la préférence système ; navigation clavier et focus visibles.

## Vérification

Build TypeScript/Vite, suite API, scénarios navigateur de navigation et parties sur ordinateur/mobile. Vérification visuelle à 320, 390, 768 et 1280 px. Les screenshots de QA restent dans les artefacts Playwright ignorés par Git ; aucun déploiement distant n’est inclus dans ce travail.

## Progression solo

Le parcours du jour propose trois jeux déterminés par la date UTC. Un score strictement positif sur chacun termine le parcours ; un premier passage donne un badge permanent et chaque parcours terminé donne 90 XP. Les trois premières parties solo éligibles du jour donnent chacune 15 XP. Ces règles sont annoncées dans l’interface. Une journée manquée ne retire pas de progression.

Les dix mini-jeux pilotés par le serveur peuvent donner de l’XP solo. Les cinq autres gardent leur écran de score et d’étoiles ; aucune récompense serveur n’y est inventée. Les étoiles utilisent des seuils fixes de 400, 700 et 900 sur le score normalisé : ce sont des paliers de score, pas un classement entre joueurs.

La progression solo, les records et les badges sont persistés dans le profil par le backend à la fin d’une partie serveur. Les doublons de fin de partie sont dédupliqués. Les récompenses ne changent pas les crédits, les résultats compétitifs ou les points classés. L’XP solo participe au niveau existant et à ses déblocages cosmétiques. Aucun nouvel endpoint n’accepte un score déclaré par le navigateur.

Encore Un affiche des retours sur les placements et utilise le compteur réel de placements parfaits du moteur. Le résultat propose d’abord Rejouer, puis le défi à un ami et le changement de jeu. Le parcours du jour est une première hypothèse de rétention à mesurer ; son efficacité n’est pas encore validée auprès de joueurs.

## Troupe cartoon et réactions de jeu

Les épreuves hors Table disposent de mascottes SVG originales : Sir Paf, Bluffo, Pigment, Blocos, Tictoc, Chef Couic, Gribouille, Roi Patate et leurs camarades. Le composant `GameReaction` affiche une consigne courte, puis des réactions dérivées des résultats réels : dégâts, récompense de carte, erreur de couleur/temps, score du dessin, placements sécurisés, passes et réponses. Les choix adverses restent cachés jusqu'à leur révélation ; les spectateurs reçoivent seulement les consignes générales.

Garde utilise des chevaliers expressifs à la place des armures abstraites. Les cartes de Contrepied ont des personnages, les blocs empilés et palets Ricochet ont des visages à l'intérieur de leur géométrie, et les gobelets conservent leur visage pendant les mélanges. Les contrôles, hitboxes, scores serveur et récompenses XP restent ceux des jeux existants.

L'écran solo montre une jauge de maîtrise fondée sur le score réel, avec les seuils existants de 400, 700 et 900 points. Les animations de mascotte et de remplissage respectent `prefers-reduced-motion`. Cette couche vise une meilleure compréhension et une personnalité cohérente ; son effet sur la rétention reste à mesurer avec des joueurs.
