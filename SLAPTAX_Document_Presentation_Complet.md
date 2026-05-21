# SLAP$TAX - Document de presentation complet

Version: 1.0  
Date: 21 mai 2026  
Statut: Confidentiel (draft de presentation)

## 1. Executive Summary

SLAP$TAX est une application mobile de competition sociale entre amis, basee sur des mini-jeux d'adresse, avec deux modes principaux:
- Mode Tournoi (bracket elimination directe).
- Mode Defi Direct (1v1 en Best of 3 avec systeme ban/pick).

Le projet combine:
- Une boucle produit virale (defier un ami = invitation naturelle).
- Une monetisation simple (commission sur les mises/cagnottes).
- Une identite de marque forte (street, competitif, assumee).

La proposition de valeur est claire: transformer la rivalite amicale en experience de jeu repetitive, partageable et potentiellement monisable.

## 2. Vision et positionnement

### 2.1 Vision

Transformer les moments sociaux du quotidien (soirees, pauses, trajets) en arenas de competition courtes, intenses et memorables.

### 2.2 Promesse produit

"Tape. Encaisse. Encaisse encore."  
SLAP$TAX propose une experience immediate:
- Enjeu clair (fierte + argent ou credits).
- Resultat rapide.
- Rejouabilite elevee.

### 2.3 Positionnement marche

SLAP$TAX ne se positionne pas comme un simple jeu mobile casual. Le produit est au croisement de:
- Mini-jeux d'adresse.
- Social gaming entre amis.
- Logique competitive inspiree de l'e-sport (ban/pick, meta, stats).

## 3. Probleme adresse

Aujourd'hui, beaucoup d'apps permettent de jouer, tres peu transforment ces parties en rivalite sociale structuree avec:
- Un enjeu tangible.
- Une vraie profondeur strategique.
- Une boucle de revanche instantanee entre proches.

SLAP$TAX repond a ce manque via:
- Des affrontements courts et lisibles.
- Une structure de confrontation equitable.
- Une couche sociale native (potes, challenge, historique, classement).

## 4. Solution produit

## 4.1 Les 2 modes coeur

### Mode Tournoi
- Entree fixe par joueur.
- Bracket elimination directe (puissance de 2: 8, 16, 32, ...).
- Meme mini-jeu pour tous les duels d'un meme round (equite des conditions).
- Le vainqueur final remporte l'essentiel de la cagnotte.

### Mode Defi Direct
- Duel 1v1 en Best of 3.
- Chaque joueur mise une somme.
- Selection des 3 jeux via ban/pick.
- Le gagnant 2/3 remporte la mise combinee (moins commission).

## 4.2 Mecanique differenciante: Ban/Pick

Le ban/pick est la signature strategique du produit:
- Les joueurs consultent les stats de l'adversaire par mini-jeu.
- Ils bannissent des jeux pour couper les forces adverses.
- Ils selectionnent ensuite l'ordre des jeux du Bo3.

Impact business et retention:
- Augmente la profondeur sans complexifier les mini-jeux.
- Cree un "meta-game" avant la partie.
- Favorise la revanche ("la prochaine fois je ban diff") et donc la frequence d'usage.

## 4.3 Catalogue de mini-jeux

Le concept vise environ 20 mini-jeux couvrant plusieurs profils:
- Reflexes.
- Memoire.
- Precision tactile.
- Timing/rythme.
- Culture/quiz.
- Strategie rapide.
- Endurance mentale.

Strategie de lancement recommandee:
- V0: 5 a 8 mini-jeux tres solides.
- Extensions progressives pour soutenir la retention long terme.

## 5. Experience utilisateur (UX/UI)

Cette section s'appuie sur `slapbattle.html` (prototype d'interface).

### 5.1 Direction artistique

Le prototype pose une identite forte et coherente:
- Univers visuel: noir / jaune / orange / rouge (energie, danger, impact).
- Typographies expressives et "street-fight".
- Vocabulaire UI assume: "Fight", "GIFLE-LE", "RICO EST DOWN".
- Effets dynamiques: flash, overlays, ticker live, animations de hit.

Ce parti-pris cree:
- Une memorabilite immediate.
- Un ton de marque differenciant.
- Un sentiment d'intensite meme sur des interactions simples.

### 5.2 Parcours d'une session type

1. Le joueur ouvre l'app et voit l'arene (duel en cours).  
2. Il choisit sa mise (2/5/10/20 EUR dans le prototype).  
3. Il lance l'action principale (bouton central de slap).  
4. Il suit l'evolution du duel via HP, feedback visuel et messages live.  
5. Il consulte les derniers combats et navigue vers classement, potes, wallet.

### 5.3 Forces UX observees

