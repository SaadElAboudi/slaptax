import simplePlay from '../../../shared/simple-play.json';
import selection from '../../../shared/game-selection.json' with {type:'json'};
export type CompetitiveGameId =
    | 'snack'
    | 'chicken'
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
 {id:'chicken',labelFr:'Poule Position',labelEn:'Poultry Panic',skillFr:'Un stick · un bouton · 3 poules',skillEn:'One stick · one button · 3 chickens',ruleFr:'Bouge au stick ou avec les flèches / ZQSD. Attrape automatiquement la poule en passant dessus. Un seul bouton : BAFFE vise le rival, LANCE vise ton poulailler jaune et peut marquer directement. Tu peux aussi y ramener la poule à pied. Premier à 3 livraisons ; après 60 secondes, le plus de livraisons gagne. Égalité : revanche commune. Pas de pouvoir, de super, d’esquive ni de munitions à gérer. La poule se débat après 8 secondes ; les cercles annoncent les œufs à éviter en marchant. Même combattant pour tous, entraînement contre un bot annoncé ; défis, challenges et tournois avec les mêmes règles. Sur ordinateur : Espace ou clic pour baffer / lancer.',ruleEn:'Move with the stick or arrows / WASD. Walk over the chicken to pick it up automatically. One button: SLAP aims at the rival, THROW aims at your yellow coop and can score directly. You can also carry it home. First to 3 deliveries; after 60 seconds, most deliveries wins. Ties require mutual replay. No abilities, super, dodge or ammunition to manage. The chicken escapes after 8 seconds; walk out of egg warning circles. Same fighter for everyone. Practice against a declared bot; duels, challenges and tournaments use the same rules. Desktop: Space or click to slap / throw.'},

 {id:'snack',labelFr:'Braquage du Goûter',labelEn:'Snack Heist',skillFr:'Arène · visée · esquive',skillEn:'Arena · aim · evade',ruleFr:"Un stick et un bouton BAFFE / LANCE. Ramassage automatique. Une baffe fait lâcher le goûter. Le lancer vise le dépôt jaune et marque en y arrivant. Premier à trois livraisons ; après 90 secondes, seules les livraisons départagent. Égalité : revanche commune. Pas de pouvoirs, esquive ou munitions à gérer. Même combattant pour tous. Entraînement, duel et salon 2v2 avec les mêmes commandes.",ruleEn:"One stick and one SLAP / THROW button. Automatic pickup. A slap drops the snack. Throws aim at the yellow depot and score on arrival. First to three deliveries; after 90 seconds only deliveries decide. Ties require mutual replay. No abilities, dodge or ammo to manage. Same fighter for everyone. Practice, duel and 2v2 rooms use the same controls."},
 {id:'pigeon',labelFr:'Pigeon Express',labelEn:'Pigeon Express',skillFr:'Pilotage + balistique',skillEn:'Flight + ballistics',ruleFr:"Glisse pour voler, touche LARGUE pour viser la voiture rose du rival. La chute et le vent sont visibles dans le viseur. Une touche rapporte 100 points, 180 au centre plus le bonus de série. Ta voiture jaune coûte 50 points : évite-la. Pas de parasol à gérer. Le plus de points après 24 secondes gagne.",ruleEn:"Drag to fly, tap DROP to hit the rival pink car. The sight shows wind and flight time. Hits earn 100 points, bullseyes 180 plus streak bonus. Avoid your yellow car: it costs 50 points. No umbrella to manage. Most points after 24 seconds wins."},
 {id:'lift',labelFr:'Ascenseur à Prouts',labelEn:'Elevator of Farts',skillFr:'Esquive + coups bas',skillEn:'Dodging + dirty tricks',ruleFr:"Touche Gauche, Milieu ou Droite pour éviter les nuages verts annoncés. Confirme une place à chaque passage pour marquer. Les haricots rechargent PROUT : un bouton pour piéger la place du rival, qui peut changer de place. Pas de respiration à déclencher. Le plus de points après 22 secondes gagne.",ruleEn:"Tap Left, Middle or Right to avoid announced green clouds. Confirm a spot each wave to score. Beans recharge FART: one button traps the rival spot; they can move away. No breath control. Most points after 22 seconds wins."},
 {id:'pie',labelFr:'Tarte ta Face',labelEn:'Pie in Your Face',skillFr:'Feinte + visée + esquive',skillEn:'Juke + aim + dodge',ruleFr:"Ton personnage se déplace automatiquement. Touche le rival dans la scène pour viser et lancer une tarte, ou touche ENTARTE pour viser sa position actuelle. ESQUIVE te baisse au bon moment. Pas de placement ni de curseur à gérer. Une touche rapporte 100 points, 200 au centre ; les séries ajoutent un bonus. Le plus de points après 22 secondes gagne.",ruleEn:"Your character moves automatically. Tap the rival on the scene to aim and throw, or tap THROW PIE to aim at their current position. DUCK avoids an incoming pie. No movement or sliders to manage. Hits earn 100 points, bullseyes 200, streaks add a bonus. Most points after 22 seconds wins."},
 {id:'balloon',labelFr:'Gonfle ou Pète',labelEn:'Pump or Pop',skillFr:'Risque + sabotage',skillEn:'Risk + sabotage',ruleFr:"Maintiens GONFLE et relâche pour encaisser les points. Approche la cible dorée pour un bonus, mais relâche avant 100 % : une explosion perd le ballon courant. COUP DE POMPE est facultatif : coûte 25 points pour ajouter 12 % au ballon rival après un avertissement. Relâcher avant le sabotage protège le ballon suivant. Pas de soupape à gérer. Le plus de points après 22 secondes gagne.",ruleEn:"Hold PUMP and release to bank points. Approach the gold target for a bonus, but release before 100%: a pop loses the current balloon. Optional SNEAKY PUMP costs 25 points to add 12% to the rival balloon after a warning. Release before sabotage to protect the next balloon. No vent control. Most points after 22 seconds wins."},
    {id:'toilet',labelFr:'Panique aux Toilettes',labelEn:'Toilet Panic',skillFr:'Pilotage + braquage',skillEn:'Driving + duck heist',ruleFr:'Pilote ta toilette avec le doigt, ZQSD/WASD ou les flèches. Ramasse les canards : le plus gros butin après 25 secondes gagne. Prout turbo toutes les 2,8 secondes : percute un rival pour lui voler un canard. La chasse revient toutes les six secondes ; tomber dans le trou fait perdre jusqu’à trois canards et te fait repartir. Les canards dorés des sept dernières secondes valent trois. Solo contre trois bots déclarés ; duel à deux humains. Égalité en duel : rejouez ensemble.',ruleEn:'Hold and drag or use WASD/arrows to drive your toilet. Most ducks after 25 seconds wins. Fart turbo every 2.8 seconds: hit a rival to steal a duck. A flush comes every six seconds; falling into the drain costs up to three ducks and respawns you. Gold ducks in the final seven seconds are worth three. Solo against three declared bots; duel with two humans. Tied duels need a mutual replay.'},
    {id:'table',labelFr:'Dernier sur la table',labelEn:'Last on the Table',skillFr:'Collision + survie',skillEn:'Bumps + survival',ruleFr:'Sur téléphone, touche une destination puis relâche pour te propulser. À la souris, glisse depuis ton personnage pour viser. Pousse les autres hors de la table et reste dessus ! À 6, 12 et 16 secondes, un coup de nappe pousse tout le monde : une flèche prévient 1,2 seconde avant. Contre-braque ou profite du glissement pour éjecter un rival. La table rétrécit après dix secondes. À vingt secondes, le survivant le plus proche du centre gagne. Solo contre trois bots ; duel à deux joueurs humains.',ruleEn:'On touch, tap your destination then release to dash. With a mouse, drag from your character to aim. Bump rivals off the table and stay on! At 6, 12 and 16 seconds, a tablecloth pull pushes everyone; an arrow warns 1.2 seconds ahead. Counter-dash or use the slide to knock a rival off. The table shrinks after ten seconds. At twenty seconds, the surviving player closest to center wins. Solo against three bots; live duel with two humans.'},
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
        ruleFr:"Trace une ligne puis touche le morceau à servir : il est validé immédiatement. Recommencer permet de refaire la ligne avant de servir. Trois commandes, approche la proportion demandée : la plus petite erreur totale gagne.",
        ruleEn:"Draw a line, then tap the piece to serve: it commits immediately. Reset lets you redraw before serving. Three orders: match the requested portion. Lowest total error wins.",
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
const arenaCombatFr=' Combat tactique : 3 baffes en réserve, une recharge toutes les 1,1 s. Les lancers ne consomment pas de baffe. Hors combat pendant 4,5 s et sans porter l’objectif, récupère 1 PV toutes les 1,3 s. Les touches, dégâts reçus, blocages, interceptions, passes utiles et livraisons chargent le super. À 100 %, F ou le bouton étoile déclenche le super du combattant. Flan : onde dirigée à 2 dégâts annoncée 0,38 s avant. Cornichon : trois flaques qui ralentissent les rivaux et accélèrent les alliés. Toast : un coup protégé pour chaque allié proche pendant 4 s. Un KO conserve 75 % de la charge. Ces ressources sont identiques pour tous les modes et ne s’achètent pas.';
const arenaCombatEn=' Tactical combat: 3 slaps, one reload every 1.1 s. Throws do not consume slap ammo. After 4.5 s without combat and without carrying the objective, recover 1 HP every 1.3 s. Hits, damage taken, blocks, interceptions, useful passes and deliveries charge your super. At 100%, F or the star button uses your fighter’s super. Flan: a directional 2-damage wave with a 0.38 s warning. Pickle: three puddles that slow enemies and boost allies. Toast: one protected hit for each nearby ally for 4 s. A KO retains 75% of charge. Resources are identical across modes and cannot be purchased.';
for(const game of ALL_GAMES)if(['snack','chicken'].includes(game.id)){game.ruleFr+=arenaCombatFr;game.ruleEn+=arenaCombatEn;}
for(const game of ALL_GAMES){
 if(game.id==='decoupe'){game.ruleFr+=' Menu en trois commandes : biscuit en coupe libre, fromage en coupe verticale, gâteau en diagonale descendante. Les deux dernières directions sont guidées automatiquement, sans afficher le pourcentage avant validation. Trace puis touche le morceau à garder ; seule la surface conservée décide du score. Les anciennes commandes sans direction restent jouables. Entraînement, défi partagé, duel et tournoi utilisent les mêmes règles serveur.';game.ruleEn+=' Three orders: free-cut cookie, vertical-cut cheese, then diagonally cut cake. The last two directions are guided automatically without revealing the percentage before locking. Draw, then tap the piece to keep; retained area alone determines the score. Older orders without a direction remain playable. Practice, shared challenges, duels and tournaments use the same server rules.';}
 if(game.id==='onemore'){game.ruleFr+=' Les parties rouges du bloc seront coupées ; la zone verte reste, la zone dorée indique un parfait. Trois parfaits consécutifs donnent une bouée unique : elle pardonne un raté, ou tu peux la dépenser avec Réparer pour élargir le sommet de 12 % du terrain, sans dépasser la largeur initiale. Réparer ne donne aucun bloc ni point et relance le mouvement. Une bouée utilisée ne se regagne pas. Ces règles sont communes aux entraînements, défis partagés, duels et tournois.';game.ruleEn+=' Red block portions are cut; green stays, gold means perfect. Three consecutive perfects earn one lifeline: forgive a miss, or spend it with Repair to widen the top by 12% of the field, capped at the initial width. Repair gives no block or points and restarts movement. A spent lifeline cannot be earned again. Practice, shared challenges, duels and tournaments use the same rules.';}
 if(game.id==='balloon'){game.ruleFr='22 secondes. Maintiens Espace ou Gonfle, relâche pour encaisser. Explosion à 100 %. Vise ta cible 55, 70 puis 85 % (±4 %) pour +80 points ; le score de base reste volume²/20. K : sabotage à 25 points, annoncé 0,65 s avant +12 % sur le ballon ciblé ; encaisser avant l’impact l’évite. L : soupape, −18 %, protège un impact pendant 0,55 s, recharge 2,6 s. Encaisser à 70 % donne un casque non cumulable. Seul le ballon courant est perdu en cas d’explosion. Le plus de points gagne ; solo contre bot annoncé, duels humains et tournois utilisent les mêmes règles.';game.ruleEn='22 seconds. Hold Space or Pump, release to bank. Bursts at 100%. Hit your 55, 70 then 85% target (±4%) for +80 points, on top of volume²/20. K: sabotage costs 25 points and warns 0.65 s before adding 12% to the targeted balloon; banking first avoids it. L: vent loses 18%, protects one impact for 0.55 s, cooldown 2.6 s. Banking at 70% earns one nonstacking helmet. A pop loses only the current balloon. Highest score wins; declared solo bot, human duels and tournaments share rules.';}
 if(game.id==='pigeon'){game.ruleFr+=' La silhouette rose annonce la position rivale dans 0,9 s : aligne-la avec la chute. Les centres consécutifs donnent +20 par niveau après le premier, maximum +60 par tir. Un raté, tir décentré, bloqué ou sur ta voiture coupe la série. Ouvrir le parasol dans les 0,2 s avant un impact adverse donne une parade à 80 points au lieu de 40. Aucun bonus sur ses propres tirs.';game.ruleEn+=' The pink silhouette forecasts the rival car 0.9 s ahead: align it with the landing sight. Consecutive bullseyes give +20 per level after the first, capped at +60 per shot. A miss, off-center hit, block or own goal breaks the streak. Opening the umbrella within 0.2 s before an enemy impact gives an 80-point parry instead of 40. Own shots grant no block points.';}
 if(game.id==='lift'){game.ruleFr+=' Toutes les trois vagues, deux places sont dangereuses et le haricot est dans le gaz. K ou Respiration protège d’un seul impact pendant 0,55 s, recharge 3,2 s : un blocage rapporte 30 points. Chaque vague confirmée sans être touché augmente la série : +10 points par niveau, maximum +30 par vague. Une vague non jouée ou un coup reçu coupe la série.';game.ruleEn+=' Every third wave has two dangerous spots and the bean is in the gas. K or Breath blocks one impact for 0.55 s, cooldown 3.2 s; a block earns 30 points. Confirmed unhurt waves build a streak: +10 per level up to +30 per wave. An unplayed wave or a hit breaks the streak.';}
 if(game.id==='bombpass'){game.ruleFr+=' La moitié centrale de la zone donne une passe parfaite. Trois parfaits consécutifs personnels rendent un bouclier, maximum un. Une passe imprécise coupe la série. Le mode de groupe est en conception ; le jeu actuel reste un duel ou un entraînement.';game.ruleEn+=' The central half of the safe zone gives a perfect pass. Three consecutive personal perfect passes restore one shield, capped at one. An imprecise pass breaks the streak. Group mode remains in design; current play is a duel or practice.';}
}
export const COMPETITIVE_GAMES: CompetitiveGame[] = selection.map(entry=>({...ALL_GAMES.find(game=>game.id===entry.id)!,labelFr:entry.labelFr,labelEn:entry.labelEn}));
export function getCompetitiveGame(id:string):CompetitiveGame|undefined{
 return COMPETITIVE_GAMES.find(game=>game.id===id)||ALL_GAMES.find(game=>game.id===id);
}
export function gameHook(id:string,isFr:boolean){const entry=selection.find(game=>game.id===id);return entry?(isFr?entry.hookFr:entry.hookEn):'';}
export const SIGNATURE_GAMES=COMPETITIVE_GAMES.filter(game=>['table','garde','onemore'].includes(game.id));
export const GAME_CATEGORIES=[
 {id:'chaos',fr:'Bagarre',en:'Brawls',games:['chicken','table','garde','toilet','pie','lift']},
 {id:'precision',fr:'Coup de main',en:'Skill shots',games:['decoupe','pigeon']},
 {id:'risk',fr:'Ça va craquer',en:'Risk it',games:['onemore','bombpass','toilet','balloon']},
] as const;
export const isPartyGame=(id:string)=>['chicken','snack','pigeon','lift','pie','balloon','toilet','table','mat','garde','trace','decoupe','chroma','ricochet','contrepied','falsestart','onesecond','onemore'].includes(id);

export function gameLabel(id: string, isFr: boolean): string {
    const game = getCompetitiveGame(id);
    return game ? (isFr ? game.labelFr : game.labelEn) : id;
}

export function simpleGoal(id:string,fr:boolean){const p=(simplePlay as Record<string,{goalFr:string;goalEn:string}>)[id];return p?(fr?p.goalFr:p.goalEn):'';}
