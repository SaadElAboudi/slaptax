import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
async function post(r:APIRequestContext,path:string,data:object) {
    const response=await r.post(path,{data}); expect(response.ok(),await response.text()).toBe(true); return response.json();
}
async function player(r:APIRequestContext,name:string) {
    const clientId=crypto.randomUUID(); const data=await post(r,'/api/session/join',{clientId,playerName:name});
    return {clientId,playerName:name,userId:data.userId};
}
async function identify(page:Page,user:Awaited<ReturnType<typeof player>>) {
    await page.addInitScript((u)=>{
        localStorage.setItem('slaptax_onboarded','1');localStorage.setItem('slaptax_lang','en');
        localStorage.setItem('slaptax_client_id',u.clientId);localStorage.setItem('slaptax_user_id',u.userId);
        localStorage.setItem('slaptax_player_name',u.playerName);localStorage.setItem('slaptax_training_game','chroma');
    },user);
}
test('CHROMA solo uses the picker, expires automatically and leaves the wallet unchanged',async({page,request},info)=>{
    test.setTimeout(90000);
    await identify(page,await player(request,'ColorSolo')); await page.goto('/');
    await page.getByRole('button',{name:'Play CHROMA',exact:true}).click();
    await page.getByRole('button',{name:'Enter the arena'}).click();
    const chroma=page.getByTestId('chroma');
    for(let i=0;i<3;i++) {
        await expect(chroma).toHaveAttribute('data-phase','observe');
        await expect(chroma).toHaveAttribute('data-phase','mix');
        const picker=page.getByTestId('chroma-picker');
        await picker.click({position:{x:45,y:65}});
        await page.getByRole('slider',{name:'Hue',exact:true}).fill('270');
        if(i===0) {
            expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
            await page.screenshot({path:info.outputPath('chroma-mix.png'),fullPage:true});
        } else await page.getByRole('button',{name:'Lock color',exact:true}).click();
        await expect(chroma).toHaveAttribute('data-phase','reveal',{timeout:15000});
        if(i===0) await page.screenshot({path:info.outputPath('chroma-reveal.png'),fullPage:true});
    }
    await expect(page.getByTestId('chroma')).toHaveCount(0);
    await expect(page.getByText('SLAP$ 25.00',{exact:true}).first()).toBeVisible();
});
test('two rivals finish CHROMA with server-owned scores and a result recap',async({browser,request},info)=>{
    test.setTimeout(90000);
    const a=await player(request,'ColorA'),b=await player(request,'ColorB');
    const created=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'chroma',ban:'bounce'},opponent:{pick:'chroma',ban:'bounce'}}});
    const id=created.duel.id;
    for(const user of [a,b]) await post(request,`/api/duels/${id}/ban`,{userId:user.userId,gameId:'bounce'});
    for(const user of [a,b]) await post(request,`/api/duels/${id}/ready`,{userId:user.userId,ready:true});
    await post(request,`/api/duels/${id}/start`,{userId:a.userId});
    const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
    try {
        const first=await ca.newPage(),second=await cb.newPage();
        await identify(first,a);await identify(second,b);
        await first.goto('/?tab=defy');await second.goto('/?tab=defy');
        await first.screenshot({path:info.outputPath('club-faceoff.png'),fullPage:true});
        for(const p of [first,second]) await p.getByRole('button',{name:'Enter the arena'}).click();
        for(let i=0;i<3;i++) {
            for(const p of [first,second]) await expect(p.getByTestId('chroma')).toHaveAttribute('data-phase','mix');
            await first.getByRole('slider',{name:'Brightness',exact:true}).fill('0');
            await second.getByRole('slider',{name:'Brightness',exact:true}).fill('100');
            await first.getByRole('button',{name:'Lock color',exact:true}).click();
            await expect(first.getByRole('button',{name:'Color locked'})).toBeDisabled();
            await second.getByRole('button',{name:'Lock color',exact:true}).click();
            await expect(first.getByTestId('chroma')).toHaveAttribute('data-phase','reveal');
        }
        await expect(first.getByTestId('round-recap')).toBeVisible();
        const result=await (await request.get(`/api/duels/${id}/match?userId=${a.userId}`,{maxRetries:2})).json();
        expect(result.match.status).toBe('done');expect(result.match.rounds[0].gameId).toBe('chroma');
        for(const p of [first,second])await p.getByRole('button',{name:'See result',exact:true}).click();
        await expect(first.getByTestId('club-result')).toBeVisible();
        const rematch=first.getByRole('button',{name:'Propose rematch',exact:true});await expect(rematch).toBeVisible();
        await first.screenshot({path:info.outputPath('club-result.png'),fullPage:true});
        expect(await first.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await first.locator('summary').filter({hasText:'The decisive moment'}).click();await expect(first.getByTestId('moment-replay')).toBeVisible();
        const download=first.waitForEvent('download');await first.getByRole('button',{name:'Download image',exact:true}).click();expect((await download).suggestedFilename()).toBe('slaptax-chroma.png');
        await rematch.click();await expect(first.getByText('Waiting for ColorB',{exact:true})).toBeVisible();
        await expect(second.getByText('ColorA wants a rematch',{exact:true})).toBeVisible();
        const pending=await(await request.get(`/api/duels/${id}/match?userId=${a.userId}`)).json();expect(pending.match.rematch.status).toBe('pending');
        await second.getByRole('button',{name:'Accept',exact:true}).click();
        await expect(first.getByTestId('game-veto')).toBeVisible();await expect(second.getByTestId('game-veto')).toBeVisible();
    } finally {await ca.close();await cb.close();}
});
