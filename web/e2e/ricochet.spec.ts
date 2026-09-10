import {test,expect,type APIRequestContext,type Page} from '@playwright/test';
async function post(r:APIRequestContext,path:string,data:object){const response=await r.post(path,{data});expect(response.ok(),await response.text()).toBe(true);return response.json();}
async function player(r:APIRequestContext,name:string){const clientId=crypto.randomUUID();const data=await post(r,'/api/session/join',{clientId,playerName:name});return {clientId,playerName:name,userId:data.userId};}
async function identify(p:Page,u:Awaited<ReturnType<typeof player>>){await p.addInitScript((u)=>{
    localStorage.setItem('slaptax_onboarded','1');localStorage.setItem('slaptax_lang','en');
    localStorage.setItem('slaptax_client_id',u.clientId);localStorage.setItem('slaptax_user_id',u.userId);localStorage.setItem('slaptax_player_name',u.playerName);
},u);}
test('RICOCHET solo renders an interactive board and three real volleys',async({page,request},info)=>{
    test.setTimeout(80000);await identify(page,await player(request,'PuckSolo'));await page.goto('/');
    await page.getByRole('button',{name:'Play RICOCHET',exact:true}).click();await page.getByRole('button',{name:'Enter the arena'}).click();
    const game=page.getByTestId('ricochet'),canvas=page.getByTestId('ricochet-canvas');
    for(let i=0;i<3;i++){
        await expect(game).toHaveAttribute('data-phase','aim');
        await canvas.click({position:{x:120,y:80}});
        await page.getByRole('slider',{name:'Power',exact:true}).fill('14');
        if(i===0){
            expect(await canvas.evaluate((c:HTMLCanvasElement)=>new Set(c.getContext('2d')!.getImageData(0,0,c.width,c.height).data).size)).toBeGreaterThan(20);
            expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
            await page.screenshot({path:info.outputPath('ricochet-aim.png'),fullPage:true});
        }
        await page.getByRole('button',{name:'Lock shot',exact:true}).click();
        await expect(game).toHaveAttribute('data-phase','flight');
        if(i===0){
            const before=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());
            await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
            await page.screenshot({path:info.outputPath('ricochet-flight.png'),fullPage:true});
        }
        await expect(game).toHaveAttribute('data-phase','reveal');
    }
    await expect(game).toHaveCount(0);await expect(page.getByText('SLAP$ 25.00',{exact:true}).first()).toBeVisible();
});
test('RICOCHET rivals commit in secret and receive the authoritative result',async({browser,request},info)=>{
    test.setTimeout(80000);const a=await player(request,'PuckA'),b=await player(request,'PuckB');
    const {duel}=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'ricochet',ban:'bounce'},opponent:{pick:'ricochet',ban:'bounce'}}});
    for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'bounce'});
    for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});
    await post(request,`/api/duels/${duel.id}/start`,{userId:a.userId});
    const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
    try{
        const first=await ca.newPage(),second=await cb.newPage();await identify(first,a);await identify(second,b);
        await first.goto('/?tab=defy');await second.goto('/?tab=defy');
        for(const p of [first,second])await p.getByRole('button',{name:'Enter the arena'}).click();
        for(let i=0;i<3;i++){
            for(const p of [first,second])await expect(p.getByTestId('ricochet')).toHaveAttribute('data-phase','aim');
            await first.getByRole('slider',{name:'Angle',exact:true}).fill('25');await first.getByRole('slider',{name:'Power',exact:true}).fill('14');
            await second.getByRole('slider',{name:'Power',exact:true}).fill('80');
            await first.getByRole('button',{name:'Lock shot',exact:true}).click();
            await expect(first.getByRole('button',{name:'Shot locked',exact:true})).toBeDisabled();
            await expect(second.getByTestId('ricochet')).toHaveAttribute('data-phase','aim');
            await second.getByRole('button',{name:'Lock shot',exact:true}).click();
            for(const p of [first,second])await expect(p.getByTestId('ricochet')).toHaveAttribute('data-phase','reveal');
        }
        for(const p of [first,second])await expect(p.getByTestId('round-recap')).toBeVisible();
        const result=await (await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`,{maxRetries:2})).json();
        expect(result.match.status).toBe('done');expect(result.match.rounds[0].moment.gameId).toBe('ricochet');
        expect(result.match.rounds[0].moment.replay.some((f:{state:{board:{pucks:unknown[]}}})=>f.state.board.pucks.length>0)).toBe(true);
    }finally{await ca.close();await cb.close();}
});
