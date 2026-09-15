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
    function sync(c, db, now) {
        let changed=false;
        const save=(userId,entry)=>{
            const user=db.users.find(u=>u.id===userId);
            if(!user || user.linkHistory?.some(h=>h.id===entry.id))return;
            if(user.linkHistory?.length>=100 && entry.completedAt<=user.linkHistory[user.linkHistory.length-1].completedAt)return;
            user.linkHistory=[entry,...(user.linkHistory||[])].sort((a,b)=>b.completedAt-a.completedAt).slice(0,100);
            changed=true;
        };
        for(const [userId,g] of Object.entries(c.attempts)) {
            if(g.phase!=='done' && Math.min(now,c.expiresAt)>=g.deadline){advance(g,Math.min(now,c.expiresAt));changed=true;}
            if(g.phase!=='done')continue;
            const host=c.attempts[c.hostId];
            const ownScore=g.scores[userId],hostScore=host.scores[c.hostId];
            const outcome=ownScore===hostScore?'draw':ownScore>hostScore?'win':'loss';
            const common={challengeId:c.id,gameId:c.gameId,completedAt:g.deadline,expiresAt:c.expiresAt};
            save(userId,{...common,id:`${c.id}:${userId}`,score:ownScore,
                opponentName:userId===c.hostId?null:db.users.find(u=>u.id===c.hostId)?.playerName||'Player',
                opponentScore:userId===c.hostId?null:hostScore,outcome:userId===c.hostId?'created':outcome});
            if(userId!==c.hostId)save(c.hostId,{...common,id:`${c.id}:vs:${userId}`,score:hostScore,opponentScore:ownScore,
                opponentName:db.users.find(u=>u.id===userId)?.playerName||'Player',outcome:outcome==='draw'?'draw':outcome==='win'?'loss':'win'});
        }
        return changed;
    }
    return {
        listLinkChallenges(body) {
            const db=store.read(),now=clock();
            if(!authorized(db,body))return fail('Session unavailable',403);
            let changed=false;
            const challenges=(db.linkChallenges||[]).filter(c=>c.hostId===body.userId||c.attempts[body.userId]).map(c=>{
                changed=sync(c,db,now)||changed;
                const own=c.attempts[body.userId],visible=own?.phase==='done';
                const finished=Object.entries(c.attempts).filter(([,g])=>g.phase==='done').sort((a,b)=>b[1].scores[b[0]]-a[1].scores[a[0]]);
                return {...metadata(c,db),createdAt:c.createdAt,isHost:c.hostId===body.userId,
                    expired:c.expiresAt<=now,status:own?.phase==='done'?'done':own?'playing':'draft',
                    participantCount:Object.keys(c.attempts).length,finishedCount:finished.length,
                    standings:visible?finished.map(([id,g])=>({userId:id,name:db.users.find(u=>u.id===id)?.playerName||'Player',
                        score:g.scores[id],rank:finished.findIndex(([p,game])=>game.scores[p]===g.scores[id])+1,isSelf:id===body.userId,isHost:id===c.hostId})):[]};
            }).sort((a,b)=>b.createdAt-a.createdAt);
            if(changed)store.write(db);
            return {ok:true,challenges,history:db.users.find(u=>u.id===body.userId).linkHistory||[]};
        },
        createLinkChallenge(body) {
            const db=store.read(), now=clock();
            if(!authorized(db,body))return fail('Session unavailable',403);
            if(!['trace','decoupe','chroma'].includes(body.gameId))return fail('Unsupported link game',400);
            for(const c of db.linkChallenges||[])if(c.expiresAt<=now)sync(c,db,now);
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
            if(sync(c,db,now)||before!==JSON.stringify(g))store.write(db);
            return response(c,db,body.userId,now);
        },
    };
}
module.exports={createLinkChallenges};
