# Validation de l’habillage immersif — 27 octobre 2026

Version locale compilée : `index-DFUI00_O.js`, CSS `index-rG6GnkeJ.css`.

## Périmètre

- TypeScript et compilation de production : `npm --prefix web run build`.
- Dix jeux en français sur Chromium ordinateur 1280 × 900 et mobile ramené à 320 × 740 : entrée en partie, titre sans débordement, canvas dessiné, commandes dans la fenêtre et non recouvertes, sortie vers le briefing, absence d’erreur JavaScript.
- Création d’un tournoi et accès aux préréglages de taille.
- Pif Paf : solo contre bot, choix secrets en duel, effets banane/poêle, historique et export réels.
- Bagarre de Table : glisser réel, physique, trois bots déclarés en solo, deux humains en duel, résultat et replay.
- Tour de Trop : trois placements parfaits réels et bouée, sans points inventés.
- Nouveau test d’immersion : écran de 650 px de haut, préférence de réduction des mouvements, résolution Canvas bornée à 2× et correspondance entre pointeur, marge latérale et commande de pilotage du pigeon.

## Captures de la version finale

- [Pigeon sur ordinateur](immersion/pigeon-1280.png)
- [Ascenseur sur mobile](immersion/lift-390.png)
- [Pif Paf sur mobile](immersion/garde-390.png)
- [Bombe sur ordinateur](immersion/bombpass-1280.png)

Ces quatre captures proviennent du serveur de développement local avec l’API réelle locale ; aucune erreur JavaScript observée pendant ces sessions. Le serveur compilé sur le port 8787 sert également le nouvel asset.

## Réserve de mesure

Un premier passage intermédiaire donnait 19 contrôles d’affichage réussis sur 20 : le clic d’entrée des toilettes sur mobile laissait le briefing affiché. Ce résultat est conservé dans `/tmp/slaptax-immersion-layout.log`. Il ne s’est pas reproduit au passage final ; aucune correction de moteur n’est attribuée à cet échec isolé.

Cette passe ne constitue pas un benchmark de fluidité sur appareils physiques ni un test de rétention. Les suites backend et les anciens scénarios des jeux archivés ne sont pas réexécutés pour ce changement de présentation.

## Résultat final

- Compilation de production : réussie ; `git diff --check` : réussi.
- Série finale : **33/34 réussis** en 7,4 min. Le test mobile de trois placements parfaits a raté sa première fenêtre de timing ; tous les tests d’affichage des dix jeux, les deux nouveaux tests d’immersion et les parties solo/duel de Pif Paf et Bagarre de Table ont réussi.
- Correction du pilote de `tower-combo.spec.ts` : observation des états réels dans le navigateur et clic DOM dans sa boucle d’affichage, avec la fonction de prédiction déjà utilisée par le jeu. Aucun état ni point injecté, seuil de réussite inchangé côté serveur.
- Relance ciblée après correction : **2/2 réussis** sur ordinateur et mobile en 34,5 s (`/tmp/slaptax-immersion-tower-fixed.log`). Les **34 scénarios distincts** sont ainsi validés entre la série finale et cette relance ; aucune affirmation de série complète 34/34 en un seul passage.
