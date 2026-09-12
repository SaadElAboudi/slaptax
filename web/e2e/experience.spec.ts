import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { WebSocket } from 'ws';

async function post(request: APIRequestContext, path: string, data: object) {
    const response = await request.post(path,{ data });
    expect(response.ok(),await response.text()).toBe(true); return response.json();
}
async function player(request: APIRequestContext, label: string) {
    const clientId = `experience-${label}-${Date.now()}-${Math.random()}`;
    const user = await post(request,'/api/session/join',{clientId,playerName:label});
    return { clientId,userId:user.userId as string,playerName:label };
}
async function identify(page: Page, user: Awaited<ReturnType<typeof player>>) {
    await page.addInitScript((u) => {
        localStorage.setItem('slaptax_onboarded','1'); localStorage.setItem('slaptax_lang','en');
        localStorage.setItem('slaptax_client_id',u.clientId); localStorage.setItem('slaptax_user_id',u.userId); localStorage.setItem('slaptax_player_name',u.playerName);
    },user);
}
async function forfeit(duelId: string, userId: string, round: number) {
    await new Promise<void>((resolve,reject) => {
        const socket=new WebSocket(`ws://127.0.0.1:3100/api/realtime?userId=${userId}`);
        const timer=setTimeout(()=>{socket.terminate();reject(new Error('Forfeit timeout'));},5000);
        socket.on('open',()=>{socket.send(JSON.stringify({type:'arena.join',duelId,round}));socket.send(JSON.stringify({type:'arena.forfeit'}));});
        socket.on('error',reject);
        socket.on('message',(raw)=>{if(JSON.parse(String(raw)).phase==='done'){clearTimeout(timer);socket.close();resolve();}});
    });
}

