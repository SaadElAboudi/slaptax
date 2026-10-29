const rules=require('../../shared/party-refinement.json').bomb;
function recordBombPass(game,id,now,hit){
 const ability=game.abilities[id],wave=((now-game.markerStartedAt)/1000*game.markerSpeed)%2,marker=wave<=1?wave:2-wave;
 const perfect=hit&&Math.abs(marker-game.safeCenter)<=game.safeWidth*rules.perfectFraction;
 ability.streak=perfect?(ability.streak||0)+1:0;
 if(perfect)ability.perfects=(ability.perfects||0)+1;
 const recharge=ability.streak>=rules.perfectsForShield;
 if(recharge){ability.shield=1;ability.streak=0;}
 return recharge?'recharge':perfect?'perfect':'pass';
}
module.exports={recordBombPass};
