# Slap Tax — édition cinématique

La piste et la finale sont des scènes 3D jouables. Les états, déplacements,
qualifications et collisions restent ceux du serveur. La caméra observe le jeu ;
elle n'invente ni participant, ni résultat.

## Direction

Une arène de jouets dystopique : béton bleu nuit, couloirs menthe, métal crème,
gardien corail, projecteurs chauds et contre-jour froid. Les personnages ont des
volumes, des bras et des jambes animés. Le gardien détourne le regard à AVANCE,
puis regarde la piste à STOP. La finale utilise les positions physiques reçues,
y compris pour les replays. La visée tactile est projetée sur le plan de la table.
Le biscuit est vu du dessus pour conserver un tracé précis au doigt.

La 3D est chargée à la demande. Les shaders sont préparés de façon asynchrone ;
la scène de compatibilité reste jouable pendant cette préparation ou si WebGL
est indisponible. La résolution est plafonnée ; sur écran tactile, des ombres de contact remplacent
les cartes d’ombres coûteuses. Le rendu trop lent déclenche le mode de compatibilité
pour préserver les commandes. Le rendu est
suspendu lorsque l'application est inactive. Les animations de caméra et de
course respectent la réduction des mouvements.

## Visuels livrés

- `web/public/art/cinematic/cookie-v3.webp` : texture issue du générateur d'images
  intégré (mode built-in), optimisée en WebP. Son placement conserve les coordonnées
  du contour et les commandes du moteur.
- `web/public/art/cinematic/arena-preview-v3.webp` : capture du véritable rendu 3D
  de l'entraînement contre trois robots, exportée par le navigateur. Les menus
  utilisent cette capture ; ce n'est pas une illustration d'un faux gameplay.
- `web/src/gameplay/cinematic/stage.ts` : décors, personnages et éclairage en 3D.

## Prompt final — biscuit

Use case: stylized-concept. Asset type: production game texture, square 1024x1024.
Create a beautifully rendered top-down orthographic round Korean-style honeycomb
sugar cookie on a dark brushed gunmetal round tray, entire tray centered precisely
at (50%,50%), entire round cookie centered precisely (50%,50%) and radius exactly
45% of image width, subtle thickness rim visible. Premium stylized 3D animation
film materials, caramelized porous golden sugar with toasted edges, micro bubbles,
tactile gloss in tiny pinpoints, crumbs on the tray. Strong dramatic warm light
from upper left, cool teal reflected edge light lower right, elegant tactile macro
material. Cookie upper surface MUST be completely blank and uniformly continuous:
NO triangle, NO outline, NO engraving, NO shape, NO needle, NO hands, NO characters,
NO UI, NO text, NO logo. Camera exactly overhead with no tilt, perfect circle not
ellipse, dark background, full object fits square frame. Actual game will overlay
its interactive cut path over this texture.

## Vérifications

`web/e2e/cinematic.spec.ts` vérifie le rendu WebGL effectif, les coordonnées des
commandes et les scènes mobiles. Les tests de compétition couvrent également
un groupe mixte : un client 3D et trois clients en rendu de compatibilité.
Les règles et les résultats restent communs à tous les rendus.
