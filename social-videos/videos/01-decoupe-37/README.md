# 01 — Découpe 37 % : démonstration du gameplay

Version 2 : composition dédiée `src/DecoupeFilm.jsx`, visible dans le Studio sous `01-decoupe-37`. Durée : 15 s, 1080 × 1920, 30 fps.

La vidéo réutilise **le vrai renderer Canvas** `web/src/gameplay/drawing.ts`. La forme vient de `drawingTarget` et le résultat est validé par `actDrawing` dans `api/games/drawing.js`. Le scénario est déterministe et porte la mention « Démonstration animée ». Il ne s’agit ni d’une capture d’un joueur humain, ni d’un record.

## Découpage

- 0–2,7 s : forme visible immédiatement, cible 37 %, huit secondes disponibles ; essai 1/3.
- 2,7–4,5 s : un repère de contact trace la ligne ; le jeu prévisualise le côté sélectionné sans révéler son pourcentage.
- 4,5–6,5 s : toucher le côté gauche pour le garder ; validation anticipée avant la fin des huit secondes.
- 6,5–7 s : coupe verrouillée.
- 7–12 s : révélation de la surface, **43,3 %**, soit **6,3 points d’écart**. Ce résultat concerne un essai, pas l’issue d’une partie complète.
- 12–15 s : « Tu fais mieux ? » et invitation à jouer/défier un ami. Une partie comporte trois formes, rappelé à l’écran.

L’interface de la vidéo est adaptée au format social : typographie plus grande, cartes résultat lisibles et explications des gestes. Le plateau, la forme, les couleurs et la géométrie proviennent du jeu. Le bouton est illustratif, aucune interaction n’est possible dans le MP4.

## Son

Musique locale originale, abaissée à la révélation. Quatre effets synthétisés localement : tracé, sélection, verrouillage et révélation. Aucun sample ni service payant. Le script de voix est préparé dans `voiceover.txt` et `video.json` ; aucune voix ElevenLabs générée. La vidéo peut être comprise sans voix grâce aux textes synchronisés avec les gestes.

## Reproduire

Depuis `social-videos/` :

```bash
npm run prepare
npm run studio
npm run render -- 01-decoupe-37
```

Export : `exports/01-decoupe-37/draft.mp4`. Le script utilise un navigateur Playwright déjà installé sur macOS s’il existe ; sinon Remotion utilise son installation habituelle. `REMOTION_BROWSER_EXECUTABLE` permet de choisir explicitement un navigateur compatible.

Le mode `--publish` reste réservé aux captures et configurations approuvées. Cette démonstration reste sous statut `demo`, sans publication automatique.

## Contrôle éditorial

- Calcul reproduit par le moteur de production, sans valeur de score inventée.
- Validation du côté conservé, absence de pourcentage prédit avant la révélation.
- Aucun gain monétaire, joueur réel ou record revendiqué.
- Avant publication : renseigner le vrai lien du profil, revoir les zones recouvertes par l’application et écouter le mixage sur téléphone.

Reprise du 31 octobre : export sans musique, voix ni effets. La sélection du
morceau sert directement la portion, conformément au geste simplifié actuel.
Le résultat est issu du moteur ; il ne représente pas une performance humaine.
