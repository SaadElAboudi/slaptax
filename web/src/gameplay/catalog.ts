export type CompetitiveGameId =
    | 'chroma'
    | 'ricochet'
    | 'falsestart'
    | 'onesecond'
    | 'onemore'
    | 'bounce'
    | 'symbolrush'
    | 'bombpass'
    | 'cupshuffle'
    | 'duelnumeric';

export interface CompetitiveGame {
    id: CompetitiveGameId;
    labelEn: string;
    labelFr: string;
    skillEn: string;
    skillFr: string;
    ruleEn: string;
    ruleFr: string;
}

export const COMPETITIVE_GAMES: CompetitiveGame[] = [
    {
        id:'ricochet',labelFr:'RICOCHET',labelEn:'RICOCHET',skillFr:'Adresse + tactique',skillEn:'Aim + tactics',
        ruleFr:'Trois salves simultanees. Vise, dose et verrouille ton tir en dix secondes. Le palet restant le plus proche du centre gagne. Les sorties laterales eliminent les palets.',
        ruleEn:'Three simultaneous volleys. Aim, set power and lock your shot in ten seconds. The remaining puck nearest the center wins. Side exits eliminate pucks.',
    },
    {
        id: 'chroma', labelFr: 'CHROMA', labelEn: 'CHROMA',
        skillFr: 'Couleur + memoire', skillEn: 'Color + memory',
        ruleFr: 'Observe deux secondes. Recree la couleur en dix secondes. Trois couleurs, la plus petite distance RVB totale gagne.',
        ruleEn: 'Look for two seconds. Recreate the color in ten. Three colors, lowest total RGB distance wins.',
    },
    {
        id: 'falsestart', labelFr: 'Faux Depart', labelEn: 'False Start',
        skillFr: 'Reflexe + bluff', skillEn: 'Reflex + bluff',
        ruleFr: 'Attends GO. Un faux depart donne le point au rival. Une feinte chacun. Premier a trois.',
        ruleEn: 'Wait for GO. A false start gives your rival the point. One feint each. First to three.',
    },
    {
        id: 'onesecond', labelFr: 'Pile Chrono', labelEn: 'Blind Clock',
        skillFr: 'Precision + sang-froid', skillEn: 'Precision + composure',
        ruleFr: 'Une cible de 2 a 10 secondes. Au TOP, compte dans ta tete puis appuie sur STOP. Trois essais, le plus petit ecart total gagne.',
        ruleEn: 'A target from 2 to 10 seconds. At GO, count in your head and hit STOP. Three attempts, lowest total error wins.',
    },
    {
        id: 'onemore', labelFr: 'Encore Un', labelEn: 'One More',
        skillFr: 'Timing + audace', skillEn: 'Timing + nerve',
        ruleFr: 'Empile, puis securise ta tour. Un bloc rate et tu perds tout. Trente secondes, vingt blocs maximum.',
        ruleEn: 'Stack, then bank your tower. Miss a block and lose it all. Thirty seconds, twenty blocks maximum.',
    },
    {
        id: 'bounce',
        labelEn: 'Bounce Panic',
        labelFr: 'Bounce Panic',
        skillEn: 'Control + survival',
        skillFr: 'Controle + survie',
        ruleEn: 'Return the ball as speed, obstacles, and shrinking paddles raise the pressure.',
        ruleFr: 'Renvoie la balle pendant que la vitesse, les obstacles et les paddles reduits augmentent la pression.',
    },
    {
        id: 'symbolrush',
        labelEn: 'Symbol Sprint',
        labelFr: 'Symbol Sprint',
        skillEn: 'Memory + speed',
        skillFr: 'Memoire + vitesse',
        ruleEn: 'Memorize the hidden sequence and rebuild it before the rival clock expires.',
        ruleFr: 'Memorise la suite cachee et reconstruis-la avant la fin du chrono rival.',
    },
    {
        id: 'bombpass',
        labelEn: 'Bomb Pass',
        labelFr: 'Bomb Pass',
        skillEn: 'Timing + pressure',
        skillFr: 'Timing + pression',
        ruleEn: 'Pass inside the safe window before the bomb explodes on its holder.',
        ruleFr: 'Passe dans la fenetre sure avant que la bombe explose chez son porteur.',
    },
    {
        id: 'cupshuffle',
        labelEn: 'Cup Shuffle',
        labelFr: 'Cup Shuffle',
        skillEn: 'Tracking + focus',
        skillFr: 'Suivi + concentration',
        ruleEn: 'Three shuffles. Follow the token, then lock your answer before your friend.',
        ruleFr: 'Trois melanges. Suis le jeton et verrouille ta reponse avant ton ami.',
    },
    {
        id: 'duelnumeric',
        labelEn: 'Duel Numeric',
        labelFr: 'Duel Numeric',
        skillEn: 'Logic + calculation',
        skillFr: 'Logique + calcul',
        ruleEn: 'Five common questions. One answer each. Accuracy first, speed breaks the tie.',
        ruleFr: 'Cinq questions communes. Une reponse chacun. La precision prime, la vitesse departage.',
    },
];

export function getCompetitiveGame(id: string): CompetitiveGame | undefined {
    return COMPETITIVE_GAMES.find((game) => game.id === id);
}

export const SIGNATURE_GAMES = COMPETITIVE_GAMES.filter((game) => ['falsestart', 'onesecond', 'onemore'].includes(game.id));
export const GAME_CATEGORIES = [
    { id: 'reflex', fr: 'Reflexes', en: 'Reflexes', games: ['falsestart', 'bounce'] },
    { id: 'precision', fr: 'Precision', en: 'Precision', games: ['ricochet', 'chroma', 'onesecond', 'cupshuffle'] },
    { id: 'mind', fr: 'Cerveau', en: 'Brainpower', games: ['symbolrush', 'duelnumeric'] },
    { id: 'risk', fr: 'Prise de risque', en: 'Risk takers', games: ['onemore', 'bombpass'] },
] as const;
export const isPartyGame = (id: string) => ['chroma','ricochet'].includes(id) || SIGNATURE_GAMES.some((game) => game.id === id);

export function gameLabel(id: string, isFr: boolean): string {
    const game = getCompetitiveGame(id);
    return game ? (isFr ? game.labelFr : game.labelEn) : id;
}
