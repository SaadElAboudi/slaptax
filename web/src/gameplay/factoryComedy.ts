import type {PartyState} from './party';
import type {GameMoment} from './gameFeedback';

/** Narrative suggestions only: never unlocks games, changes rules or awards tokens. */
const episodes = [
 {game:'snack',fr:'Opération casse-croûte',en:'Operation snack attack',lineFr:'L’Intendant a mis un cadenas sur les biscuits. Il a oublié la caisse entière.',lineEn:'The Steward locked the biscuits. He forgot about the whole crate.'},
 {game:'decoupe',fr:'La part du patron',en:'The boss’s share',lineFr:'Le chef réclame 50 % du butin. Son calcul inclut déjà trois desserts.',lineEn:'The chef demands 50% of the loot. His maths already includes three desserts.'},
 {game:'onemore',fr:'Le stock est presque stable',en:'The stock is almost stable',lineFr:'« Empilez discrètement », a dit le chef. On voit votre tour depuis le parking.',lineEn:'“Stack quietly,” said the chef. Your tower is visible from the car park.'},
 {game:'bombpass',fr:'Service après-casse',en:'After-heist service',lineFr:'L’Intendant accepte votre réclamation. Il l’a emballée avec une mèche.',lineEn:'The Steward accepted your complaint. He wrapped it with a fuse.'},
] as const;
export function factoryEpisode(completed:number){return episodes[Math.max(0,Math.floor(Number.isFinite(completed)?completed:0))%episodes.length];}
export function factoryAftermath(game:string,fr:boolean){
 const lines:Record<string,[string,string]>={
 snack:['L’Intendant compte les miettes. Il manque surtout les caisses.','The Steward counts the crumbs. Mostly, the crates are missing.'],
 chicken:['Le poulet exige désormais une loge et deux gardes du corps.','The chicken now demands a dressing room and two bodyguards.'],
 decoupe:['Le chef a mesuré les parts. Avec sa bouche.','The chef measured the portions. With his mouth.'],
 onemore:['Le stock tient debout. Le responsable sécurité, beaucoup moins.','The stock is standing. The safety officer is not.'],
 bombpass:['Votre réclamation a été traitée. Le bureau aussi.','Your complaint has been processed. So has the office.'],
 pigeon:['Le parking brille. Personne ne veut savoir pourquoi.','The car park shines. Nobody wants to know why.'],
 lift:['La réunion est annulée. Pour raisons atmosphériques.','The meeting is cancelled. Due to atmospheric conditions.'],
 pie:['La pâtisserie ferme pour nettoyage des collègues.','The bakery is closed for staff cleaning.'],
 balloon:['La chaudière réclame des vacances. Et un pantalon plus large.','The boiler demands a holiday. And bigger trousers.'],
 toilet:['Les canards refusent de témoigner sans leur avocat.','The ducks refuse to speak without their lawyer.'],
 table:['La table est réservée au nom de « Pas moi ».','The table is booked under “Wasn’t me”.'],
 garde:['Les ressources humaines ont confisqué la banane.','Human resources confiscated the banana.'],
 };
 return lines[game]?.[fr?0:1]??(fr?'L’Intendant demande les images. La brigade a mangé les preuves.':'The Steward wants footage. The crew ate the evidence.');
}
/** Sparse, server-confirmed dramatic beats; no timer-based random interruptions. */
export function canteenDrama(before:PartyState,after:PartyState,id:string):GameMoment|null{
 if(before.id!==after.id||before.turn!==after.turn||!after.snack||!before.snack||after.phase!=='brawl'||before.phase!=='brawl')return null;
 const a=before.snack,b=after.snack,self=b.bodies.find(p=>p.id===id),old=a.bodies.find(p=>p.id===id);if(!self||!old)return null;
 const score=(s:typeof b,p:typeof self)=>s.teamScores?.[p.team??p.slot]??p.captures;
 const rival=b.bodies.find(p=>(p.team??p.slot)!==(self.team??self.slot));
 const own=score(b,self),prior=score(a,old),opponent=rival?score(b,rival):0;
 if(own>prior&&own===opponent&&prior<opponent)return {kind:'skill',fr:'ÉGALITÉ ! L’Intendant avale son sifflet.',en:'TIED! The Steward swallowed his whistle.',value:`${own} – ${opponent}`};
 if(before.remaining>15000&&after.remaining<=15000&&after.remaining>0)return {kind:'warning',fr:'15 s ! La pause goûter est officiellement hors contrôle.',en:'15s! Snack time is officially out of control.'};
 return null;
}
