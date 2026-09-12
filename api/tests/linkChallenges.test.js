const test=require('node:test');
const assert=require('node:assert/strict');
const {createLinkChallenges}=require('../application/linkChallenges');
const {makeDefaultState}=require('../infrastructure/db');
const {createService}=require('../application/service');
function setup(){let db=makeDefaultState(),now=100000;const store={read:()=>structuredClone(db),write:(d)=>{db=structuredClone(d);}};
    const service=createService(store),a=service.joinSession('Host','ca').userId,b=service.joinSession('Friend','cb').userId;
    const api=createLinkChallenges(store,()=>now),host={userId:a,clientId:'ca'},friend={userId:b,clientId:'cb'};
    return {store,api,host,friend,advance:(n)=>{now+=n;},restart:()=>createLinkChallenges(store,()=>now)};}
function finish(f,id,user){let data=f.api.playLinkChallenge(id,'start',user);
    for(let i=0;i<3;i++){
        f.advance(2000);data=f.api.playLinkChallenge(id,'state',user);
        const target=data.party.drawing.target;
        if(data.challenge.gameId==='trace'){f.advance(2000);data=f.api.playLinkChallenge(id,'state',user);}
        data=f.api.playLinkChallenge(id,'action',{...user,action:'lock',turn:data.party.turn,points:target.path||[[.5,0],[.5,1]],side:1});
        assert.equal(data.ok,true);f.advance(2800);data=f.api.playLinkChallenge(id,'state',user);
    }return data;}
for(const gameId of ['trace','decoupe'])test(`${gameId} link scores are server-owned, persisted, private until completion, and wallet-neutral`,()=>{
    const f=setup(),before=f.store.read().users.map(u=>u.wallet);
    const {challenge}=f.api.createLinkChallenge({...f.host,gameId});
    assert.equal(f.api.playLinkChallenge(challenge.id,'start',f.friend).code,409);
    const host=finish(f,challenge.id,f.host);assert.equal(host.party.phase,'done');assert.equal(host.result.isHost,true);
    const publicInfo=f.api.getLinkChallenge(challenge.id);assert.equal(publicInfo.challenge.published,true);
    assert.equal(JSON.stringify(publicInfo).includes('Score'),false);assert.equal(JSON.stringify(publicInfo).includes('targets'),false);
    const friend=f.api.playLinkChallenge(challenge.id,'start',f.friend);assert.equal(friend.result,undefined);
    assert.equal(friend.party.drawing.target,undefined);assert.deepEqual(friend.party.drawing.history,[]);
    const end=finish(f,challenge.id,f.friend);assert.equal(end.result.hostScore,host.result.ownScore);
    assert.deepEqual(end.result.hostHistory.map(e=>e.target),end.result.ownHistory.map(e=>e.target));
    assert.deepEqual(f.restart().playLinkChallenge(challenge.id,'start',f.friend).result,end.result);
    assert.deepEqual(f.store.read().users.map(u=>u.wallet),before);
});
test('link sessions reject impersonation, unsupported games, duplicates, stale input, and expired invitations',()=>{
    const f=setup();assert.equal(f.api.createLinkChallenge({...f.host,clientId:'cb',gameId:'trace'}).code,403);
    assert.equal(f.api.createLinkChallenge({...f.host,gameId:'bounce'}).code,400);
    const {challenge}=f.api.createLinkChallenge({...f.host,gameId:'trace'});
    const first=f.api.playLinkChallenge(challenge.id,'start',f.host);f.advance(1000);
    const second=f.api.playLinkChallenge(challenge.id,'start',f.host);assert.ok(second.party.remaining<first.party.remaining);
    f.advance(4000);const draw=f.api.playLinkChallenge(challenge.id,'state',f.host);
    assert.equal(f.api.playLinkChallenge(challenge.id,'action',{...f.host,turn:draw.party.turn-1,action:'lock',points:[[0,0],[1,1]],score:99999}).code,409);
    f.advance(7*86400000);assert.equal(f.api.getLinkChallenge(challenge.id).code,410);
    assert.equal(f.api.playLinkChallenge(challenge.id,'start',f.host).code,410);
});
test('an unattended link attempt expires on original deadlines even after a process restart',()=>{
    const f=setup(),{challenge}=f.api.createLinkChallenge({...f.host,gameId:'trace'});
    f.api.playLinkChallenge(challenge.id,'start',f.host);f.advance(60000);
    const result=f.restart().playLinkChallenge(challenge.id,'state',f.host);
    assert.equal(result.party.phase,'done');assert.equal(result.result.ownScore,0);
    assert.equal(result.result.ownHistory.length,3);
});
test('challenge creation is bounded per session',()=>{
    const f=setup();for(let i=0;i<20;i++)assert.equal(f.api.createLinkChallenge({...f.host,gameId:'trace'}).ok,true);
    assert.equal(f.api.createLinkChallenge({...f.host,gameId:'trace'}).code,429);
});
