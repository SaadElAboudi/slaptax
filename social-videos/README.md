## Lot actuel : quatre mécaniques distinctes

Dans l’éditeur, les quatre premières compositions sont maintenant :
- `02-braquage-butins` : poursuite et interception, cadrage rapproché du porteur ;
- `01-decoupe-37` : précision, ligne de coupe et résultat mesuré ;
- `07-encore-un` : tour et bifurcation réelle sécuriser six blocs / risquer la chute ;
- `19-bombpass-pression` : trois passes acceptées puis explosion serveur.

Les anciennes variantes sont dans « Archives-storyboards ». Les représentations
sont des démos scénarisées, pas des parties humaines. La tour contient un arrêt
sur image éditorial pour laisser le temps de lire le choix. La bombe utilise les
états du gestionnaire multijoueur, avec une mise en scène éditoriale du transfert.
Le module `scripts/distinct-demos.mjs` ne contacte aucun joueur ni serveur distant.
Le code des jeux de l’app n’est pas modifié par ces compositions publicitaires.

Commande : `npm run render:batch`. Sorties dans `exports/` ; le lot courant est
également copié dans `sources vidéos/lot-02-jeux-distincts/` à la racine du repo.

---

# SLAP TAX — atelier vidéo

Compositions React / HTML / CSS avec Remotion, export MP4 H.264 vertical 1080 × 1920 à 30 images/s. Projet npm autonome : aucune dépendance ajoutée au jeu ou à son déploiement.

Le [plan des 21 vidéos](PLAN_21_VIDEOS.md) renvoie à chaque dossier dans `videos/`. Chaque dossier contient `README.md` (brief et publication), `voiceover.txt` (script éditorial) et `video.json` (source du rendu). Si le texte change, mettre aussi `voiceText` à jour : c’est ce champ qui est envoyé au service de voix.

## Démarrer

Node 20.19+ et accès au registre npm requis.

```bash
cd social-videos
npm install
npm run check
npm run studio
```

Conserver le `package-lock.json` produit par la première installation réussie, puis utiliser `npm ci`. Les versions directes sont épinglées. Le premier rendu peut télécharger Chromium et les outils de rendu fournis par Remotion ; FFmpeg système n’est pas requis. Consulter la licence Remotion selon l’usage et la taille de l’équipe.

```bash
npm run render -- 01-decoupe-37
```

Résultat : `exports/01-decoupe-37/draft.mp4`. Les exports et médias lourds sont ignorés par Git ; conserver les sources et configs dans le repo, les fichiers lourds localement ou dans un stockage dédié. Chaque export a son sous-dossier. Aucun envoi sur un réseau social n’est effectué.

## Remplacer les maquettes

Les 21 compositions sont des squelettes animés, pas 21 parties enregistrées. Sans capture, un panneau « STORYBOARD · CAPTURE À FOURNIR » reste visible ; les exports non approuvés portent « BROUILLON ». Les jeux ne sont pas réimplémentés dans cet atelier.

1. Enregistrer une vraie partie mobile et monter un clip de la durée du storyboard. Éviter les menus ; commencer par une action lisible. Le clip doit couvrir toute la durée configurée.
2. Déposer le clip dans `public/footage/01-decoupe-37.mp4`.
3. Dans `videos/01-decoupe-37/video.json`, définir `footage` sur `footage/01-decoupe-37.mp4`.
4. Adapter `scenes` : chaque segment est exprimé en secondes, continu de zéro jusqu’à `duration`. Ces textes sont des cartons éditoriaux ; les remplacer par les sous-titres synchronisés de la voix finale.
5. Adapter le CTA selon le lien réellement disponible. Aucun domaine ni lien de défi n’est inventé.
6. Contrôler le MP4 sur téléphone, avec et sans son. Passer `status` à `approved` après revue, puis lancer :

```bash
npm run render -- 01-decoupe-37 --publish
```

Le mode publication exige une capture et une approbation éditoriale ; il ne vérifie pas automatiquement la véracité de la capture ni la durée des fichiers. Aucun statut approuvé n’est fourni au départ. Si une capture est plus courte, corriger le montage avant publication. Les textes sont placés avec des marges conservatrices ; vérifier le recouvrement par l’interface actuelle de chaque plateforme.

## Voix

Option recommandée pour les vidéos entre amis : vraies réactions enregistrées avec leur accord. Pour les défis : voix off française complice, phrases courtes, sans voix de publicité exagérée.

### ElevenLabs, option préparée

```bash
cp .env.example .env
# Renseigner localement ELEVENLABS_API_KEY et ELEVENLABS_VOICE_ID.
npm run voice -- 01-decoupe-37
```

