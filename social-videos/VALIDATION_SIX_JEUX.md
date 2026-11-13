# Validation du lot six jeux — 5 novembre 2026

- Catalogue : six compositions actives, une par jeu courant. Les 23 configurations, archives comprises, passent le contrôle de préparation.
- Scénarios : quatre tests réussis. Cible CHROMA masquée pendant le mélange, erreur calculée par le moteur, collision et KO de table, touches et esquives de tarte réels.
- Rendu : six MP4 effectivement générés. 1080 × 1920, 15 secondes, 30 images/s, 450 images, H.264/yuv420p, aucune piste audio.
- Chaque MP4 a été intégralement décodé avec FFmpeg. Les empreintes SHA-256 sont conservées dans `sources vidéos/lot-03-six-jeux/verification.json`.
- Images de contrôle revues pour les six vidéos ; le Braquage a été réexporté avec une caméra rapprochée après cette revue.
- Galerie locale vérifiée sous Chromium : six vidéos chargées et parcourues, six liens directs vers les jeux, pas de débordement horizontal à 390 px ni d’erreur d’exécution. Les affiches proviennent des MP4.
- Anciennes livraisons conservées dans `sources vidéos/`. Les séquences JPEG temporaires du rendu sont supprimées après encodage réussi pour limiter l’espace disque.

Il s’agit de démonstrations scénarisées, pas de résultats de playtests ou de parties humaines. La revue technique et visuelle ne prouve pas une performance marketing. Une revue sur téléphone physique et avec l’interface de la plateforme reste utile avant diffusion. Aucun réseau social n’a reçu ces fichiers ; aucune voix, musique payante ou dépense publicitaire n’a été engagée.
