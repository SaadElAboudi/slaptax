# Slap / Zone — laboratoire de combat

Accès : `/?tab=combat`, ou « Jouer au combat » sur l’accueil.

Ce mode remplace les épreuves 3D comme entrée principale. C’est un prototype local
jouable, pas du multijoueur en ligne ni un mode classé. Il n’attribue aucun jeton,
XP ou résultat au compte. Les parties existantes restent accessibles.

Une équipe de trois (joueur + deux robots) affronte trois robots pour une zone
centrale. Occupation exclusive : progression jusqu’à 100 %. À 90 secondes, le
plus grand score gagne ; un score égal donne une égalité. KO : retour en 3 secondes.

Trois combattants : Volt (tir soutenu), Brick (dispersion courte portée, davantage
de vie), Echo (longue portée, cadence lente). Déplacement analogique à gauche,
visée et tir maintenu à droite, esquive avec récupération, super chargé par les
dégâts infligés. Le tir ordinaire a une cadence propre au combattant, sans munitions.
Les couvertures bloquent déplacements et projectiles. Les robots contournent les
obstacles, recherchent le centre et esquivent les projectiles proches.

Clavier : ZQSD/WASD ou flèches, Espace pour tirer, Maj pour esquiver, E pour le
super. La perte de focus ou la mise en arrière-plan met la simulation en pause.
Les gestes annulés ne laissent aucune commande active.

Le rendu Canvas 2D avec caméra mobile évite de charger le moteur des anciennes
scènes 3D. La simulation utilise un pas fixe de 120 Hz et le dessin suit l’écran ;
ce choix ne prouve pas une fréquence de 60 images/s sur tous les appareils.
Les préférences existantes de son, vibrations et mouvements réduits sont respectées.

Avant d’étendre ce mode : évaluer le plaisir et la lecture sur de vrais téléphones,
équilibrer les kits avec des joueurs, puis raccorder un serveur autoritaire et une
prédiction client. Le moteur local ne doit jamais devenir une source de résultats
classés ou de récompenses acceptée sans validation serveur.
