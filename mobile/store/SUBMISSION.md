# Dossier de soumission SlapTax

État : préparation technique ; aucune application n’est publiée sur un store.
Gignoski Games est un nom de studio proposé, sans société ni marque créée.

## Livrables et génération

- `metadata.json` : noms, sous-titres, textes courts et mots-clés FR/EN.
- `listing.fr.md` et `listing.en.md` : descriptions longues.
- `review-notes.md` : parcours de test et explication du modèle sans argent réel.
- Icônes et visuel promotionnel dans ce dossier ; vérifier les captures finales sur binaires.
- Workflow `Store candidate artifacts` : lancement manuel sur une révision de `main`
  déjà déployée, numéro de build positif et supérieur au dernier envoi.
- Android : produit un AAB signé avec la clé d’upload fournie ; aucun téléversement.
- iOS : produit une archive **pour appareil, non signée**. Ce n’est ni une IPA de
  distribution ni une app installable. Une équipe, signature et export Apple restent requis.

Les builds échouent si le backend ne correspond pas au commit ou si les pages
publiques sont indisponibles. Les tests navigateur et natifs de `mobile.yml`
doivent aussi être verts pour cette révision. L’archive candidate n’est pas une
preuve de validation sur téléphone physique ni de conformité acceptée par les stores.

## Configuration Android à faire une seule fois

Dans l’environnement GitHub `store-release`, fournir les secrets :
`ANDROID_UPLOAD_KEY_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`. La clé doit être une clé d’upload dont une sauvegarde
chiffrée est conservée par l’éditeur. Aucun secret n’est à commiter.

Le workflow décode la clé dans un fichier temporaire privé, construit puis efface
ce fichier, et conserve l’AAB seulement sept jours. Les secrets ne sont pas fournis
par les forks. Activer Play App Signing dans la console. Ne pas régénérer une clé
existante à chaque version. Aucun secret ni certificat n’a été créé par cette livraison.

## Ce qui nécessite le propriétaire

- [ ] Créer/vérifier les comptes Apple Developer et Google Play Console.
- [ ] Confirmer l’identité légale de l’éditeur et la disponibilité du nom/app ID.
- [ ] Fournir la clé d’upload Android et les certificats/profils/équipe Apple.
- [ ] Valider les durées réelles de conservation/sauvegardes chez l’hébergeur et
      renseigner l’exploitant réel dans la politique de confidentialité.
- [ ] Remplir les déclarations des stores et classifications d’âge depuis le binaire final.
- [ ] Organiser le traitement humain des signalements via le support et l’API admin.
- [ ] Effectuer les tests sur iPhone/Android physiques et les captures natives finales.
- [ ] Effectuer le test fermé Google si le type de compte le requiert.

Les formulaires ne doivent pas annoncer « aucune donnée collectée » : profils,
identifiants d’installation/session, résultats/replays et interactions sont stockés.
Pas de publicité, achat de jetons, retrait, paiement ou prix monétaire actuellement.
Ne pas déclarer l’app comme destinée aux enfants sans revue spécifique du produit,
de la modération et de la collecte. Ne pas inventer de classification d’âge.

## Cinq captures à réaliser sur le binaire final

1. « Trois caisses. Un pote à battre. » : vraie Cantine en action, commandes et dépôt visibles.
2. « Un stick. Une baffe. » : porteur intercepté, avec personnage et objectif lisibles.
3. « Le casse continue. » : fiche d’atelier puis gameplay réel, sans fausse fonctionnalité.
4. « Vos comptes se règlent ici. » : vrai verdict et revanche, pseudos de test consentis.
5. « Quatre amis. Zéro calme. » : salon puis partie réelle à quatre, bots non déguisés en humains.

Éviter les captures de panne, secrets d’invitation, soldes inventés et promesses de
viralité. Les images d’émulation web existantes servent à la QA, pas à prétendre
qu’un binaire store a été testé sur appareil.

Références officielles vérifiées le 30 octobre 2026 :
[Apple Review](https://developer.apple.com/app-store/review/guidelines/),
[confidentialité Apple](https://developer.apple.com/app-store/app-privacy-details/),
[suppression Apple](https://developer.apple.com/support/offering-account-deletion-in-your-app/),
[test fermé Google](https://support.google.com/googleplay/android-developer/answer/14151465).
