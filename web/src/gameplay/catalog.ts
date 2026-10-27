import selection from '../../../shared/game-selection.json' with {type:'json'};
export type CompetitiveGameId =
    | 'pigeon'
    | 'lift'
    | 'pie'
    | 'balloon'
    | 'toilet'
    | 'table'
    | 'mat'
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

export const ALL_GAMES: CompetitiveGame[] = [
 {id:'pigeon',labelFr:'Pigeon Express',labelEn:'Pigeon Express',skillFr:'Pilotage + balistique',skillEn:'Flight + ballistics',ruleFr:'24 secondes. Glisse pour déplacer ton pigeon ou utilise le curseur. Largue sur la voiture rose du rival : 100 points, 180 au centre. La fiente tombe en 0,9 seconde et dérive avec le vent. Toucher ta propre voiture coûte 50 points. Ton parasol protège ta voiture pendant 0,65 seconde, rechargeable en 2,8 secondes ; bloquer un tir adverse rapporte 40 points. Un largage par seconde. Solo contre un bot annoncé ; duel entre deux humains. Égalité : rejouez ensemble.',ruleEn:'24 seconds. Slide to move your pigeon or use the slider. Drop onto the rival pink car: 100 points, 180 bullseye. Droppings fall for 0.9 seconds and drift with the wind. Hitting your own car costs 50 points. Your umbrella covers your car for 0.65 seconds every 2.8 seconds; blocking a rival shot earns 40 points. One drop per second. Solo against a declared bot; two humans in duels. Tied duels need a mutual replay.'},
 {id:'lift',labelFr:'Ascenseur à Prouts',labelEn:'Elevator of Farts',skillFr:'Esquive + coups bas',skillEn:'Dodging + dirty tricks',ruleFr:'22 secondes. Choisis une place à chaque passage : un nuage vert est annoncé 0,7 seconde avant. Une place sûre confirmée rapporte 80 points ; le haricot ajoute 40 points. Deux haricots rechargent un prout, deux maximum. PROUT CIBLÉ vise la place actuelle du rival et frappe 0,7 seconde après : il peut esquiver ! Un piège réussi rapporte 100 points, le rival perd 60 ; un nuage coûte aussi 60 points. Les points restent positifs. Un prout toutes les trois secondes. Solo contre un bot annoncé ; duel à deux humains. Égalité : rejouez ensemble.',ruleEn:'22 seconds. Pick a spot every wave: a green cloud is announced 0.7 seconds ahead. A confirmed safe spot earns 80 points; a bean adds 40. Two beans refill one fart, up to two. TARGETED FART locks the rival current spot and lands 0.7 seconds later: they can dodge! A successful trap earns 100 points and costs the rival 60; a cloud also costs 60. Scores stay nonnegative. One fart every three seconds. Solo against a declared bot; two humans in duels. Tied duels need a mutual replay.'},
 {id:'pie',labelFr:'Tarte ta Face',labelEn:'Pie in Your Face',skillFr:'Visée + esquive',skillEn:'Aim + dodge',ruleFr:'22 secondes. Touche la scène pour viser et lancer, ou utilise le curseur et le bouton : elle arrive après 0,35 seconde. Une touche rapporte 100 points, 200 en plein centre ; les touches consécutives ajoutent un bonus jusqu’à 75 points. Une tarte toutes les 0,95 seconde. Esquive pendant 0,45 seconde, rechargeable en 2,2 secondes. Esquiver une tarte qui allait te toucher prépare une grosse tarte : visée plus large, +100 points à la touche suivante. Le plus de points gagne. Solo contre un bot déclaré, duel à deux humains ; égalité à rejouer ensemble.',ruleEn:'22 seconds. Tap the scene to aim and throw, or use the slider and button: pies arrive after 0.35 seconds. A hit earns 100 points, a bullseye 200; consecutive hits add up to 75 bonus points. One pie every 0.95 seconds. Duck for 0.45 seconds every 2.2 seconds. Dodge an incoming hit to earn a mega pie: wider aim and +100 points on its next hit. Highest score wins. Solo against a declared bot, two humans in duels; tied duels need a mutual replay.'},
 {id:'balloon',labelFr:'Gonfle ou Pète',labelEn:'Pump or Pop',skillFr:'Risque + sabotage',skillEn:'Risk + sabotage',ruleFr:'22 secondes. Maintiens pour gonfler, relâche pour encaisser : volume au carré divisé par 20 points. Chaque ballon explose à un seuil secret entre 78 et 108 %. Dès 70 %, attention ! Explosion : seul le ballon courant est perdu. Pour 25 points encaissés, ajoute 12 % au ballon adverse, toutes les quatre secondes. Encaisser à 70 % ou plus donne un casque passoire : il bloque un sabotage, sans cumul. Une attaque exige un ballon adverse déjà gonflé à 10 %. Le plus de points gagne. Solo contre un bot déclaré ; duel à deux humains. Égalité à rejouer ensemble.',ruleEn:'22 seconds. Hold to pump, release to bank: squared volume divided by 20 points. Each balloon bursts at a hidden limit between 78 and 108%. Watch out above 70%! A pop only loses the current balloon. Spend 25 banked points to add 12% to the rival balloon, every four seconds; their balloon must already be at 10%. Bank at 70% or above to earn a helmet blocking one sabotage; helmets do not stack. Highest score wins. Solo against a declared bot; two humans in duels. Tied duels need a mutual replay.'},
    {id:'toilet',labelFr:'Panique aux Toilettes',labelEn:'Toilet Panic',skillFr:'Pilotage + braquage',skillEn:'Driving + duck heist',ruleFr:'Pilote ta toilette avec le doigt ou les flèches. Ramasse les canards : le plus gros butin après 25 secondes gagne. Prout turbo toutes les 2,8 secondes : percute un rival pour lui voler un canard. La chasse revient toutes les six secondes ; tomber dans le trou fait perdre jusqu’à trois canards et te fait repartir. Les canards dorés des sept dernières secondes valent trois. Solo contre trois bots déclarés ; duel à deux humains. Égalité en duel : rejouez ensemble.',ruleEn:'Hold and drag or use the arrows to drive your toilet. Most ducks after 25 seconds wins. Fart turbo every 2.8 seconds: hit a rival to steal a duck. A flush comes every six seconds; falling into the drain costs up to three ducks and respawns you. Gold ducks in the final seven seconds are worth three. Solo against three declared bots; duel with two humans. Tied duels need a mutual replay.'},
    {id:'table',labelFr:'Dernier sur la table',labelEn:'Last on the Table',skillFr:'Collision + survie',skillEn:'Bumps + survival',ruleFr:'Glisse depuis ton personnage pour viser, puis relâche pour te propulser. Pousse les autres hors de la table et reste dessus ! À 6, 12 et 16 secondes, un coup de nappe pousse tout le monde : une flèche prévient 1,2 seconde avant. Contre-braque ou profite du glissement pour éjecter un rival. La table rétrécit après dix secondes. À vingt secondes, le survivant le plus proche du centre gagne. Solo contre trois bots ; duel à deux joueurs humains.',ruleEn:'Drag from your character to aim, then release to dash. Bump rivals off the table and stay on! At 6, 12 and 16 seconds, a tablecloth pull pushes everyone; an arrow warns 1.2 seconds ahead. Counter-dash or use the slide to knock a rival off. The table shrinks after ten seconds. At twenty seconds, the surviving player closest to center wins. Solo against three bots; live duel with two humans.'},
    {
        id:'mat',labelFr:'MAT',labelEn:'MAT',skillFr:'Echecs + vitesse',skillEn:'Chess + speed',
        ruleFr:'Mat en un coup. Une position commune, vingt secondes et un seul coup legal. Toute solution gagnante est acceptee. Le plus rapide gagne ; ecart de 250 ms ou moins : egalite. Deux echecs : nouvelle position a rejouer ensemble.',
        ruleEn:'Mate in one. One shared position, twenty seconds and one legal move. Any checkmate counts. Fastest wins; within 250 ms is a tie. Both miss: mutually replay a fresh position.',
    },
    {
        id:'garde',labelFr:'GARDE',labelEn:'GARDE',skillFr:'Lecture + combat',skillEn:'Reads + combat',
        ruleFr:'6 PV, 8 tours maximum. Choisis en trois secondes. Attaque : 1 degat, ou 2 apres une charge. Défense : bloque et renvoie les dégâts de l’attaque, jamais deux fois de suite. Banane : inflige 2 dégâts à une charge ; contre une attaque, la banane te rend vulnérable et tu prends 1 dégât supplémentaire. Charge acquise meme sous attaque, valable un tour. Expiration : ni attaque ni protection. Le plus de PV gagne ; egalite a rejouer ensemble.',
        ruleEn:'6 HP, 8 turns max. Pick within three seconds. Attack: 1 damage, or 2 after charging. Defend: blocks and reflects attack damage, never twice in a row. Banana: deals 2 damage to a charging rival; against an attack, banana makes you take 1 extra damage. Charge survives a hit and lasts one turn. Timeout: no attack or protection. Highest HP wins; tied duels require a mutual replay.',
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
        ruleFr: 'Empile, puis securise ta tour. Trois placements parfaits consécutifs donnent une bouée : elle pardonne un seul raté. Sans bouée, un bloc raté fait tout perdre. Trente secondes, vingt blocs maximum.',
        ruleEn: 'Stack, then bank your tower. Three consecutive perfect drops earn a lifeline that forgives one miss. Without it, a miss loses everything. Thirty seconds, twenty blocks maximum.',
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

// Archived IDs remain readable for real history and already shared links.
export const COMPETITIVE_GAMES: CompetitiveGame[] = selection.map(entry=>({...ALL_GAMES.find(game=>game.id===entry.id)!,labelFr:entry.labelFr,labelEn:entry.labelEn}));
export function getCompetitiveGame(id:string):CompetitiveGame|undefined{
 return COMPETITIVE_GAMES.find(game=>game.id===id)||ALL_GAMES.find(game=>game.id===id);
}
export function gameHook(id:string,isFr:boolean){const entry=selection.find(game=>game.id===id);return entry?(isFr?entry.hookFr:entry.hookEn):'';}
export const SIGNATURE_GAMES=COMPETITIVE_GAMES.filter(game=>['table','garde','onemore'].includes(game.id));
export const GAME_CATEGORIES=[
 {id:'chaos',fr:'Bagarre',en:'Brawls',games:['table','garde','toilet','pie','lift']},
 {id:'precision',fr:'Coup de main',en:'Skill shots',games:['decoupe','pigeon']},
 {id:'risk',fr:'Ça va craquer',en:'Risk it',games:['onemore','bombpass','toilet','balloon']},
] as const;
export const isPartyGame=(id:string)=>['pigeon','lift','pie','balloon','toilet','table','mat','garde','trace','decoupe','chroma','ricochet','contrepied','falsestart','onesecond','onemore'].includes(id);

export function gameLabel(id: string, isFr: boolean): string {
    const game = getCompetitiveGame(id);
    return game ? (isFr ? game.labelFr : game.labelEn) : id;
}
