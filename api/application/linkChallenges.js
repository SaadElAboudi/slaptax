const { randomUUID, randomInt } = require('node:crypto');
const { drawingTarget } = require('../games/drawing');
const { createParty, beginParty, actParty, tickParty, publicParty } = require('../games/partyGames');

const fail = (error, code) => ({ error, code });
function createLinkChallenges(store, clock = Date.now) {
    function authorized(db, body) {
        return body && typeof body === 'object' && typeof body.clientId === 'string' && db.clientSessions?.[body.clientId] === body.userId
            && db.users.some((u) => u.id === body.userId);
    }
    function metadata(c, db) {
        return { id:c.id, gameId:c.gameId, hostName:db.users.find((u)=>u.id===c.hostId)?.playerName || 'Player',
            expiresAt:c.expiresAt, published:c.attempts[c.hostId]?.phase==='done' };
    }
    function advance(g, now) {
        // Catch up from server deadlines, not poll time: reloads never extend an attempt.
        for (let i=0;i<16&&!['done','draw'].includes(g.phase)&&now>=g.deadline;i++) tickParty(g,g.deadline);
    }
    function response(c, db, userId, now) {
        const g=c.attempts[userId];
        const result={ok:true,challenge:metadata(c,db),party:g?publicParty(g,userId,now):null};
        if(g?.phase==='done') {
            const host=c.attempts[c.hostId];
            result.result={ownScore:g.scores[userId],hostScore:host.scores[c.hostId],
                hostId:c.hostId, ownHistory:g.drawing?.history || [],hostHistory:host.drawing?.history || [],
                ownColors:g.colorHistory || [],hostColors:host.colorHistory || [],isHost:userId===c.hostId};
        }
        return JSON.parse(JSON.stringify(result));
    }
    return {
        createLinkChallenge(body) {
            const db=store.read(), now=clock();
            if(!authorized(db,body))return fail('Session unavailable',403);
            if(!['trace','decoupe','chroma'].includes(body.gameId))return fail('Unsupported link game',400);
            const existing=(db.linkChallenges||[]).filter((c)=>c.expiresAt>now);
            if(existing.length>=5000||existing.filter((c)=>c.hostId===body.userId&&now-c.createdAt<86400000).length>=20)return fail('Challenge limit reached',429);
            const c={id:randomUUID(),gameId:body.gameId,hostId:body.userId,createdAt:now,expiresAt:now+7*86400000,
                targets:[1,2,3].map((i)=>body.gameId==='chroma'?[randomInt(24,232),randomInt(24,232),randomInt(24,232)]:drawingTarget(body.gameId,i,randomInt)),attempts:{}};
            db.linkChallenges=[...existing,c];store.write(db);
            return {ok:true,challenge:metadata(c,db)};
        },
        getLinkChallenge(id) {
            const db=store.read(), c=db.linkChallenges?.find((c)=>c.id===id);
            if(!c)return fail('Challenge not found',404);
            if(c.expiresAt<=clock())return fail('Challenge expired',410);
            return {ok:true,challenge:metadata(c,db)};
        },
        playLinkChallenge(id, operation, body) {
            const db=store.read(), now=clock();
            if(!authorized(db,body))return fail('Session unavailable',403);
            const c=db.linkChallenges?.find((c)=>c.id===id);
            if(!c)return fail('Challenge not found',404);
            if(c.expiresAt<=now)return fail('Challenge expired',410);
            const host=c.attempts[c.hostId];
            if(host && host.phase!=='done' && now>=host.deadline) { advance(host,now);store.write(db); }
            if(body.userId!==c.hostId&&c.attempts[c.hostId]?.phase!=='done')return fail('Creator has not finished',409);
            let g=c.attempts[body.userId];
            if(operation==='start'&&!g) {
                if(Object.keys(c.attempts).length>=1000)return fail('Challenge is full',429);
                g=createParty(c.gameId,[body.userId]);
                if(c.gameId==='chroma')g.colorTargets=c.targets;else g.drawingTargets=c.targets;
                beginParty(g,now);
                delete g.random;
                c.attempts[body.userId]=g;store.write(db);
            }
            if(!g)return response(c,db,body.userId,now);
            const before=JSON.stringify(g);advance(g,now);
            if(operation==='action') {
                if(!actParty(g,body.userId,body,now)) {
                    if(before!==JSON.stringify(g))store.write(db);
                    return fail('Stroke unavailable or deadline reached',409);
                }
            }
            if(before!==JSON.stringify(g))store.write(db);
            return response(c,db,body.userId,now);
        },
    };
}
module.exports={createLinkChallenges};
