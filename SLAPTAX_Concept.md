# SLAP$TAX — Générateur DOCX

Ce fichier contient le script JavaScript complet permettant de générer automatiquement le document DOCX de présentation du concept SLAP$TAX avec la librairie `docx`.

## Script

```js
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, Header
} = require('docx');
const fs = require('fs');

const BRAND = "1A1A2E";
const ACCENT = "FF5C00";
const YELLOW = "FFE600";
const LIGHT_BG = "F5F5F0";
const LIGHT_ACCENT = "FFF3E8";
const BORDER_COLOR = "DDDDDD";
const TEXT_DARK = "1A1A1A";
const TEXT_MID = "444444";
const TEXT_LIGHT = "888888";

const cellBorder = (color) => ({
  top: { style: BorderStyle.SINGLE, size: 4, color },
  bottom: { style: BorderStyle.SINGLE, size: 4, color },
  left: { style: BorderStyle.SINGLE, size: 4, color },
  right: { style: BorderStyle.SINGLE, size: 4, color },
});

const noBorder = {
  top: { style: BorderStyle.NIL },
  bottom: { style: BorderStyle.NIL },
  left: { style: BorderStyle.NIL },
  right: { style: BorderStyle.NIL },
};

const spacer = (pt = 12) => new Paragraph({
  children: [new TextRun("")],
  spacing: { before: 0, after: pt * 20 },
});

const rule = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
  spacing: { before: 0, after: 200 },
  children: [],
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font: "Arial", size: 40, bold: true, color: TEXT_DARK })],
  spacing: { before: 480, after: 160 },
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: ACCENT })],
  spacing: { before: 360, after: 120 },
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: TEXT_DARK })],
  spacing: { before: 240, after: 80 },
});

const body = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, font: "Arial", size: 22, color: TEXT_DARK, ...opts })],
  spacing: { before: 0, after: 160 },
});

const bodyBold = (text) => body(text, { bold: true });

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  children: [new TextRun({ text, font: "Arial", size: 22, color: TEXT_DARK })],
  spacing: { before: 0, after: 80 },
});

const qBox = (q, a) => {
  const rows = [
    new TableRow({
      children: [new TableCell({
        borders: cellBorder(ACCENT),
        shading: { fill: "FFF3E8", type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 80, left: 160, right: 160 },
        width: { size: 9360, type: WidthType.DXA },
        children: [new Paragraph({
          children: [
            new TextRun({ text: "❓  ", font: "Arial", size: 22, bold: true, color: ACCENT }),
            new TextRun({ text: q, font: "Arial", size: 22, bold: true, color: ACCENT }),
          ],
          spacing: { before: 0, after: 0 },
        })],
      })],
    }),
    new TableRow({
      children: [new TableCell({
        borders: cellBorder(BORDER_COLOR),
        shading: { fill: "FAFAF8", type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        width: { size: 9360, type: WidthType.DXA },
        children: a.map(line =>
          new Paragraph({
            children: [new TextRun({ text: line, font: "Arial", size: 22, color: TEXT_DARK })],
            spacing: { before: 0, after: 80 },
          })
        ),
      })],
    }),
  ];
  return [
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows,
    }),
    spacer(10),
  ];
};

const infoBox = (label, lines, fillColor = LIGHT_BG) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      borders: cellBorder(BORDER_COLOR),
      shading: { fill: fillColor, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      width: { size: 9360, type: WidthType.DXA },
      children: [
        new Paragraph({
          children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: TEXT_LIGHT })],
          spacing: { before: 0, after: 80 },
        }),
        ...lines.map(l => new Paragraph({
          children: [new TextRun({ text: l, font: "Arial", size: 22, color: TEXT_DARK })],
          spacing: { before: 0, after: 60 },
        })),
      ],
    })],
  })],
});

const twoCol = (left, right, leftColor = LIGHT_BG, rightColor = LIGHT_BG) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [4600, 4760],
  rows: [new TableRow({
    children: [
      new TableCell({
        borders: cellBorder(BORDER_COLOR),
        shading: { fill: leftColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        width: { size: 4600, type: WidthType.DXA },
        children: left.map(l => new Paragraph({
          children: [new TextRun({ text: l, font: "Arial", size: 22, color: TEXT_DARK })],
          spacing: { before: 0, after: 80 },
        })),
      }),
      new TableCell({
        borders: cellBorder(BORDER_COLOR),
        shading: { fill: rightColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        width: { size: 4760, type: WidthType.DXA },
        children: right.map(l => new Paragraph({
          children: [new TextRun({ text: l, font: "Arial", size: 22, color: TEXT_DARK })],
          spacing: { before: 0, after: 80 },
        })),
      }),
    ],
  })],
});

// ──────────────────────────────────────────────
// DOCUMENT
// ──────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "–",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } },
        }],
      },
      {
        reference: "subbullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "·",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1000, hanging: 280 } } },
        }],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, font: "Arial", color: TEXT_DARK },
        paragraph: { spacing: { before: 480, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: TEXT_DARK },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "SLAP$TAX — Document confidentiel · ", font: "Arial", size: 18, color: TEXT_LIGHT }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: TEXT_LIGHT }),
          ],
        })],
      }),
    },
    children: [

      // ═══════════════════════════════════════
      // COVER
      // ═══════════════════════════════════════
      spacer(60),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "SLAP$TAX", font: "Arial", size: 80, bold: true, color: TEXT_DARK })],
        spacing: { before: 0, after: 160 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Tape. Encaisse. Encaisse encore.", font: "Arial", size: 30, color: ACCENT, italics: true })],
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Document de présentation du concept · V1.0 · Confidentiel", font: "Arial", size: 20, color: TEXT_LIGHT })],
        spacing: { before: 0, after: 600 },
      }),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2200, 2200, 2200, 2426],
        rows: [new TableRow({
          children: [
            new TableCell({
              borders: cellBorder(BORDER_COLOR),
              shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
              margins: { top: 120, bottom: 120, left: 160, right: 160 },
              width: { size: 2200, type: WidthType.DXA },
              children: [
                new Paragraph({ children: [new TextRun({ text: "CONCEPT", font: "Arial", size: 18, bold: true, color: TEXT_LIGHT })], spacing: { before: 0, after: 60 } }),
                new Paragraph({ children: [new TextRun({ text: "Mini-jeux compétitifs", font: "Arial", size: 20, color: TEXT_DARK })], spacing: { before: 0, after: 0 } }),
              ],
            }),
            new TableCell({
              borders: cellBorder(BORDER_COLOR),
              shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
              margins: { top: 120, bottom: 120, left: 160, right: 160 },
              width: { size: 2200, type: WidthType.DXA },
              children: [
                new Paragraph({ children: [new TextRun({ text: "MODELE", font: "Arial", size: 18, bold: true, color: TEXT_LIGHT })], spacing: { before: 0, after: 60 } }),
                new Paragraph({ children: [new TextRun({ text: "Tournoi + Défi direct", font: "Arial", size: 20, color: TEXT_DARK })], spacing: { before: 0, after: 0 } }),
              ],
            }),
            new TableCell({
              borders: cellBorder(BORDER_COLOR),
              shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
              margins: { top: 120, bottom: 120, left: 160, right: 160 },
              width: { size: 2200, type: WidthType.DXA },
              children: [
                new Paragraph({ children: [new TextRun({ text: "ENTREE", font: "Arial", size: 18, bold: true, color: TEXT_LIGHT })], spacing: { before: 0, after: 60 } }),
                new Paragraph({ children: [new TextRun({ text: "Dès 5 € par joueur", font: "Arial", size: 20, color: TEXT_DARK })], spacing: { before: 0, after: 0 } }),
              ],
            }),
            new TableCell({
              borders: cellBorder(BORDER_COLOR),
              shading: { fill: "FFF3E8", type: ShadingType.CLEAR },
              margins: { top: 120, bottom: 120, left: 160, right: 160 },
              width: { size: 2426, type: WidthType.DXA },
              children: [
                new Paragraph({ children: [new TextRun({ text: "PRIZE POOL MAX", font: "Arial", size: 18, bold: true, color: ACCENT })], spacing: { before: 0, after: 60 } }),
                new Paragraph({ children: [new TextRun({ text: "4 800 € par tournoi", font: "Arial", size: 20, bold: true, color: ACCENT })], spacing: { before: 0, after: 0 } }),
              ],
            }),
          ],
        })],
      }),

      spacer(40),
      rule(),

      // ═══════════════════════════════════════
      // 1. VISION
      // ═══════════════════════════════════════
      h1("1. Vision & Concept"),
      body("SLAP$TAX est une application mobile de compétition sociale entre amis. L'idée centrale : transformer n'importe quelle soirée ou retrouvaille en arène de mini-jeux compétitifs où la fierté — et un peu d'argent — est en jeu."),
      body("L'application s'adresse à une génération qui consomme du contenu compétitif (jeux vidéo, battle royale, TikTok challenges) mais qui veut aussi du lien réel avec ses proches. SLAP$TAX crée ce pont : la tension d'un enjeu financier, le fun d'un jeu casual, la viralité d'un défi entre potes."),
      spacer(8),
      infoBox("EN UNE PHRASE", [
        "\"L'app qui permet de raquetter ses amis de manière légale, fun et compétitive — avec la vibe d'un tournoi street.\"",
      ], LIGHT_ACCENT),
      spacer(8),

      h2("Les deux piliers du produit"),
      twoCol(
        ["🏆  MODE TOURNOI", "", "Un prize pool commun. Tous les joueurs payent une entrée fixe. Le vainqueur du bracket final remporte l'essentiel de la cagnotte. Chaque round du tournoi propose le même mini-jeu à tous les participants simultanément — égalité absolue des conditions."],
        ["⚔️  MODE DÉFI DIRECT", "", "Tu défies un ami spécifique. Vous misez chacun une somme. La bataille se joue en Best of 3 sur des mini-jeux sélectionnés via un système de ban/pick stratégique. Le gagnant 2/3 emporte la mise."],
        LIGHT_BG, "FFF3E8"
      ),

      spacer(20),

      // ═══════════════════════════════════════
      // 2. GAMEPLAY
      // ═══════════════════════════════════════
      h1("2. Mécanique de jeu détaillée"),

      h2("2.1 — Le Mode Tournoi"),
      body("Le tournoi fonctionne en bracket à élimination directe, avec un nombre de participants qui doit être une puissance de deux (8, 16, 32, 64, 128, 256, 512, 1 024...)."),
      bullet("Le tournoi ne démarre que lorsque le nombre de participants requis est atteint."),
      bullet("À chaque round, tous les duels de ce round jouent le même mini-jeu — ce qui garantit l'équité et crée une expérience collective (tout le monde \"souffre\" sur le même jeu au même moment)."),
      bullet("Le mini-jeu change à chaque round, ce qui empêche la spécialisation excessive et maintient la surprise."),
      bullet("Les perdants sont éliminés. Les gagnants avancent. Jusqu'au champion."),
      spacer(8),

      infoBox("EXEMPLE — TOURNOI 1 024 JOUEURS À 5 €", [
        "Entrées :          1 024 × 5 € = 5 120 €",
        "Prize pool net :   4 800 € attribués au vainqueur",
        "Frais plateforme : 320 € (6,25 %)",
        "Nombre de rounds : 10 (2^10 = 1 024)",
        "Durée estimée :    selon le rythme des rounds",
      ], LIGHT_BG),
      spacer(8),

      h2("2.2 — Le Mode Défi Direct"),
      body("Deux joueurs s'affrontent en Best of 3. Le joueur qui remporte 2 jeux sur 3 gagne la mise combinée (moins les frais plateforme)."),
      body("La sélection des 3 jeux est le coeur stratégique du mode défi, via un système de ban/pick inspiré des compétitions e-sport professionnelles."),

      h3("Le système Ban/Pick"),
      body("Avant chaque défi, les deux joueurs disposent d'un catalogue de ~20 mini-jeux. Chacun peut consulter les statistiques de performance de l'adversaire sur chaque jeu."),
      bullet("La priorité de sélection est déterminée par le nombre de bans effectués lors des duels précédents : celui qui a le moins banni choisit en premier."),
      bullet("Séquence de sélection : Joueur A choisit Jeu 1 → Joueur B choisit Jeu 2 → Joueur A choisit Jeu 3."),
      bullet("Chaque joueur peut bannir des jeux du catalogue avant la sélection pour empêcher l'adversaire d'y accéder."),
      spacer(8),
      infoBox("POURQUOI C'EST MALIN", [
        "Si tu es fort sur de nombreux jeux, ton adversaire va beaucoup bannir — ce qui lui coûte sa priorité de sélection future.",
        "Être polyvalent est récompensé structurellement : tu forces l'adversaire à gaspiller ses bans.",
        "Les stats publiques créent un vrai meta-game de préparation et de contre-stratégie.",
      ], LIGHT_ACCENT),
      spacer(8),

      h2("2.3 — Le catalogue de mini-jeux"),
      body("L'application propose environ 20 mini-jeux couvrant des profils cognitifs et physiques variés, pour qu'aucun type de joueur ne soit universellement dominant."),
      spacer(8),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2800, 2200, 4026],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorder(ACCENT),
                shading: { fill: "FF5C00", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                width: { size: 2800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "CATÉGORIE", font: "Arial", size: 20, bold: true, color: "FFFFFF" })], spacing: { before: 0, after: 0 } })],
              }),
              new TableCell({
                borders: cellBorder(ACCENT),
                shading: { fill: "FF5C00", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                width: { size: 2200, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "EXEMPLES", font: "Arial", size: 20, bold: true, color: "FFFFFF" })], spacing: { before: 0, after: 0 } })],
              }),
              new TableCell({
                borders: cellBorder(ACCENT),
                shading: { fill: "FF5C00", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                width: { size: 4026, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "PROFIL FAVORISÉ", font: "Arial", size: 20, bold: true, color: "FFFFFF" })], spacing: { before: 0, after: 0 } })],
              }),
            ],
          }),
          ...[
            ["Réflexes purs", "Tap le plus vite, chrono de réaction", "Joueurs avec bons réflexes/gaming"],
            ["Mémoire visuelle", "Séquences de couleurs/sons, memory", "Concentration, calme"],
            ["Précision tactile", "Trajectoire, lancer, visée mobile", "Joueurs précis et posés"],
            ["Timing & rythme", "Jeux de rythme, synchronisation", "Musiciens, gamers rythme"],
            ["Culture & quiz", "Questions générales ou thématiques", "Curieux, bonne culture générale"],
            ["Stratégie rapide", "Choix sous pression, pierre-feuille-ciseaux évolué", "Profil analytique"],
            ["Endurance mentale", "Concentration longue durée, multitâche", "Personnes peu sensibles au stress"],
          ].map(([cat, ex, profil], i) =>
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorder(BORDER_COLOR),
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : "FFFFFF", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  width: { size: 2800, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: cat, font: "Arial", size: 20, bold: true, color: TEXT_DARK })], spacing: { before: 0, after: 0 } })],
                }),
                new TableCell({
                  borders: cellBorder(BORDER_COLOR),
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : "FFFFFF", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  width: { size: 2200, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: ex, font: "Arial", size: 20, color: TEXT_MID })], spacing: { before: 0, after: 0 } })],
                }),
                new TableCell({
                  borders: cellBorder(BORDER_COLOR),
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : "FFFFFF", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  width: { size: 4026, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: profil, font: "Arial", size: 20, color: TEXT_DARK })], spacing: { before: 0, after: 0 } })],
                }),
              ],
            })
          ),
        ],
      }),
      spacer(20),

      // ═══════════════════════════════════════
      // 3. MODELE ECONOMIQUE
      // ═══════════════════════════════════════
      h1("3. Modèle économique"),

      h2("3.1 — Sources de revenus"),
      body("Le modèle repose sur une commission prélevée sur chaque cagnotte, avant redistribution au gagnant. Il n'y a pas de publicité, pas d'abonnement — la plateforme gagne uniquement quand les joueurs jouent."),
      spacer(8),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 2200, 3826],
        rows: [
          new TableRow({
            tableHeader: true,
            children: ["SOURCE", "TAUX ENVISAGÉ", "NOTE"].map((t, i) =>
              new TableCell({
                borders: cellBorder(ACCENT),
                shading: { fill: "FF5C00", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                width: { size: [3000, 2200, 3826][i], type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: t, font: "Arial", size: 20, bold: true, color: "FFFFFF" })], spacing: { before: 0, after: 0 } })],
              })
            ),
          }),
          ...[
            ["Tournoi (frais entrée)", "~6-8 %", "Prélevé sur la cagnotte totale avant distribution"],
            ["Défi direct (commission)", "~12-15 %", "Prélevé sur la mise combinée gagnée"],
          ].map(([s, t, n], i) =>
            new TableRow({
              children: [s, t, n].map((text, j) =>
                new TableCell({
                  borders: cellBorder(BORDER_COLOR),
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : "FFFFFF", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  width: { size: [3000, 2200, 3826][j], type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20, color: j === 1 ? ACCENT : TEXT_DARK, bold: j === 1 })], spacing: { before: 0, after: 0 } })],
                })
              ),
            })
          ),
        ],
      }),
      spacer(16),

      h2("3.2 — Exemples chiffrés"),
      twoCol(
        ["🏆 Tournoi — 1 024 joueurs", "", "Entrées :  1 024 × 5 € = 5 120 €", "Frais (~6,25 %) :  320 €", "Prize pool :  4 800 €", "", "Avec 2 tournois/semaine → ~640 €/sem."],
        ["⚔️ Défi — 2 joueurs à 10 €", "", "Pot combiné :  20 €", "Frais (15 %) :  3 €", "Gain vainqueur :  17 €", "", "100 défis/jour → ~300 €/jour"],
        LIGHT_BG, "FFF3E8"
      ),
      spacer(20),

      // ═══════════════════════════════════════
      // 4. LÉGALITÉ
      // ═══════════════════════════════════════
      h1("4. Cadre légal & conformité"),

      body("C'est la question la plus importante à traiter en amont. Voici une analyse honnête de la situation, avec les risques et les leviers pour rendre le modèle viable légalement."),
      spacer(8),

      h2("4.1 — Le droit français des jeux d'argent"),
      body("En France, les jeux d'argent sont régulés par l'Autorité Nationale des Jeux (ANJ), issue de la loi du 12 mai 2010. La règle générale : opérer une plateforme où des joueurs misent de l'argent réel sans agrément est illégal."),
      body("La distinction clé en droit français est entre jeu de hasard (résultat aléatoire → fortement régulé) et jeu d'adresse ou de compétence (résultat principalement déterminé par le skill → traitement différencié selon les cas)."),
      spacer(8),

      infoBox("CRITÈRES QUI QUALIFIENT UN JEU D'ADRESSE (FAVORABLE)", [
        "Le résultat dépend principalement de la compétence du joueur, pas du hasard.",
        "Les règles sont transparentes et identiques pour tous.",
        "L'opérateur n'est pas adversaire du joueur (pas de \"maison\" qui gagne).",
        "Les joueurs se battent entre eux, l'opérateur ne prend qu'une commission fixe.",
      ], LIGHT_ACCENT),
      spacer(8),

      h2("4.2 — Positionnement de SLAP$TAX"),
      body("Le modèle de SLAP$TAX présente plusieurs arguments solides pour être qualifié de plateforme de compétition d'adresse plutôt que de jeu de hasard :"),
      bullet("Les mini-jeux testent des compétences cognitives et motrices réelles (réflexes, mémoire, précision, stratégie)."),
      bullet("Le système ban/pick implique une dimension stratégique pré-jeu qui renforce l'argument du skill."),
      bullet("La plateforme ne joue pas contre les utilisateurs : elle prend uniquement une commission fixe et transparente."),
      bullet("La structure de tournoi à élimination directe est le format standard des compétitions e-sport légales dans de nombreux pays."),
      spacer(8),

      infoBox("MODÈLES EXISTANTS QUI FONCTIONNENT LÉGALEMENT", [
        "Faceit, Battlefy, ESL (e-sport avec prize pools réels).",
        "Platforms de fantasy sport compétitif (DraftKings aux USA, certaines plateformes EU).",
        "Compétitions de jeux de cartes à entrée payante (poker de compétition dans certains cadres).",
      ], LIGHT_BG),
      spacer(8),

      h2("4.3 — Ce qui reste à valider"),
      body("Malgré un positionnement favorable, plusieurs points nécessitent une validation juridique formelle avant tout lancement :"),
      bullet("Consultation d'un avocat spécialisé en droit des jeux et fintech (obligatoire)."),
      bullet("Analyse jeu par jeu du catalogue : chaque mini-jeu doit être examiné pour s'assurer que la composante hasard n'est pas dominante."),
      bullet("Agrément de paiement : la collecte, la conservation et le reversement de fonds nécessite un statut réglementé (EME, établissement de paiement, ou partenariat avec un PSP agréé)."),
      bullet("Politique KYC/AML : vérification d'identité des utilisateurs, prévention du blanchiment d'argent — obligatoires pour tout opérateur manipulant des fonds tiers."),
      bullet("CGU et politique de jeu responsable : plafonds de mise, auto-exclusion, outils de contrôle."),
      spacer(20),

      // ═══════════════════════════════════════
      // 5. Q&A
      // ═══════════════════════════════════════
      h1("5. Questions & Réponses — Le document de clarification"),
      body("Ce chapitre anticipe toutes les questions que peuvent se poser des investisseurs, partenaires, amis, ou utilisateurs potentiels."),

      h2("5.1 — Sur le concept"),

      ...[
        [
          "C'est quoi concrètement l'expérience utilisateur ?",
          [
            "Tu télécharges l'app, tu crées un compte, tu alimentes ton wallet avec 10 ou 20 €.",
            "Tu peux lancer un défi à un ami en quelques secondes (il reçoit une notif), ou t'inscrire au prochain tournoi.",
            "Si tu défies : vous sélectionnez les jeux via le système ban/pick, vous jouez en Bo3, le gagnant est payé automatiquement.",
            "Si c'est un tournoi : tu attends que le bracket soit complet, puis tu joues round par round jusqu'à te faire éliminer ou remporter le prize pool.",
          ],
        ],
        [
          "Pourquoi 20 mini-jeux ? Ça ne fait pas trop à développer ?",
          [
            "20 jeux est une cible — on peut commencer avec 8 à 10 jeux bien calibrés au lancement.",
            "Le vrai enjeu n'est pas la quantité mais la diversité des profils couverts : au moins un jeu de réflexes purs, un jeu de mémoire, un jeu de précision, un jeu de stratégie, un jeu de culture. Avec 5 catégories couvertes, le système ban/pick a déjà du sens.",
            "Les jeux s'ajoutent progressivement — c'est aussi un levier de rétention (nouveauté régulière).",
          ],
        ],
        [
          "Pourquoi la mise minimale est à 5 € ?",
          [
            "5 € est un seuil psychologique accessible : le prix d'un café ou d'un ticket de métro. Il rend l'enjeu réel sans être effrayant.",
            "En dessous, la friction du paiement ne vaut pas l'enjeu. Au-dessus pour commencer, on risque de réduire la base d'utilisateurs qui osent tenter.",
            "Des mises plus élevées (10 €, 20 €, 50 €) peuvent être disponibles dès le départ pour les utilisateurs qui le souhaitent.",
          ],
        ],
        [
          "Pourquoi le tournoi ne commence qu'à puissance de deux ?",
          [
            "C'est la seule structure mathématique qui garantit un bracket parfait sans byes ni inégalités : chaque joueur joue le même nombre de rounds pour atteindre la finale.",
            "Alternatives possibles : permettre des brackets avec byes (certains joueurs ne jouent pas au premier round), ou des formats suisses — mais ces formats sont moins lisibles et moins fun pour un public casual.",
            "Concrètement : dès que 1 023 personnes sont inscrites, on attend la 1 024ème. S'il manque des joueurs, on peut proposer une file d'attente avec remboursement ou report sur le prochain tournoi.",
          ],
        ],
      ].flatMap(([q, a]) => qBox(q, a)),

      h2("5.2 — Sur la légalité"),

      ...[
        [
          "C'est légal de faire payer des gens pour jouer et distribuer de l'argent ?",
          [
            "En France, la réponse dépend de la qualification juridique du jeu. Ce n'est pas automatiquement illégal — notamment si le résultat dépend principalement du skill et que la plateforme ne joue pas contre les joueurs.",
            "Le modèle de SLAP$TAX (compétition entre joueurs, commission fixe de l'opérateur, mini-jeux d'adresse) est structurellement proche des plateformes d'e-sport compétitif qui opèrent légalement.",
            "Cela dit, la validation juridique formelle auprès d'un avocat spécialisé est non-négociable avant tout lancement public impliquant de l'argent réel.",
          ],
        ],
        [
          "Quel est le principal risque légal ?",
          [
            "Deux risques principaux :",
            "1. Requalification en jeu de hasard : si un régulateur estime que le résultat d'un mini-jeu dépend davantage du hasard que du skill, la plateforme tombe sous le régime des jeux d'argent régulés (ANJ en France) — ce qui requiert un agrément difficile à obtenir.",
            "2. Absence de licence de paiement : collecter et redistribuer des fonds tiers sans être établissement de paiement agréé (ou sans partenariat avec un PSP agréé) est illégal.",
            "Solution à court terme : lancer d'abord en version sans argent réel (points, crédits non convertibles), valider le modèle, puis introduire l'argent réel avec la structure légale en place.",
          ],
        ],
        [
          "Est-ce qu'on peut faire des tournois sans argent d'abord ?",
          [
            "Oui — et c'est probablement la stratégie de lancement la plus sage.",
            "Une v0 avec des crédits virtuels, un classement, et des récompenses non monétaires (badges, statuts, visibilité) permet de valider le produit et de construire une communauté sans aucune contrainte réglementaire.",
            "L'introduction de l'argent réel devient ensuite une fonctionnalité premium plutôt que le coeur du produit dès le jour 1.",
          ],
        ],
        [
          "Et les mineurs ?",
          [
            "La loi française interdit aux mineurs de participer à des jeux d'argent. Des mesures de vérification d'âge robustes sont obligatoires.",
            "En pratique : vérification d'identité (KYC) systématique lors de l'activation du wallet, avec pièce d'identité. Cette démarche est standard pour toute fintech ou plateforme de paiement.",
            "Les modes sans argent réel peuvent rester accessibles à tous les âges.",
          ],
        ],
        [
          "Faut-il un agrément ANJ ?",
          [
            "L'ANJ régule les paris sportifs, le poker en ligne, et les jeux de loterie. Les plateformes de compétition d'adresse entre joueurs ne sont pas automatiquement dans son périmètre.",
            "Si les mini-jeux sont qualifiés de jeux d'adresse (et non de hasard), l'agrément ANJ n'est probablement pas requis.",
            "En revanche, un agrément d'établissement de paiement (ou un partenariat avec un PSP agréé type Stripe, Mangopay, Treezor) est indispensable pour manipuler des fonds.",
          ],
        ],
      ].flatMap(([q, a]) => qBox(q, a)),

      h2("5.3 — Sur la stratégie"),

      ...[
        [
          "Quelle est la stratégie de croissance ?",
          [
            "Phase 1 — Viralité organique entre amis : l'app se diffuse naturellement via le système de défi direct. Quand tu défies un ami non-inscrit, il reçoit une invitation. C'est du growth viral intégré dans le produit.",
            "Phase 2 — Contenu et communauté : les moments forts (finale de tournoi, streak incroyable, retournement de situation) sont naturellement partageables sur TikTok/Instagram. Pas besoin de budget pub, juste des mécaniques bien designées.",
            "Phase 3 — Partenariats avec des créateurs de contenu : streamer, influenceur gaming ou street — organiser des tournois avec leur audience crée une audience qualifiée instantanément.",
          ],
        ],
        [
          "Comment éviter que les meilleurs joueurs écrasent tout le monde ?",
          [
            "C'est une tension réelle à gérer. Plusieurs mécaniques peuvent équilibrer :",
            "– Le système ban/pick fait que même face à un très bon joueur, tu peux bannir ses points forts et le forcer sur des jeux moins confortables.",
            "– Les tournois peuvent proposer des divisions (débutant, confirmé, expert) basées sur le taux de victoire historique.",
            "– La nouveauté régulière de mini-jeux remet les compteurs à zéro pour tout le monde.",
            "L'objectif n'est pas de rendre les experts impuissants, mais de s'assurer que les débutants ont toujours le sentiment d'avoir une chance — c'est ce qui les fait rester.",
          ],
        ],
        [
          "Comment gérer le stat-padding (manipulation des statistiques) ?",
          [
            "Le stat-padding : un joueur joue des matchs faciles ou arrange des résultats pour gonfler ses stats sur certains jeux et tromper l'adversaire.",
            "Solutions : ne comptabiliser les stats que sur des matchs joués contre des joueurs de niveau similaire ; détecter les anomalies statistiques (win rate trop élevé contre des joueurs de faible niveau) ; permettre de masquer ses stats en échange d'un désavantage dans l'ordre de ban/pick.",
          ],
        ],
        [
          "Quelle différenciation face à des apps de jeux existantes ?",
          [
            "Les apps de mini-jeux casual existent (WordBrain, 8 Ball Pool, etc.) mais aucune ne combine : enjeu financier réel + système ban/pick stratégique + contexte social entre amis.",
            "La différenciation n'est pas le mini-jeu lui-même (qui peut être simple), c'est l'architecture compétitive autour.",
            "La vibe — skate, street, trash-talk assumé — est aussi un positionnement de marque fort qui cible un segment précis et crée de la fidélité.",
          ],
        ],
        [
          "Quels sont les risques de fraude ou de collusion ?",
          [
            "Collusion en tournoi : deux amis s'arrangent pour qu'un seul gagne. Difficile à éliminer totalement, mais le fait que chaque round soit observable et que les mini-jeux soient les mêmes pour tous réduit les vecteurs.",
            "Fraude au paiement : chargeback frauduleux après une perte. Un KYC robuste et des délais de retrait minimisent ce risque.",
            "Multi-comptes : un joueur crée plusieurs comptes pour joindre ses tournois. La vérification d'identité doit interdire deux comptes sur la même identité.",
          ],
        ],
      ].flatMap(([q, a]) => qBox(q, a)),

      h2("5.4 — Sur le produit"),

      ...[
        [
          "Comment fonctionne le wallet ?",
          [
            "Chaque utilisateur dispose d'un wallet intégré. Il l'alimente par virement ou carte bancaire, et peut retirer ses gains vers son compte bancaire.",
            "La gestion des fonds nécessite un partenariat avec un prestataire de services de paiement agréé (PSP) — c'est la solution standard pour les apps qui manipulent des fonds tiers sans devenir elles-mêmes établissement de paiement.",
            "Options : Stripe Connect, Mangopay, Lemonway, Treezor — tous ont des solutions adaptées aux plateformes de compétition.",
          ],
        ],
        [
          "Que se passe-t-il si un joueur quitte en plein milieu d'un match ?",
          [
            "Il est déclaré forfait et son adversaire remporte automatiquement le jeu en cours.",
            "Si la déconnexion est manifestement involontaire (coupure réseau détectée côté serveur), une fenêtre de reconnexion de 30 à 60 secondes peut être accordée.",
            "Des règles claires et communiquées dès le départ sont essentielles pour éviter les contestations.",
          ],
        ],
        [
          "Comment sont générés les stats des joueurs sur chaque jeu ?",
          [
            "Automatiquement, à partir de l'historique des parties. Pour chaque jeu et chaque joueur : taux de victoire, score moyen, percentile parmi tous les joueurs.",
            "Ces stats ne sont visibles par un adversaire que lors de la phase de ban/pick d'un défi direct — pas dans un profil public général, pour protéger la vie privée.",
            "L'utilisateur peut opter pour masquer ses stats (mais perd alors sa priorité de ban/pick).",
          ],
        ],
        [
          "L'app est-elle mobile uniquement ?",
          [
            "Le mobile est le format naturel : les mini-jeux sont conçus pour un écran tactile, et les défis entre amis se lancent dans un contexte social (soirée, transport, etc.).",
            "Une version desktop n'est pas exclue à terme, mais n'est pas la priorité. Les tournois peuvent théoriquement être joués sur n'importe quel support.",
          ],
        ],
      ].flatMap(([q, a]) => qBox(q, a)),

      spacer(20),

      // ═══════════════════════════════════════
      // 6. ROADMAP
      // ═══════════════════════════════════════
      h1("6. Roadmap indicative"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1800, 2400, 4826],
        rows: [
          new TableRow({
            tableHeader: true,
            children: ["PHASE", "PÉRIODE", "OBJECTIFS"].map((t, i) =>
              new TableCell({
                borders: cellBorder(ACCENT),
                shading: { fill: "FF5C00", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                width: { size: [1800, 2400, 4826][i], type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: t, font: "Arial", size: 20, bold: true, color: "FFFFFF" })], spacing: { before: 0, after: 0 } })],
              })
            ),
          }),
          ...[
            ["V0", "M1 – M3", "Validation concept · 5-8 mini-jeux · Mode défi sans argent réel · Test utilisateurs fermé"],
            ["V1", "M4 – M6", "Argent réel (wallet + PSP) · 12 mini-jeux · Mode tournoi · KYC · Lancement bêta publique"],
            ["V2", "M7 – M12", "20 mini-jeux · Système ban/pick complet · Stats avancées · Partage social · Premiers créateurs partenaires"],
            ["V3", "M12+", "Divisions de niveau · Tournois sponsorisés · Expansion géographique · API pour partenaires"],
          ].map(([ph, per, obj], i) =>
            new TableRow({
              children: [ph, per, obj].map((text, j) =>
                new TableCell({
                  borders: cellBorder(BORDER_COLOR),
                  shading: { fill: i % 2 === 0 ? LIGHT_BG : "FFFFFF", type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  width: { size: [1800, 2400, 4826][j], type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20, bold: j === 0, color: j === 0 ? ACCENT : TEXT_DARK })], spacing: { before: 0, after: 0 } })],
                })
              ),
            })
          ),
        ],
      }),
      spacer(20),

      // ═══════════════════════════════════════
      // 7. SYNTHESE
      // ═══════════════════════════════════════
      h1("7. Synthèse"),
      body("SLAP$TAX repose sur une idée simple et puissante : la compétition entre amis est l'un des comportements sociaux les plus universels, et personne n'a encore créé la plateforme parfaite pour la monétiser de manière fun, équitable et accessible."),
      body("Le système ban/pick transforme ce qui pourrait être un simple jeu de hasard en une véritable arène stratégique. Les statistiques publiques créent un meta-game avant même le premier jeu. La structure de tournoi garantit des enjeux croissants et des moments de tension."),
      body("Les défis légaux sont réels mais pas insurmontables — des précédents existent dans l'e-sport et les plateformes de compétition. La voie la plus sûre est de commencer sans argent réel, valider le produit, puis introduire l'argent réel avec la structure juridique et financière en place."),
      spacer(8),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4413, 4613],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorder(BORDER_COLOR),
                shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                width: { size: 4413, type: WidthType.DXA },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "✅  POINTS FORTS", font: "Arial", size: 22, bold: true, color: "2E7D32" })], spacing: { before: 0, after: 120 } }),
                  ...[
                    "Mécanique ban/pick originale et profonde",
                    "Viral by design (défi = invitation implicite)",
                    "Modèle économique simple et transparent",
                    "Positionnement légal favorisé (adresse vs hasard)",
                    "Vibe forte et différenciante",
                  ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: t, font: "Arial", size: 20, color: TEXT_DARK })], spacing: { before: 0, after: 60 } })),
                ],
              }),
              new TableCell({
                borders: cellBorder(BORDER_COLOR),
                shading: { fill: "FFF3E8", type: ShadingType.CLEAR },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                width: { size: 4613, type: WidthType.DXA },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "⚠️  POINTS D'ATTENTION", font: "Arial", size: 22, bold: true, color: ACCENT })], spacing: { before: 0, after: 120 } }),
                  ...[
                    "Validation juridique obligatoire avant lancement argent réel",
                    "Coût de développement des mini-jeux non négligeable",
                    "Risque de fraude / collusion à anticiper dès la conception",
                    "Rétention long terme à prouver (nouveauté régulière nécessaire)",
                    "Agrément PSP indispensable pour les fonds",
                  ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: t, font: "Arial", size: 20, color: TEXT_DARK })], spacing: { before: 0, after: 60 } })),
                ],
              }),
            ],
          }),
        ],
      }),
      spacer(40),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR, space: 12 } },
        children: [new TextRun({ text: "Document confidentiel · SLAP$TAX · V1.0", font: "Arial", size: 18, color: TEXT_LIGHT })],
        spacing: { before: 200, after: 0 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/SLAPTAX_Concept.docx', buf);
  console.log('Done');
});
```
