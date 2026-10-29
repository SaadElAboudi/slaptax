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
 {id:'chicken',labelFr:'Poule Position',labelEn:'Poultry Panic',skillFr:'Arène · capture · lancer',skillEn:'Arena · capture · throw',ruleFr:'60 secondes, premier à 3 poulets livrés. À la fin du temps, les livraisons puis les KO départagent ; égalité : revanche commune. Attrape le poulet couronné et rapporte-le au poulailler de ta couleur. Il fuit au sol et s’échappe après 5,5 secondes dans tes bras : lance-le puis rattrape-le pour traverser le terrain ! Un œuf géant vise une position toutes les 7 secondes, annoncée 1,4 seconde avant ; la zone ne suit plus le joueur. L’impact repousse et fait lâcher le poulet, sans retirer de PV ; esquiver au bon moment évite l’impact. Les 15 dernières secondes, les œufs arrivent toutes les 3,5 secondes. Commandes : stick gauche ou ZQSD/flèches pour bouger ; vise et relâche le stick droit, clic ou J pour baffer/lancer ; Espace pour esquiver, E pour ton pouvoir. Trois combattants disponibles, 4 ou 5 PV ; retour après KO en 2,4 secondes. Entraînement contre un bot annoncé. Défis et challenges en duel humain, tournois via la même arène. Pas de salon 2v2 pour ce jeu.',ruleEn:'60 seconds, first to 3 delivered chickens. At the time limit, deliveries then KOs decide; ties require mutual replay. Catch the crowned chicken and bring it to your colored coop. It runs away on the ground and escapes after 5.5 seconds held: throw and catch it to cross the arena! A giant egg targets a fixed position every 7 seconds with a 1.4-second warning. The impact knocks players back and drops the chicken without health damage; a timely evade avoids it. In the final 15 seconds eggs arrive every 3.5 seconds. Move with the left stick or WASD/arrows; aim and release the right stick, click or J to slap/throw; Space evades, E uses your ability. Three fighters, 4 or 5 HP; respawn in 2.4 seconds. Practice against a declared bot. Friend challenges and invitations use human duels; tournaments use the same arena. No private 2v2 room for this game.'},

 {id:'snack',labelFr:'Braquage du Goûter',labelEn:'Snack Heist',skillFr:'Arène · visée · esquive',skillEn:'Arena · aim · evade',ruleFr:'Récupère la boîte au centre et rapporte-la au dépôt de ta couleur. Premier à trois livraisons, ou 90 secondes : livraisons puis KO départagent. Déplace-toi au stick gauche ou avec ZQSD/WASD/flèches. Vise puis relâche le stick droit : baffe à mains vides, lancer quand tu portes ; souris et clic sur ordinateur. Les bancs font rebondir la boîte, que les joueurs peuvent attraper au vol. Esquive avec le bouton, Espace ou Maj. Les bancs bloquent les coups. 4 ou 5 PV selon le combattant, réapparition en 2,4 s. Porter ralentit ; un KO fait lâcher la boîte. Choisis ton combattant au briefing, utilise son pouvoir avec E ou le bouton. Solo contre un bot annoncé, vrai duel humain, ou salon privé 2v2 à quatre amis depuis l’accueil. Égalité : revanche commune.',ruleEn:'Grab the central box and bring it to your colored depot. First to three deliveries, or 90 seconds: deliveries then knockouts decide. Move with the left stick or WASD/arrows. Aim and release the right stick: slap empty-handed, throw while carrying; aim and click on desktop. Benches bounce the box and players can catch it in flight. Evade with the button, Space or Shift. Benches block hits. Four or five health by fighter, respawn in 2.4 seconds. Carrying slows you down; a knockout drops the box. Choose a fighter in the briefing; E or the ability button uses their power. Declared practice bot, real human duel, or a private four-friend 2v2 room from home. Tied duels require mutual replay.'},
 {id:'pigeon',labelFr:'Pigeon Express',labelEn:'Pigeon Express',skillFr:'Pilotage + balistique',skillEn:'Flight + ballistics',ruleFr:'24 secondes. Glisse pour déplacer ton pigeon ou utilise le curseur. Au clavier : flèches ou A/D pour voler, J pour larguer, K pour le parasol. Largue sur la voiture rose du rival : 100 points, 180 au centre. La fiente tombe en 0,9 seconde et dérive avec le vent. Toucher ta propre voiture coûte 50 points. Ton parasol protège ta voiture pendant 0,65 seconde, rechargeable en 2,8 secondes ; bloquer un tir adverse rapporte 40 points. Un largage par seconde. Solo contre un bot annoncé ; duel entre deux humains. Égalité : rejouez ensemble.',ruleEn:'24 seconds. Slide to move your pigeon or use the slider. Keyboard: arrows or A/D fly, J drops, K opens the umbrella. Drop onto the rival pink car: 100 points, 180 bullseye. Droppings fall for 0.9 seconds and drift with the wind. Hitting your own car costs 50 points. Your umbrella covers your car for 0.65 seconds every 2.8 seconds; blocking a rival shot earns 40 points. One drop per second. Solo against a declared bot; two humans in duels. Tied duels need a mutual replay.'},
 {id:'lift',labelFr:'Ascenseur à Prouts',labelEn:'Elevator of Farts',skillFr:'Esquive + coups bas',skillEn:'Dodging + dirty tricks',ruleFr:'22 secondes. Au clavier : 1, 2 ou 3 pour la place, Espace pour le prout. Choisis une place à chaque passage : un nuage vert est annoncé 0,7 seconde avant. Une place sûre confirmée rapporte 80 points ; le haricot ajoute 40 points. Deux haricots rechargent un prout, deux maximum. PROUT CIBLÉ vise la place actuelle du rival et frappe 0,7 seconde après : il peut esquiver ! Un piège réussi rapporte 100 points, le rival perd 60 ; un nuage coûte aussi 60 points. Les points restent positifs. Un prout toutes les trois secondes. Solo contre un bot annoncé ; duel à deux humains. Égalité : rejouez ensemble.',ruleEn:'22 seconds. Keyboard: 1, 2 or 3 picks a spot, Space uses a fart. Pick a spot every wave: a green cloud is announced 0.7 seconds ahead. A confirmed safe spot earns 80 points; a bean adds 40. Two beans refill one fart, up to two. TARGETED FART locks the rival current spot and lands 0.7 seconds later: they can dodge! A successful trap earns 100 points and costs the rival 60; a cloud also costs 60. Scores stay nonnegative. One fart every three seconds. Solo against a declared bot; two humans in duels. Tied duels need a mutual replay.'},
 {id:'pie',labelFr:'Tarte ta Face',labelEn:'Pie in Your Face',skillFr:'Feinte + visée + esquive',skillEn:'Juke + aim + dodge',ruleFr:'22 secondes. Au clavier : flèches pour le placement, J pour lancer, K pour esquiver. Glisse dans la moitié basse pour prendre le contrôle du placement ; sinon le déplacement reste assisté. Touche la moitié haute pour viser et lancer, ou utilise les curseurs et les boutons : elle arrive après 0,35 seconde. Une touche rapporte 100 points, 200 en plein centre ; les touches consécutives ajoutent un bonus jusqu’à 75 points. Une tarte toutes les 0,95 seconde. Esquive pendant 0,45 seconde, rechargeable en 2,2 secondes. Esquiver une tarte qui allait te toucher prépare une grosse tarte : visée plus large, +100 points à la touche suivante. Le plus de points gagne. Solo contre un bot déclaré, duel à deux humains ; égalité à rejouer ensemble.',ruleEn:'22 seconds. Keyboard: arrows move, J throws, K ducks. Drag in the lower half to take control of movement; otherwise movement stays assisted. Tap the upper half to aim and throw, or use the sliders and buttons: pies arrive after 0.35 seconds. A hit earns 100 points, a bullseye 200; consecutive hits add up to 75 bonus points. One pie every 0.95 seconds. Duck for 0.45 seconds every 2.2 seconds. Dodge an incoming hit to earn a mega pie: wider aim and +100 points on its next hit. Highest score wins. Solo against a declared bot, two humans in duels; tied duels need a mutual replay.'},
 {id:'balloon',labelFr:'Gonfle ou Pète',labelEn:'Pump or Pop',skillFr:'Risque + sabotage',skillEn:'Risk + sabotage',ruleFr:'22 secondes. Au clavier : Espace maintenu pour gonfler, relâche pour encaisser, K pour saboter. Maintiens pour gonfler, relâche pour encaisser : volume au carré divisé par 20 points. Chaque ballon explose à un seuil secret entre 78 et 108 %. Dès 70 %, attention ! Explosion : seul le ballon courant est perdu. Pour 25 points encaissés, ajoute 12 % au ballon adverse, toutes les quatre secondes. Encaisser à 70 % ou plus donne un casque passoire : il bloque un sabotage, sans cumul. Une attaque exige un ballon adverse déjà gonflé à 10 %. Le plus de points gagne. Solo contre un bot déclaré ; duel à deux humains. Égalité à rejouer ensemble.',ruleEn:'22 seconds. Keyboard: hold Space to pump, release to bank, K to sabotage. Hold to pump, release to bank: squared volume divided by 20 points. Each balloon bursts at a hidden limit between 78 and 108%. Watch out above 70%! A pop only loses the current balloon. Spend 25 banked points to add 12% to the rival balloon, every four seconds; their balloon must already be at 10%. Bank at 70% or above to earn a helmet blocking one sabotage; helmets do not stack. Highest score wins. Solo against a declared bot; two humans in duels. Tied duels need a mutual replay.'},
    {id:'toilet',labelFr:'Panique aux Toilettes',labelEn:'Toilet Panic',skillFr:'Pilotage + braquage',skillEn:'Driving + duck heist',ruleFr:'Pilote ta toilette avec le doigt, ZQSD/WASD ou les flèches. Ramasse les canards : le plus gros butin après 25 secondes gagne. Prout turbo toutes les 2,8 secondes : percute un rival pour lui voler un canard. La chasse revient toutes les six secondes ; tomber dans le trou fait perdre jusqu’à trois canards et te fait repartir. Les canards dorés des sept dernières secondes valent trois. Solo contre trois bots déclarés ; duel à deux humains. Égalité en duel : rejouez ensemble.',ruleEn:'Hold and drag or use WASD/arrows to drive your toilet. Most ducks after 25 seconds wins. Fart turbo every 2.8 seconds: hit a rival to steal a duck. A flush comes every six seconds; falling into the drain costs up to three ducks and respawns you. Gold ducks in the final seven seconds are worth three. Solo against three declared bots; duel with two humans. Tied duels need a mutual replay.'},
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
