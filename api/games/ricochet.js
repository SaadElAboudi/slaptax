const { Engine, Bodies, Body, Composite } = require('matter-js');

const SIZE = 600, RADIUS = 14, STEPS = 360;
const origin = (side, attempt) => side === 0
    ? { x: [180,300,420][attempt-1], y:550 }
    : { x: [420,300,180][attempt-1], y:50 };

function prepareRicochet(g, now) {
    g.phase = 'aim'; g.deadline = now + 10000;
    g.responses = {}; g.frames = []; g.pucks ||= [];
}

function simulate(pucks, shots, players, attempt) {
    const engine = Engine.create({ gravity:{x:0,y:0,scale:0}, positionIterations:8 });
    const wall = (x,y,w,h) => Bodies.rectangle(x,y,w,h,{isStatic:true,restitution:.9,friction:0});
    Composite.add(engine.world,[wall(300,-15,660,30),wall(300,615,660,30),
        wall(-15,110,30,220),wall(-15,490,30,220),wall(615,110,30,220),wall(615,490,30,220)]);
    const entries = pucks.map((p) => ({...p}));
    for (const [side,owner] of players.entries()) if (shots[owner]) entries.push({id:`${attempt}-${side}`,owner,...origin(side,attempt),fresh:true});
    const bodies = entries.map((p) => {
        const body = Bodies.circle(p.x,p.y,RADIUS,{restitution:.86,friction:0,frictionStatic:0,frictionAir:.015});
        if(p.fresh) {
            const shot=shots[p.owner], side=players.indexOf(p.owner), angle=shot.angle*Math.PI/180;
            const speed=3+shot.power*.11, sign=side===0 ? 1 : -1;
            Body.setVelocity(body,{x:Math.sin(angle)*speed*sign,y:-Math.cos(angle)*speed*sign});
        }
        return {id:p.id,owner:p.owner,body,out:false};
    });
    Composite.add(engine.world,bodies.map((p)=>p.body));
    // Precompute at fixed steps so socket timing cannot change collision results.
    const frames=[];
    for(let step=0;step<=STEPS;step++) {
        if(step) { Engine.update(engine,1000/120); Engine.update(engine,1000/120); }
        for(const p of bodies) if(!p.out && (p.body.position.x < -RADIUS || p.body.position.x > SIZE+RADIUS)) {
            p.out=true; Composite.remove(engine.world,p.body);
        }
        frames.push(bodies.filter((p)=>!p.out).map((p)=>({id:p.id,owner:p.owner,
            x:Math.round(p.body.position.x*100)/100,y:Math.round(p.body.position.y*100)/100})));
    }
    Composite.clear(engine.world,false); Engine.clear(engine);
    return frames;
}

function launch(g,now) {
    g.replay=[];
    g.frames=simulate(g.pucks,g.responses,g.players,g.attempt);
    g.shotAt=now;g.phase='flight';g.deadline=now+6000;
}

function actRicochet(g,id,action,now) {
    if(g.phase!=='aim' || g.responses[id]) return false;
    if(action.action!=='shoot' || !Number.isFinite(action.angle) || !Number.isFinite(action.power)
        || action.angle < -70 || action.angle > 70 || action.power < 1 || action.power > 100) return false;
    g.responses[id]={angle:action.angle,power:action.power};
    if(g.players.every((p)=>g.responses[p])) launch(g,now);
    return true;
}

function tickRicochet(g,now,conclude,next) {
    if(g.phase==='aim' && now>=g.deadline) launch(g,now);
    if(g.phase==='flight') {
        g.pucks=g.frames[Math.min(STEPS,Math.max(0,Math.floor((now-g.shotAt)*.06)))];
        if(now>=g.deadline) {
            for(const id of g.players) {
                const own=g.pucks.filter((p)=>p.owner===id);
                g.scores[id]=own.length ? 10000-Math.round(Math.min(...own.map((p)=>Math.hypot(p.x-300,p.y-300)))*10) : 0;
            }
            g.phase='reveal';g.deadline=now+1600;
        }
    } else if(g.phase==='reveal' && now>=g.deadline) {
        if(g.attempt===3) conclude(g,'ricochet-nearest-puck'); else next(g,now);
    }
}

function publicRicochet(g) {
    return {pucks:g.pucks || [],origins:Object.fromEntries(g.players.map((id,side)=>[id,origin(side,Math.max(1,g.attempt))])),size:SIZE};
}
module.exports={prepareRicochet,actRicochet,tickRicochet,publicRicochet,simulate};
