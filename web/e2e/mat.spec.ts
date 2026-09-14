import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
import {Chess} from 'chess.js';
import type {MatState} from '../src/gameplay/party';

async function player(request:APIRequestContext,name:string){const clientId=crypto.randomUUID();const res=await request.post('/api/session/join',{data:{clientId,playerName:name}});expect(res.ok()).toBe(true);return {clientId,playerName:name,userId:(await res.json()).userId as string};}
async function identify(page:Page,user:Awaited<ReturnType<typeof player>>,lang='en'){await page.addInitScript(({u,lang})=>{for(const [key,value]of Object.entries({onboarded:'1',lang,client_id:u.clientId,user_id:u.userId,player_name:u.playerName}))localStorage.setItem('slaptax_'+key,value);},{u:user,lang});}
function watch(page:Page){let mat:MatState|undefined;page.on('websocket',ws=>ws.on('framereceived',frame=>{try{const event=JSON.parse(String(frame.payload));if(event.type==='arena.state'&&event.party?.mat)mat=event.party.mat;}catch{}}));return ()=>mat;}
async function playMove(page:Page,move:string,mobile:boolean){for(const square of [move.slice(0,2),move.slice(2,4)]){const button=page.getByTestId('mat-board').locator(`[data-square="${square}"]`);if(mobile)await button.tap();else await button.click();}if(move[4])await page.getByRole('button',{name:new RegExp(`Promote to ${({q:'queen',r:'rook',b:'bishop',n:'knight'} as Record<string,string>)[move[4]]}`)}).click();}
function solve(state:MatState,mate=true){return new Chess(state.fen).moves({verbose:true}).find(m=>m.san.endsWith('#')===mate)!.lan;}

test('MAT French board fits a narrow screen and supports keyboard selection',async({page,request},info)=>{
    test.setTimeout(45000);if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:740});
    await identify(page,await player(request,'MatFR'),'fr');const current=watch(page);await page.goto('/');
    await page.getByRole('button',{name:'Jouer MAT',exact:true}).click();await page.getByRole('button',{name:'Entrer dans l arene'}).click();
    await expect(page.getByTestId('party-arena')).toHaveAttribute('data-phase','solve');
    const board=page.getByTestId('mat-board'),box=(await board.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize()!.width);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await board.locator('button').first().focus();await page.keyboard.press('ArrowRight');await expect(board.locator('button').nth(1)).toBeFocused();
    const move=solve(current()!);await board.locator(`[data-square="${move.slice(0,2)}"]`).focus();await page.keyboard.press('Enter');
    await expect(board.locator(`[data-square="${move.slice(0,2)}"]`)).toHaveAttribute('data-selected','true');
    await page.screenshot({path:info.outputPath('mat-french.png'),fullPage:true});
});

test('MAT solo: real board, legal solution, fresh content and no wallet change',async({page,request},info)=>{
    test.setTimeout(60000);await identify(page,await player(request,'MatSolo'));const current=watch(page),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
    const positions=new Set();
    for(let attempt=0;attempt<2;attempt++){
        if(attempt===0)await page.getByRole('button',{name:'Play MAT',exact:true}).click();else await page.getByRole('button',{name:'Replay',exact:true}).click();
        await page.getByRole('button',{name:'Enter the arena'}).click();
        await expect(page.getByTestId('party-arena')).toHaveAttribute('data-phase','solve');await expect(page.getByTestId('mat-board').locator('button')).toHaveCount(64);
        const state=current()!;expect(state.solution).toBeUndefined();expect(state.results).toBeUndefined();expect(positions.has(state.fen)).toBe(false);positions.add(state.fen);
        const board=await page.getByTestId('mat-board').boundingBox();expect(board!.width).toBeGreaterThan(240);expect(Math.abs(board!.width-board!.height)).toBeLessThan(2);
        if(attempt===0)await page.screenshot({path:info.outputPath('mat-board.png'),fullPage:true});
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await playMove(page,solve(state),info.project.name.includes('mobile'));
        await expect(page.getByTestId('party-arena')).toHaveAttribute('data-phase','reveal');expect(current()!.results).toBeDefined();
        await expect(page.getByRole('button',{name:'Replay',exact:true})).toBeVisible();await expect(page.getByText('SLAP$ 25.00',{exact:true}).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
});

test('MAT duel: common puzzle, secret answer, server winner and nonblank exported board',async({browser,request},info)=>{
    test.setTimeout(60000);const a=await player(request,'MatA'),b=await player(request,'MatB');
    const post=async(path:string,data:object)=>{const r=await request.post(path,{data});expect(r.ok(),await r.text()).toBe(true);return r.json();};
    const {duel}=await post('/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'mat',ban:'bounce'},opponent:{pick:'mat',ban:'bounce'}}});
    for(const u of [a,b])await post(`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'bounce'});
    for(const u of [a,b])await post(`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});await post(`/api/duels/${duel.id}/start`,{userId:a.userId});
    const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
    try{
        const pa=await ca.newPage(),pb=await cb.newPage(),sa=watch(pa),sb=watch(pb);await identify(pa,a);await identify(pb,b);
        await pa.goto('/?tab=defy');await pb.goto('/?tab=defy');for(const p of [pa,pb])await p.getByRole('button',{name:'Enter the arena'}).click();
        for(const p of [pa,pb])await expect(p.getByTestId('party-arena')).toHaveAttribute('data-phase','solve');expect(sa()!.fen).toBe(sb()!.fen);
        await playMove(pa,solve(sa()!),info.project.name.includes('mobile'));await expect(pa.getByText('MOVE LOCKED',{exact:true})).toBeVisible();
        expect(sb()!.selected).toBeUndefined();expect(sb()!.results).toBeUndefined();expect(sb()!.solution).toBeUndefined();
        await playMove(pb,solve(sb()!,false),info.project.name.includes('mobile'));await expect(pa.getByTestId('round-recap')).toBeVisible();await expect(pa.getByTestId('round-evidence')).toBeVisible();
        const data=await(await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`)).json();expect(data.match.rounds[0].winnerId).toBe(a.userId);
        expect(data.match.rounds[0].moment.replay.at(-1).state.mat.results[a.userId].mate).toBe(true);
        await pa.getByRole('button',{name:'See result',exact:true}).click();await expect(pa.getByTestId('moment-replay')).toBeVisible();
        const colors=await pa.getByTestId('moment-replay').locator('canvas').evaluate((c:HTMLCanvasElement)=>{const ctx=c.getContext('2d')!;return [[181,317],[227,317]].map(([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data).join(','));});expect(colors[0]).not.toBe(colors[1]);
        const download=pa.waitForEvent('download');await pa.getByRole('button',{name:'Download image',exact:true}).click();expect((await download).suggestedFilename()).toBe('slaptax-mat.png');
        const frame=(await pa.getByTestId('moment-replay').boundingBox())!;
        for(const name of ['Download image','Download replay','Share']){const box=(await pa.getByTestId('moment-replay').getByRole('button',{name,exact:true}).boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(frame.x);expect(box.x+box.width).toBeLessThanOrEqual(frame.x+frame.width);}
        expect(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await pa.screenshot({path:info.outputPath('mat-result.png'),fullPage:true});
    }finally{await ca.close();await cb.close();}
});
