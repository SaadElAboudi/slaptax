# Incident Poule Position — complément du 30 octobre 2026

Signalement : jeu probablement « Poultry Panic / Poule Position », erreur sur iPhone/Safari, puis défaite affichée à l’autre joueur sur Android/Chrome. Le lien du défi, sa révision exacte, la version d’iOS et le message d’erreur ne sont pas disponibles.

Ce sens du résultat ne suffit pas à confirmer l’explication initiale par forfait : le mécanisme précédent aurait normalement fait perdre le joueur déconnecté. Le correctif de remboursement publié reste utile, mais le plantage précis n’est pas considéré comme reproduit.

La validation antérieure du navigateur mobile utilisait Chromium ; compiler iOS ne valide pas Safari. Une suite dédiée associe désormais une page WebKit avec un profil iPhone et une page Chromium avec un profil Android dans le même défi, avec deux identités et deux sessions distinctes :

1. Rendu du poulet et d’un œuf, puis erreur de dessin provoquée côté WebKit : annulation, aucun gagnant, aucun paiement de victoire et deux mises restituées. Android ne doit pas afficher une défaite.
2. Même vérification avec le joueur Android interrompu et les rôles challenger/opposant inversés.
3. Partie jouée avec le joueur WebKit en position d’opposant : livraisons réelles, identité du gagnant, état victoire/défaite de chaque écran et soldes validés contre le résultat serveur.

Le chemin de compatibilité `roundRect` est également exercé côté WebKit. Ces scénarios provoquent une panne contrôlée ; ils ne constituent pas le journal de l’incident réel.

Exécution : `APP_DISTRIBUTION=store npx playwright test --config=playwright.mixed-mobile.config.ts` depuis `web`, après construction du site avec des origines API publiques vides et installation de Chromium/WebKit. Le workflow `Mixed mobile browser validation` utilise Ubuntu 24.04 et publie un rapport avec captures.

WebKit sur un runner Linux n’est pas un iPhone physique. Les limitations réseau, mémoire et système d’iOS nécessitent encore une vérification sur l’appareil concerné. Seuls les tests et leur configuration changent dans ce complément ; les résultats de CI sont vérifiés avant toute annonce de réussite.

## Écran bleu signalé

Le joueur précise que Safari affichait un écran bleu sans message. Une indisponibilité silencieuse de `getContext('2d')` laissait effectivement tourner la boucle sans dessin. Ce cas déclenche désormais la récupération visible et la fermeture de connexion, suivie de l’annulation et du remboursement par le serveur. La mise en arrière-plan reste une pause normale. Les tests d’entrée Chromium et de panne WebKit injectent maintenant un contexte nul ; le scénario Android conserve une exception. Cette faiblesse est reproductible par injection, mais la cause du signalement sur appareil reste non confirmée.
