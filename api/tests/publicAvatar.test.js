const test=require('node:test'),assert=require('node:assert/strict');
const {publicAvatar}=require('../domain/publicAvatar');
const {createSurvivalRooms}=require('../games/survivalRooms');
test('public identity uses only known cosmetic identifiers',()=>{assert.equal(publicAvatar(null),'spark');assert.equal(publicAvatar({progression:{cosmetics:{avatar:'crown'}}}),'crown');assert.equal(publicAvatar({progression:{cosmetics:{avatar:'<script>'}}}),'spark');});
test('survival lobby broadcasts the stored avatar and ignores a forged join avatar',()=>{
 const users=[{id:'human',name:'Friend',progression:{cosmetics:{avatar:'crown'}}}],events=[];
 const manager=createSurvivalRooms({read:()=>({users})},(c,e)=>events.push(e)),c={userId:'human',readyState:1};manager.attach(c);manager.handle(c,{type:'survival.create',avatar:'phantom'});
 assert.equal(events.at(-1).players[0].avatar,'crown');users[0].progression.cosmetics.avatar='visor';manager.handle(c,{type:'survival.ready'});assert.equal(events.at(-1).players[0].avatar,'visor');manager.close();
});
test('duel room returns both server-selected identities and rejects nonparticipants',()=>{
 const {makeDefaultState}=require('../infrastructure/db'),{createService}=require('../application/service');let db=makeDefaultState();const service=createService({read:()=>db,write:next=>{db=next;}});
 const a=service.createUser('Identity A').user,b=service.createUser('Identity B').user;
 for(const id of [a.id,b.id])db.users.find(u=>u.id===id).progression={xp:20000};
 assert.equal(service.setCosmetics(a.id,{avatar:'crown'}).ok,true);assert.equal(service.setCosmetics(b.id,{avatar:'visor'}).ok,true);
 const made=service.createDuel(a.id,b.id,2);assert.equal(made.ok,true);const id=made.duel.id;
 assert.deepEqual(service.getDuelRoomStatus(id,a.id).room.avatars,{[a.id]:'crown',[b.id]:'visor'});
 service.setCosmetics(b.id,{avatar:'phantom'});assert.equal(service.getDuelRoomStatus(id,a.id).room.avatars[b.id],'phantom');assert.equal(service.getDuelRoomStatus(id,'outsider').code,403);
});
