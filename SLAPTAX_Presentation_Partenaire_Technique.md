# SLAP$TAX - Presentation Partenaire Technique

Version: 1.0  
Date: 21 mai 2026  
Document de cadrage technique (haut niveau)

## 1. Objectif du document

Presenter l'architecture cible, les contraintes techniques et les lots de livraison pour construire SLAP$TAX de facon fiable, securisee et evolutive.

## 2. Perimetre produit

### 2.1 Modes de jeu
- Mode Defi Direct: 1v1, Bo3, ban/pick, resolution instantanee.
- Mode Tournoi: bracket elimination directe, orchestration par rounds.

### 2.2 Domaines fonctionnels
- Authentification + profil joueur.
- Matchmaking et invitation sociale.
- Moteur de partie (etat, score, anti-cheat de base).
- Stats joueurs et historique.
- Wallet et transactions (via PSP).
- Moderation, support et litiges.

## 3. Exigences non fonctionnelles

- Disponibilite cible: 99.9% sur les services critiques.
- Latence cible: interactions de jeu < 150 ms percues sur actions critiques.
- Tracabilite: journalisation complete des actions match/paiement.
- Securite: chiffrement en transit et au repos.
- Scalabilite: montee en charge sur pics de tournois.

## 4. Architecture cible (reference)

### 4.1 Frontend
- App mobile cross-platform (Flutter ou React Native).
- UI temps reel via WebSocket ou canal temps reel gere.

### 4.2 Backend (services)
- API Gateway.
- Service Auth/Users.
- Service Match/Gameplay.
- Service Tournament Orchestrator.
- Service Stats/Ranking.
- Service Payments Adapter (PSP).
- Service Notifications.

### 4.3 Data
- Base transactionnelle (PostgreSQL) pour comptes, matchs, tournois.
- Cache (Redis) pour etats de session et leaderboard chaud.
- Data warehouse/BI pour analytics produit et fraude.

### 4.4 Infra
- Cloud manage (AWS/GCP/Azure), IaC, environnements dev/staging/prod.
- CI/CD avec tests auto, quality gates et deploiement progressif.

## 5. Moteur gameplay

## 5.1 Defi direct
- Creation duel -> escrow logique des mises -> ban/pick -> Bo3 -> settlement.
- Regles de timeout et forfait explicites.
- Determinisme du resultat cote serveur.

## 5.2 Tournoi
- Creation bracket (puissance de 2).
- Assignation du mini-jeu par round.
- Validation des resultats par duel.
- Progression automatique vers le round suivant.

## 5.3 Integrite des matchs
- Horodatage des evenements.
- Verification des scores cote serveur.
- Detection des patterns anormaux (suspicion bot/collusion).

## 6. Paiement, wallet et compliance

## 6.1 Principe
- Ne pas porter soi-meme la licence paiement au depart.
- Integrer un PSP avec wallet, KYC et flux de payout.

## 6.2 Flux critiques
- Cash-in utilisateur.
- Reserve/escrow de mise.
- Settlement winner/loser.
- Cash-out avec controles.

## 6.3 Conformite
- KYC par palier.
- AML basique + score de risque.
- Journal d'audit complet exportable.

## 7. Securite et anti-fraude

- Rate limiting et protection API.
- Device fingerprinting (selon cadre legal local).
- Detection multi-comptes.
- Regles anti-collusion en tournoi.
- Monitoring chargeback et contestation.

## 8. Observabilite et qualite

- Metrics: latence, taux erreur, conversion, echec paiement.
- Logs structures et traces distribuees.
- Alerting SRE sur services critiques.
- Tableaux de bord produit + technique partages.

## 9. Plan de livraison (roadmap technique)

### Lot A (0-8 semaines)
- Fondations: auth, profils, defi sans argent reel, 3-5 mini-jeux.
- Instrumentation analytics de base.

### Lot B (8-16 semaines)
- Ban/pick complet, stats joueurs, historique, tournoi v1.
- Renforcement anti-cheat de base.

### Lot C (16-24 semaines)
- Integration PSP, wallet, KYC minimum, flux de settlement.
- Beta publique encadree.

### Lot D (24+ semaines)
- Scalabilite, anti-fraude avance, segmentation niveau, operations live.

## 10. Definition of done (partenaire technique)

- SLO respects sur environnement prod.
- Scenarios critiques testes (match, tournoi, paiement, litige).
- Security review validee.
- Playbooks incident et support operationnels.
- Documentation API et runbooks livres.

## 11. Attentes vis-a-vis du partenaire

- Capacite a livrer vite sans sacrifier la fiabilite.
- Experience reelle en temps reel + paiements + anti-fraude.
- Culture produit (iteration, instrumentation, experimentation).
- Gouvernance claire: rituels, ownership, transparence.

## 12. Conclusion

SLAP$TAX n'est pas seulement un jeu mobile: c'est un systeme transactionnel competitif en temps reel. La qualite de l'architecture et de l'execution technique determinera directement:
- la confiance utilisateur,
- la performance business,
- et la capacite a scaler sans risque majeur.