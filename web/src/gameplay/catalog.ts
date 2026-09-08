export type CompetitiveGameId =
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
        id: 'falsestart', labelFr: 'Faux Depart', labelEn: 'False Start',
        skillFr: 'Reflexe + bluff', skillEn: 'Reflex + bluff',
        ruleFr: 'Attends GO. Un faux depart donne le point au rival. Une feinte chacun. Premier a trois.',
        ruleEn: 'Wait for GO. A false start gives your rival the point. One feint each. First to three.',
    },
    {
        id: 'onesecond', labelFr: 'Une Seconde', labelEn: 'One Second',
        skillFr: 'Precision + sang-froid', skillEn: 'Precision + composure',
        ruleFr: 'Maintiens une seconde, puis relache. Trois essais sans chrono visible. Le plus petit ecart total gagne.',
        ruleEn: 'Hold for one second, then release. Three attempts, no visible clock. Lowest total error wins.',
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

export const SIGNATURE_GAMES = COMPETITIVE_GAMES.slice(0, 3);
export const isPartyGame = (id: string) => SIGNATURE_GAMES.some((game) => game.id === id);

export function gameLabel(id: string, isFr: boolean): string {
    const game = getCompetitiveGame(id);
    return game ? (isFr ? game.labelFr : game.labelEn) : id;
}
