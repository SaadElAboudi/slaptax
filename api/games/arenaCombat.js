const rules=require('../../shared/arena-combat.json');
function initializeCombat(p,now){Object.assign(p,{ammo:rules.ammoCapacity,ammoNextAt:now+rules.ammoReloadMs,superCharge:0,supersUsed:0,superResolveAt:0,wardUntil:0,wardCharges:0,regenAt:now+rules.regenDelayMs,passChargeAt:0});}
function chargeSuper(p,amount){p.superCharge=Math.min(rules.superMax,Math.max(0,(p.superCharge||0)+amount));}
function advanceAmmo(p,now){while(p.ammo<rules.ammoCapacity&&now+.001>=p.ammoNextAt){p.ammo++;p.ammoNextAt+=rules.ammoReloadMs;}if(p.ammo===rules.ammoCapacity)p.ammoNextAt=now+rules.ammoReloadMs;}
function spendAmmo(p,now){advanceAmmo(p,now);if(p.ammo<=0)return false;if(p.ammo===rules.ammoCapacity)p.ammoNextAt=now+rules.ammoReloadMs;p.ammo--;return true;}
function combatActivity(p,now){p.regenAt=now+rules.regenDelayMs;}
function tickCombat(p,now,maxHp,carrying){advanceAmmo(p,now);if(carrying){p.regenAt=now+rules.regenDelayMs;return false;}if(p.hp<maxHp&&now>=p.regenAt){p.hp++;p.regenAt=now+rules.regenIntervalMs;return true;}return false;}
module.exports={rules,initializeCombat,chargeSuper,spendAmmo,combatActivity,tickCombat};