Cette commande affiche seulement le texte ; elle ne contacte pas ElevenLabs. Après décision explicite d’utiliser des crédits :

```bash
npm run voice -- 01-decoupe-37 --generate
```

Le script effectue un seul appel sans nouvelle tentative automatique et écrit `public/voice/01-decoupe-37.mp3`. Dans video.json, définir ensuite `voice` sur `voice/01-decoupe-37.mp3`. Vérifier la durée à l’écoute, ajuster `duration` et les scènes au besoin. Utiliser une voix et une offre autorisant l’usage commercial souhaité. Aucune génération payante n’a été lancée par ce setup.

Alternative sans service externe : enregistrer la voix au téléphone, l’exporter en MP3, puis renseigner `voice`. Sur macOS, `say -v '?'` permet de repérer une voix française installée pour une maquette ; ce n’est pas le choix recommandé pour la voix finale. `.env` et les pistes vocales sont ignorés par Git.

## Musique et mixage

`npm run prepare` génère `public/audio/slaptax-pulse.wav` : boucle instrumentale originale de 32 secondes, 120 BPM, synthétisée sans sample ni appel réseau. Elle est assez longue pour les 21 formats actuels. Pour une vidéo plus longue, adapter le générateur ou la piste.

Le squelette baisse le volume de la musique et ajoute une entrée/sortie progressive. La capture est muette par défaut pour éviter de cumuler des bandes-son : pour conserver les réactions ou effets réels, modifier explicitement `muted` dans `src/index.jsx`, puis refaire le mixage. Écouter la voix, vérifier l’absence de saturation et contrôler le volume perçu sur téléphone. Le mixage automatique ne constitue pas un mastering de diffusion.

Une piste finale plus expressive peut remplacer le pulse. Conserver dans `public/audio/LICENCES.md` la source, le titulaire, la date et les conditions autorisant la diffusion commerciale sur Instagram **et** TikTok. On peut aussi ajouter la musique séparément dans chaque application, à partir d’un export sans musique (`music: null`), en vérifiant les droits propres au compte et à l’usage.

## Commandes et vérifications

- `npm run prepare` : valide les 21 configs, reconstruit le catalogue et la musique.
- `npm run check` : valide les configs et l’existence des captures et voix renseignées.
- `npm run studio` : prépare puis ouvre les 21 compositions.
- `npm run render -- <dossier>` : prépare puis exporte un brouillon.
- `npm run voice -- <dossier>` : aperçu du texte, sans appel réseau.

Les contrôles de configuration ne prouvent pas qu’un MP4 a été rendu. Au moment de la création, le registre npm était inaccessible (ENOTFOUND) : l’installation et le rendu Remotion restent à vérifier sur une connexion fonctionnelle. Les scripts de préparation, les 21 configurations et la génération WAV ont été exécutés avec succès.

## Références

- [Rendu Remotion](https://www.remotion.dev/docs/render)
- [Licence Remotion](https://www.remotion.dev/license)
- [API voix ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)

## Première vidéo — version gameplay

`01-decoupe-37` utilise maintenant une composition dédiée qui réutilise le Canvas du jeu et un scénario validé par le moteur de production. Voir [le détail de cette version](videos/01-decoupe-37/README.md). Les 20 autres compositions restent des storyboards. La première installation npm a depuis réussi et le Studio a été démarré ; le paragraphe historique sur l’échec réseau décrit uniquement l’état lors de la création initiale.

Sur macOS 12, l’export de la première vidéo passe automatiquement par une séquence d’images et un encodage FFmpeg statique : les binaires multimédias livrés avec cette version de Remotion ne chargent pas sur cette version de macOS. Cette voie conserve le mixage musique/effets de la composition Découpe. Le fallback audio actuel est spécifique à cette composition ; les autres restent à adapter avant export sur macOS 12. Les deux outils statiques sont des dépendances de développement épinglées. La préparation de la démo utilise aussi les dépendances de l’API du repo (`npm install` à la racine si elles ne sont pas déjà installées).

## Reprise du 31 octobre 2026

Premier lot : `01-decoupe-37`, `02-braquage-butins`, `03-baffe-et-butins`,
`04-revanche-cantine`. Les trois dernières utilisent le moteur serveur de la Cantine
et son Canvas partagé, sans duplication de gameplay. `npm run prepare` régénère
les snapshots via `scripts/snack-demo.mjs` (fichier généré ignoré par Git).

Le lot est sans musique ni voix ; aucun crédit externe n’est utilisé. Les trois
vidéos Cantine et Chef Couic fonctionnent avec l’encodage muet sur macOS 12.
Les autres compositions conservent leur état de storyboard historique.
