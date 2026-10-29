# Troisième lot — Tour de Trop

## Livré

La bouée gagnée après trois placements parfaits garde sa protection contre un raté. Le joueur peut maintenant la dépenser pour élargir le sommet de 12 % du terrain, sans dépasser la largeur initiale. Ce choix ne rapporte ni bloc ni point. Une réparation consomme la bouée, coupe la série de parfaits et relance le mouvement ; la limite de 180 ms avant un nouveau placement reste appliquée. Une bouée dépensée ne se regagne pas.

Les zones du bloc hors du sommet sont teintées de rouge ; le chevauchement conservé est vert, le parfait doré. La largeur restante est affichée en pourcentage de la largeur initiale. Les blocs gardent leurs visages cartoon et la grue suit leur vraie position.

Le serveur applique la même commande aux entraînements, défis partagés, duels et matchs de tournoi. Entraînement et défi partagé réutilisent le même composant de protection/réparation. Les règles de score, de classement, de conversion en maîtrise et de jetons restent inchangées.

## Vérifié

- 325 tests serveur passés, dont la réparation réelle après trois parfaits, la consommation unique, l’absence de points/blocs créés, les limites de largeur et de terrain, la pause, les commandes invalides, la persistance du défi partagé et son portefeuille inchangé.
- 15 tests unitaires frontend passés, dont le retour de réparation fondé sur le compteur serveur, sans score inventé.
- 6 parcours PC/mobile passés dans la campagne finale : publication/reprise d’un défi de score, trois parfaits puis réparation et sécurisation en entraînement, même réparation/sécurisation en défi partagé. Géométrie du canvas et des boutons vérifiée sur 320 × 650, sans débordement horizontal ni erreur JS pendant ces parcours.
- En défi partagé, les préconditions de précision sont préparées par de vraies commandes HTTP aux positions calculées du serveur ; la réparation et la sécurisation sont effectuées avec les boutons réels, par toucher sur mobile. Le placement par bouton reste couvert par le parcours de défi simple. Aucun état ni score n’est injecté.
- Build web et mobile réussi ; parité Android/iOS vérifiée (`b3eb9d370273`). Configuration iOS valide ; assets synchronisés, compilation iOS non réalisée faute de Xcode compatible.
- Android : APK debug et AAB release compilés. Manifestes embarqués comparés au bundle commun, binaires copiés dans `mobile/artifacts/` et empreintes SHA-256 consignées dans `manifest.json`. AAB non signé ; aucune publication réalisée.
- Captures : [entraînement PC](captures/tower-practice-pc.png), [entraînement mobile](captures/tower-practice-mobile-650.png), [défi PC](captures/tower-shared-pc.png), [défi mobile](captures/tower-shared-mobile-650.png).

## Limites

Tour de Trop reste un bonus de précision et de prise de risque. Les tests automatisés ne prouvent ni l’équilibrage avec des joueurs ni une amélioration de rétention. La refonte de la bombe en groupe et les autres lignes restantes de DECISIONS.md ne sont pas livrées par ce lot.

Le backend compatible doit accompagner le déploiement des clients. Synchroniser les assets mobiles n’est pas publier une application sur les stores.
