import type {PartyState} from './party';
export interface GameMoment {kind:'success'|'skill'|'warning';fr:string;en:string;value?:string}
/** Describe only a change confirmed by the server. Never manufactures points. */
export function gameFeedback(before:PartyState,after:PartyState,id:string):GameMoment|null{
 if(before.id!==after.id||before.turn!==after.turn)return null;
 const cue=(fr:string,en:string,value?:string,kind:GameMoment['kind']='success'):GameMoment=>({fr,en,value,kind});
 if(after.snack&&before.snack){const a=before.snack.bodies.find(p=>p.id===id),b=after.snack.bodies.find(p=>p.id===id);if(!a||!b)return null;
  if(b.captures>a.captures)return cue(after.id==='chicken'?'Le roi est au bercail !':'Braquage réussi !',after.id==='chicken'?'The king is home!':'Heist complete!',`${b.captures} / 3`);
  if((b.interceptions||0)>(a.interceptions||0))return cue('Interception ! C’est pour moi.','Intercepted! Mine now.',undefined,'skill');
  if((b.supersUsed||0)>(a.supersUsed||0))return cue('Super déclenché !','Super unleashed!',undefined,'skill');
  if((b.superCharge||0)>=100&&(a.superCharge||0)<100)return cue('Super prêt. Choisis ton moment !','Super ready. Pick your moment!',undefined,'skill');
  if(b.kos>a.kos)return cue('Bien placé. Au suivant !','Clean hit. Next!',`${b.kos} KO`);
 }
 if(after.carnival&&before.carnival){const a=before.carnival.bodies.find(p=>p.id===id),b=after.carnival.bodies.find(p=>p.id===id);if(!a||!b)return null;
  if((b.targetBanks||0)>(a.targetBanks||0))return cue('Cible parfaite, encaissé !','Perfect target, banked!',`+${b.score-a.score}`, 'skill');
  if((b.blocks||0)>(a.blocks||0))return cue('Sabotage contré !','Sabotage blocked!',undefined,'skill');
  if((b.dodges||0)>(a.dodges||0))return cue('Esquive parfaite !','Perfect dodge!',undefined,'skill');
  if(b.score>a.score)return cue(after.id==='pie'?(b.combo>1?'Le combo de la honte !':'En pleine tarte !'):(b.shield&&!a.shield?'Encaissé. Casque gagné !':'Gonflé, mais encaissé.'),after.id==='pie'?(b.combo>1?'The shame combo!':'Pie delivered!'):(b.shield&&!a.shield?'Banked. Helmet earned!':'Big balloon. Safely banked.'),`+${b.score-a.score}`);
 }
 if(after.absurd&&before.absurd){const a=before.absurd.bodies.find(p=>p.id===id),b=after.absurd.bodies.find(p=>p.id===id);if(!a||!b)return null;
  if((b.parries||0)>(a.parries||0))return cue('Parade de dernière seconde !','Last-second parry!',undefined,'skill');
  if((b.perfects||0)>(a.perfects||0))return cue('Livraison plein pare-brise !','Windshield delivery!',`+${b.score-a.score}`,'skill');
  if(b.blocks>a.blocks)return cue(after.id==='lift'?'Bien retenu !':'Parasol au bon moment !',after.id==='lift'?'Held your breath!':'Perfect umbrella timing!',undefined,'skill');
  if(b.ownGoals>a.ownGoals)return cue('Oups. C’était ta voiture.','Oops. That was your car.',undefined,'warning');
  if(b.score>a.score)return cue(after.id==='pigeon'?'Livraison très spéciale !':b.pranks>a.pranks?'Coupable… et fier !':'Une place au frais.',after.id==='pigeon'?'Special delivery!':b.pranks>a.pranks?'Guilty… and proud!':'A breath of fresh air.',`+${b.score-a.score}`);
 }
 if(after.toilet&&before.toilet){const a=before.toilet.bodies.find(p=>p.id===id),b=after.toilet.bodies.find(p=>p.id===id);if(!a||!b)return null;
  if(b.flushes>a.flushes)return cue('Plouf ! Vise la sortie.','Splash! Find an escape route.',undefined,'warning');
  if(b.loot>a.loot)return cue(after.toilet.golden?'Coin-coin royal !':'Le butin monte !',after.toilet.golden?'Golden quack!':'The loot grows!',`+${b.loot-a.loot} 🦆`);
 }
 if(after.table&&before.table){const a=before.table.bodies.find(p=>p.id===id),b=after.table.bodies.find(p=>p.id===id);if(a&&b&&b.kos>a.kos)return cue('Un couvert en moins !','One less dinner guest!',`${b.kos} KO`);}
 if(after.id==='onemore'){const a=before.runs[id],b=after.runs[id];if(a&&b){
  if((b.repairs||0)>(a.repairs||0))return cue('Tour rafistolée !','Tower patched!',undefined,'skill');
  if((b.rescues||0)>(a.rescues||0))return cue('La bouée sauve les meubles !','Lifeline to the rescue!',undefined,'skill');
  if((b.level||0)>(a.level||0))return cue((b.perfects||0)>(a.perfects||0)?'Pile poil. Pas un bloc de travers.':'Ça tient. Pour l’instant.',(b.perfects||0)>(a.perfects||0)?'Perfect fit. Not a block out of line.':'Still standing. For now.',`${b.level}`,'skill');
 }}
 if(after.id==='decoupe'&&after.drawing&&before.drawing&&after.drawing.history.length>before.drawing.history.length){const result=after.drawing.history[after.drawing.history.length-1]?.results[id];if(result&&!result.expired)return cue((result.error??100)<=2?'Coupe de chef !':'Portion servie !',(result.error??100)<=2?'Chef’s cut!':'Portion served!',result.percent===undefined?undefined:`${result.percent} %`,'skill');}
 if(after.garde&&before.garde&&after.garde.history.length>before.garde.history.length){const h=after.garde.history[after.garde.history.length-1]!,rival=Object.keys(h.damage).find(p=>p!==id);if(rival&&(h.damage[rival]||0)>0)return cue(h.gags?.[rival]==='banana'?'Peau de banane. Grande chute.':'PIF. PAF. Bien lu !',h.gags?.[rival]==='banana'?'Banana peel. Big fall.':'BONK. Nice read!',`−${h.damage[rival]}`,'skill');}
 return null;
}
