export type CompetitiveGameId =
    | 'garde'
    | 'trace'
    | 'decoupe'
    | 'chroma'
    | 'ricochet'
    | 'contrepied'
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
        id:'garde',labelFr:'GARDE',labelEn:'GARDE',skillFr:'Lecture + combat',skillEn:'Reads + combat',
        ruleFr:'6 PV, 8 tours maximum. Choisis en trois secondes. Attaque : 1 degat, ou 2 apres une charge. Defense : bloque tout, jamais deux fois de suite. Charge acquise meme sous attaque, valable un tour. Expiration : ni attaque ni protection. Le plus de PV gagne ; egalite a rejouer ensemble.',
        ruleEn:'6 HP, 8 turns max. Pick within three seconds. Attack: 1 damage, or 2 after charging. Defend: blocks everything, never twice in a row. Charge survives a hit and lasts one turn. Timeout: no attack or protection. Highest HP wins; tied duels require a mutual replay.',
    },
    {
        id:'trace',labelFr:'TRACE',labelEn:'TRACE',skillFr:'Memoire + geste',skillEn:'Memory + touch',
        ruleFr:'Observe deux secondes. Redessine la forme en un seul trait, en six secondes. Lever le doigt valide. Trois formes : le total de fidelite le plus eleve gagne. Aucun bonus de vitesse.',
        ruleEn:'Look for two seconds. Redraw in one stroke within six seconds. Lift to commit. Three shapes: the highest total accuracy wins. No speed bonus.',
    },
    {
        id:'decoupe',labelFr:'DECOUPE',labelEn:'DECOUPE',skillFr:'Estimation + precision',skillEn:'Estimation + precision',
        ruleFr:'Trace une ligne de coupe, touche le cote a garder puis valide en huit secondes. Trois silhouettes : approche la proportion cible. La plus petite erreur totale gagne.',
        ruleEn:'Draw a cutting line, tap the side to keep and lock within eight seconds. Three silhouettes: match the target percentage. Lowest total error wins.',
    },
    {
        id:'contrepied',labelFr:'CONTREPIED',labelEn:'CONTREPIED',skillFr:'Bluff + tactique',skillEn:'Bluff + tactics',
        ruleFr:'Cinq cartes, chacune utilisable une fois. Engage une carte en sept secondes : la plus forte gagne la recompense, une egalite la defausse. A expiration, la plus petite carte est consommee sans pouvoir gagner. Le total des recompenses decide.',
        ruleEn:'Five cards, each used once. Commit within seven seconds: the highest wins the reward; ties discard it. On timeout, your lowest card is consumed and cannot win. Total rewards decide the match.',
    },
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
    { id: 'precision', fr: 'Precision', en: 'Precision', games: ['decoupe', 'ricochet', 'chroma', 'onesecond', 'cupshuffle'] },
    { id: 'mind', fr: 'Cerveau', en: 'Brainpower', games: ['trace', 'symbolrush', 'duelnumeric'] },
    { id: 'risk', fr: 'Prise de risque', en: 'Risk takers', games: ['onemore', 'bombpass'] },
    { id: 'tactics', fr: 'Tactique', en: 'Tactics', games: ['garde','contrepied','ricochet'] },
] as const;
export const isPartyGame = (id: string) => ['garde','trace','decoupe','chroma','ricochet','contrepied'].includes(id) || SIGNATURE_GAMES.some((game) => game.id === id);

export function gameLabel(id: string, isFr: boolean): string {
    const game = getCompetitiveGame(id);
    return game ? (isFr ? game.labelFr : game.labelEn) : id;
}