test('catalogue categories filter real games and remain usable on a narrow screen',async({page,request},info)=>{
    await identify(page,await player(request,'Catalogue'));
    await page.goto('/');
    await page.getByRole('tab',{name:'Brainpower'}).click();
    const panel=page.getByRole('tabpanel');
    await expect(panel.getByRole('heading')).toHaveCount(3);
    await expect(panel.getByRole('heading',{name:'TRACE',exact:true})).toBeVisible();
    await expect(panel.getByRole('heading',{name:'Duel Numeric'})).toBeVisible();
    await page.screenshot({path:info.outputPath('catalogue.png'),fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.setViewportSize({width:320,height:740});
    await expect(panel.getByRole('heading',{name:'Duel Numeric'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath('catalogue-320.png'),fullPage:true});
});

test('leaving a pending duel closes the room for both players without a debit',async({browser,request},info)=>{
    const a=await player(request,'Leave-A'),b=await player(request,'Leave-B');
    await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2});
    const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
    try {
        const first=await ca.newPage(),second=await cb.newPage();
        await identify(first,a);await identify(second,b);
        await first.goto('/?tab=defy');await second.goto('/?tab=defy');
        await expect(first.getByTestId('game-veto')).toBeVisible();
        await expect(second.getByTestId('game-veto')).toBeVisible();
        await first.getByRole('button',{name:'Leave room',exact:true}).click();
        await expect(first.getByTestId('game-veto')).toHaveCount(0);
        await expect(second.getByTestId('game-veto')).toHaveCount(0);
        for(const user of [a,b]) {
            const status=await (await request.get(`/api/matchmaking/status?userId=${user.userId}`,{maxRetries:2})).json();
            expect(status.status).toBe('idle');
        }
        await expect(first.getByText('SLAP$ 25.00',{exact:true}).first()).toBeVisible();
    } finally {await ca.close();await cb.close();}
});

test('two queued players ban their own games, confirm the rotation and enter a focused arena',async({browser,request},info)=>{
    test.setTimeout(60000);
    const a=await player(request,'Veto-A'),b=await player(request,'Veto-B');
    const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
    try {
        const first=await ca.newPage(),second=await cb.newPage();
        await identify(first,a); await identify(second,b);
        await first.goto('/'); await second.goto('/');
        await first.getByRole('button',{name:'Find a rival'}).click();
        await expect(first.getByText('Finding a human rival')).toBeVisible();
        await second.getByRole('button',{name:'Find a rival'}).click();
        await expect(first.getByTestId('game-veto')).toBeVisible();
        await expect(second.getByTestId('game-veto')).toBeVisible();
        await expect(first.getByRole('button',{name:'I am READY'})).toBeDisabled();
        await first.getByRole('button',{name:'Ban Bounce Panic',exact:true}).click();
        await second.getByRole('button',{name:'Ban Bomb Pass',exact:true}).click();
        await expect(first.getByRole('button',{name:'I am READY'})).toBeEnabled();
        await first.screenshot({path:info.outputPath('duel-draft.png'),fullPage:true});
        const queued=await (await request.get(`/api/matchmaking/status?userId=${a.userId}`,{maxRetries:2})).json();
        const room=await (await request.get(`/api/duels/${queued.duel.id}/room?userId=${a.userId}`)).json();
        expect(room.room.games).not.toContain('bounce'); expect(room.room.games).not.toContain('bombpass');
        await first.getByRole('button',{name:'I am READY'}).click();
        await second.getByRole('button',{name:'I am READY'}).click();
        await first.getByRole('button',{name:'Enter the arena'}).click();
        await second.getByRole('button',{name:'Enter the arena'}).click();
        await expect(first.locator('[data-focus="true"]')).toBeVisible();
        await expect(first.getByRole('navigation',{name:'Main navigation'})).toBeHidden();
        await first.screenshot({path:info.outputPath('focused-arena.png'),fullPage:true});
    } finally { await ca.close();await cb.close(); }
});

test('tournament vote applies to the bracket and round results require acknowledgement',async({page,request},info)=>{
    test.setTimeout(60000);
    const players=await Promise.all(['CupA','CupB','CupC','CupD'].map((name)=>player(request,name)));
    const host=players[0];
    const created=await post(request,'/api/arena-tournaments',{hostId:host.userId,size:4,visibility:'public',name:'Veto Cup'});
    const id=created.tournament.id;
    for(const user of players.slice(1)) await post(request,`/api/arena-tournaments/${id}/join`,{userId:user.userId});
    for(const user of players.slice(1)) await post(request,`/api/arena-tournaments/${id}/ban`,{userId:user.userId,gameId:'bounce'});
    await identify(page,host); await page.goto(`/?tab=tournament&room=${id}`);
    await expect(page.getByRole('button',{name:'I am READY'})).toBeDisabled();
    await page.getByRole('button',{name:'Ban Bounce Panic',exact:true}).click();
    for(const user of players.slice(1)) await post(request,`/api/arena-tournaments/${id}/ready`,{userId:user.userId,ready:true});
    await page.getByRole('button',{name:'I am READY'}).click();
    await page.getByRole('button',{name:'Start bracket'}).click();
    const data=await (await request.get(`/api/arena-tournaments/${id}?userId=${host.userId}`)).json();
    expect(data.tournament.games).not.toContain('bounce');
    const duelId=data.activeDuelId;
    const room=await (await request.get(`/api/duels/${duelId}/room?userId=${host.userId}`)).json();
    const rival=room.room.challengerId===host.userId ? room.room.opponentId : room.room.challengerId;
    for(const userId of [host.userId,rival]) await post(request,`/api/duels/${duelId}/ready`,{userId,ready:true});
    await post(request,`/api/duels/${duelId}/start`,{userId:host.userId});
    await expect(page.getByRole('button',{name:'Enter the arena'})).toBeVisible();
    await forfeit(duelId,rival,1);
    await expect(page.getByTestId('round-recap')).toBeVisible();
    await page.screenshot({path:info.outputPath('tournament-round-result.png'),fullPage:true});
    await page.getByRole('button',{name:'Next round'}).click();
    await expect(page.getByRole('button',{name:'Enter the arena'})).toBeVisible();
    await forfeit(duelId,rival,2);
    await expect(page.getByRole('button',{name:'See result'})).toBeVisible();
    await page.getByRole('button',{name:'See result'}).click();
    await expect(page.getByTestId('round-recap')).toHaveCount(0);
});