- CTA principal ultra lisible.
- Feedback instantane (barres de vie, mots d'impact, animation).
- Lisibilite du risque/recompense (pot total, gain net apres frais).
- Structure mobile-first pertinente.

### 5.4 Points a cadrer pour la prod

- Accessibilite: contraste, alternatives aux animations intenses, tailles dynamiques.
- Clarte legal/compliance dans les ecrans wallet et mise.
- Internationalisation des textes.
- Garde-fous UX anti-sur-engagement (limites, pauses, alerts).

## 6. Modele economique

## 6.1 Revenus

Le modele est base sur commission:
- Tournoi: environ 6% a 8% sur la cagnotte.
- Defi Direct: environ 12% a 15% sur la mise combinee.

Pas de dependance forte a:
- Publicite intrusive.
- Abonnement obligatoire.

## 6.2 Exemples de calcul

### Tournoi 1 024 joueurs a 5 EUR
- Entrees: 1 024 x 5 = 5 120 EUR
- Prize pool net: 4 800 EUR
- Frais plateforme: 320 EUR (6,25%)

### Defi direct 10 EUR vs 10 EUR
- Pot: 20 EUR
- Commission 15%: 3 EUR
- Gain net vainqueur: 17 EUR

## 6.3 Pourquoi le modele peut scaler

- Chaque partie monetaire genere un revenu direct.
- Le produit est socialement viral par nature.
- Le mode Defi cree de la frequence; le mode Tournoi cree des pics d'intensite.

## 7. Legal, compliance et paiements

Important: cette section est une synthese produit, pas un avis juridique.

## 7.1 Enjeu principal

Le succes du projet depend de la qualification legale du produit:
- Jeu de hasard (fortement regule) vs jeu d'adresse/competence.

## 7.2 Positionnement favorable de SLAP$TAX

Elements qui renforcent la these "competence":
- Resultat fonde sur la performance du joueur.
- Conditions de jeu transparentes et identiques.
- Plateforme non-adversaire (commission fixe, pas "la maison").
- Couches strategiques (ban/pick + stats).

## 7.3 Chantiers obligatoires avant argent reel

- Audit avec avocat specialiste jeux/fintech.
- Validation mini-jeu par mini-jeu (poids du hasard).
- Infrastructure paiements via PSP/partenaire agree.
- KYC/AML (verif identite, lutte fraude/blanchiment).
- Politique jeu responsable (limites, auto-exclusion, prevention).
- CGU/CGP et processus de litiges.

## 7.4 Strategie de reduction du risque

Lancement en 2 temps:
- Etape 1: version sans argent reel (credits non convertibles).
- Etape 2: bascule progressive vers real-money apres verrou legal/compliance.

## 8. Strategie de go-to-market

## 8.1 Acquisition

- Viralite native via defis directs entre amis.
- Contenus partageables (highlights, streaks, upsets).
- Partenariats createurs gaming/lifestyle.

## 8.2 Activation

- Onboarding court + 1er duel en moins de 2 minutes.
- Incitation a inviter 1 pote rapidement.
- Templates de defis pre-remplis pour faciliter le premier usage.

## 8.3 Retention

- Systeme de revanche immediat.
- Rotation des mini-jeux et events ponctuels.
- Classements et progression visible.
- Meta-game ban/pick + stats.

## 9. Roadmap recommandee

### V0 (M1-M3)
- 5 a 8 mini-jeux.
- Mode Defi sans argent reel.
- Test ferme utilisateurs.

### V1 (M4-M6)
- Wallet via partenaire PSP.
- KYC de base.
- Lancement mode Tournoi.
- Beta publique encadree.

### V2 (M7-M12)
- 12 a 20 mini-jeux.
- Ban/pick complet + stats avancees.
- Sharing social + premiers partenariats createurs.

### V3 (M12+)
- Segmentation par niveau.
- Tournois sponsorises.
- Expansion geographique.

## 10. KPI de pilotage

## 10.1 Produit
- DAU/WAU.
- Matchs par utilisateur actif/semaine.
- Taux de revanche (rematch rate).
- Retention D1 / D7 / D30.

## 10.2 Business
- Volume de mises (GTV).
- Revenu net par mode (Tournoi vs Defi).
- ARPPU.
- Taux de conversion gratuit -> mise reelle.

## 10.3 Risque et qualite
- Taux de litiges paiements.
- Chargebacks.
- Taux de fraude/multi-compte detecte.
- Temps moyen de resolution support.

## 11. Risques majeurs et plans d'attenuation

## 11.1 Risque legal
- Risque: requalification reglementaire.
- Mitigation: audit legal en amont + lancement sans argent reel.

## 11.2 Risque fraude/collusion
- Risque: multi-comptes, arrangement de matchs, chargebacks.
- Mitigation: KYC robuste, detection d'anomalies, regles anti-collusion.

## 11.3 Risque retention
- Risque: essoufflement apres l'effet nouveaute.
- Mitigation: renouvellement contenu, saisons, events, meta evolutif.

## 11.4 Risque execution
- Risque: sous-estimation du cout/temps de production mini-jeux.
- Mitigation: focus qualite sur peu de jeux au depart + framework reutilisable.

## 12. Conclusion investisseur / partenaire

SLAP$TAX a un coeur produit fort:
- Concept simple a comprendre, difficile a copier dans son execution sociale.
- Signature UX claire et differenciante.
- Mecanique strategique (ban/pick) qui augmente la profondeur et la retention.

Le projet est prometteur si la trajectoire reste disciplinee:
- Product-market fit d'abord (version skill-first, sans cash-out initial).
- Legal/compliance ensuite (paiement, KYC, cadre juridique).
- Scaling enfin (catalogue, createurs, expansion).

En synthese: SLAP$TAX peut devenir une plateforme de competition sociale mobile de reference, a condition de traiter la compliance comme un pilier produit, pas comme une couche ajoutee apres coup.

## 13. Annexes (sources internes)

- Concept principal: `SLAPTAX_Concept.md`
- Prototype interface: `slapbattle.html`
- Script generation DOCX concept: `SLAPTAX_Concept_Code.txt`
