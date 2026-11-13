# SLAP TAX — vidéos des six jeux actifs

Le lot courant contient **six vidéos verticales de 15 secondes**, une pour chaque jeu : Chef Couic, CHROMA, Tour de Trop, Braquage du Goûter, Bagarre de Table et Tarte ta Face. [Plan et choix éditoriaux](PLAN_SIX_JEUX.md).

Les anciennes vidéos, dont Passe ou BOUM, restent dans « Archives-storyboards » dans le Studio. Elles ne font plus partie du lot rendu par défaut. `campaign.json` pilote le lot ; la préparation vérifie sa correspondance exacte avec le catalogue actif de l’app.

## Rendu

Projet Remotion séparé, sans dépendance ajoutée à l’app ni changement au déploiement Render. Les dépendances de l’API doivent aussi être installées à la racine du repo (`npm ci`) pour préparer les scénarios. Node 20.19+ ; Node 24.11.0 disponible sur ce Mac.

```sh
npm ci
npm run check
npm run studio
npm run render:batch
npm run verify:campaign
# Ou une seule vidéo :
npm run render -- 05-chroma-couleur
```

MP4 H.264, 1080 × 1920, 30 images/s, yuv420p, muets. Sorties : `exports/<id>/draft.mp4`. Sur macOS 12, une séquence JPEG est encodée avec le FFmpeg statique installé ; les images temporaires sont supprimées après un encodage réussi pour éviter de saturer le disque. `--keep-frames` permet de les conserver lors d’un rendu individuel.

La préparation régénère les snapshots à partir du moteur serveur et les compositions réutilisent les dessins Canvas du jeu. Les scènes sont des **démonstrations scénarisées**, signalées à l’écran, pas des captures de parties humaines. Le cadrage CHROMA est une vue éditoriale des couleurs et du résultat public. Les scores, livraisons, collisions, esquives et chutes proviennent des moteurs existants.

Les anciens exports ne sont pas écrasés dans `sources vidéos/`. Le nouveau lot livré va dans `sources vidéos/lot-03-six-jeux/`, avec légendes, vérification technique, planches de contrôle et une galerie locale `visionner.html`.

## Révision et diffusion

Chaque dossier `videos/<id>/` contient son brief, `voiceover.txt` et `video.json`. Le lot actuel est muet ; les textes vocaux sont des propositions de script, aucune génération payante n’est effectuée. Ne pas présenter ces textes comme une voix intégrée.

Le CTA utilise le site déployé : https://slaptax-r9na.onrender.com. Aucun lien en bio, lien de défi déjà existant ou témoignage réel n’est inventé. Avant diffusion, revoir chaque vidéo sur téléphone et vérifier le placement des textes avec l’interface de la plateforme. Les fichiers restent des propositions locales ; aucun réseau social n’est contacté.

Le mode `--publish` historique exige une capture fournie et un statut `approved`. Il ne publie rien sur un réseau social et ne remplace pas la revue éditoriale. Les démos du présent lot ne sont pas marquées `approved`.

## Voix et musique optionnelles

`npm run voice -- <id>` affiche le script sans appel externe. `--generate` utilise ElevenLabs et nécessite une autorisation explicite de consommation de crédits. `.env`, pistes vocales, captures et exports restent ignorés par Git. La boucle synthétisée historique existe pour les archives ; elle n’est pas intégrée au lot actuel.

## Historique

[Ancien plan de 21 vidéos](PLAN_21_VIDEOS.md). Les lots antérieurs de quatre mécaniques et les variantes de Cantine sont conservés pour référence. Ils ne définissent plus la campagne actuelle.
