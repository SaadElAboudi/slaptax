import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

async function player(request:APIRequestContext,name:string){const clientId=crypto.randomUUID();const res=await request.post('/api/session/join',{data:{clientId,playerName:name}});expect(res.ok()).toBe(true);return {clientId,playerName:name,userId:(await res.json()).userId as string};}
async function identify(page:Page,user:Awaited<ReturnType<typeof player>>){await page.addInitScript(u=>{for(const [key,value]of Object.entries({onboarded:'1',lang:'en',client_id:u.clientId,user_id:u.userId,player_name:u.playerName}))localStorage.setItem('slaptax_'+key,value);},user);}

test('GARDE solo clearly identifies its bot, resolves at most eight turns and leaves the wallet unchanged',async({page,request},info)=>{
    test.setTimeout(65000);await identify(page,await player(request,'GuardSolo'));await page.goto('/');
    await page.getByRole('button',{name:'Play GARDE',exact:true}).click();await page.getByRole('button',{name:'Enter the arena'}).click();
    const game=page.getByTestId('garde');await expect(game).toHaveAttribute('data-phase','choose');
    await expect(page.getByText('PRACTICE AGAINST A BOT',{exact:true})).toBeVisible();
    await page.screenshot({path:info.outputPath('garde-choice.png'),fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(let i=0;i<8;i++) {
        if(await game.count()===0)break;
        await expect(game).toHaveAttribute('data-phase','choose');
        const attack=page.getByRole('button',{name:'Attack',exact:true});
        if(info.project.name.includes('mobile'))await attack.tap();else await attack.click();
        await expect(game).toHaveAttribute('data-phase','reveal');
        await expect.poll(async()=>await game.count()===0?'gone':await game.getAttribute('data-phase')).not.toBe('reveal');
    }
    await expect(page.getByRole('button',{name:'Replay',exact:true})).toBeVisible();
    await expect(page.getByText('SLAP$ 25.00',{exact:true}).first()).toBeVisible();
});

test('GARDE duel keeps choices secret, applies guard recovery, resolves eight turns and exports history',async({browser,request},info)=>{
    test.setTimeout(75000);const a=await player(request,'GuardA'),b=await player(request,'GuardB');
    const post=async(path:string,data:object)=>{const r=await request.post(path,{data});expect(r.ok(),await r.text()).toBe(true);return r.json();};
    const {duel}=await post('/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'garde',ban:'bounce'},opponent:{pick:'garde',ban:'bounce'}}});
    for(const u of [a,b])await post(`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'bounce'});
    for(const u of [a,b])await post(`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});
    await post(`/api/duels/${duel.id}/start`,{userId:a.userId});
    const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
    try {
        const pa=await ca.newPage(),pb=await cb.newPage(),errors:string[]=[];
        for(const p of [pa,pb])p.on('pageerror',e=>errors.push(e.message));
        await identify(pa,a);await identify(pb,b);await pa.goto('/?tab=defy');await pb.goto('/?tab=defy');
        for(const p of [pa,pb])await p.getByRole('button',{name:'Enter the arena'}).click();
        const pairs=[['Charge','Attack'],['Attack','Defend'],['Defend','Charge'],['Attack','Attack'],['Charge','Attack'],['Attack','Charge'],['Attack','Charge'],['Attack','Attack']];
        for(const [i,[one,two]] of pairs.entries()){
            for(const p of [pa,pb])await expect(p.getByTestId('garde')).toHaveAttribute('data-phase','choose');
            if(i===2)await expect(pb.getByRole('button',{name:'Defend',exact:true})).toBeDisabled();
            if(i===3)await expect(pa.getByRole('button',{name:'Defend',exact:true})).toBeDisabled();
            const button=pa.getByRole('button',{name:one,exact:true});
            if(info.project.name.includes('mobile'))await button.tap();else await button.click();
            await expect(pa.getByText('Choice locked.',{exact:true})).toBeVisible();
            await expect(pb.getByTestId('rival-action')).toHaveText('?');
            const second=pb.getByRole('button',{name:two,exact:true});
            if(info.project.name.includes('mobile'))await second.tap();else await second.click();
            await expect(pa.getByTestId('garde')).toHaveAttribute('data-phase','reveal');
            if(i===0){await expect(pa.getByTestId('self-hp')).toHaveText('5');await expect(pa.getByTestId('rival-hp')).toHaveText('6');}
        }
        await expect(pa.getByTestId('round-recap')).toBeVisible();await expect(pa.getByTestId('garde-history')).toBeVisible();
        const data=await(await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`)).json();
        expect(data.match.rounds[0].winnerId).toBe(b.userId);const moment=data.match.rounds[0].moment;
        expect(moment.scores).toEqual({[a.userId]:0,[b.userId]:1});expect(moment.replay.at(-1).state.garde.history).toHaveLength(8);
        await pa.getByRole('button',{name:'See result',exact:true}).click();await expect(pa.getByTestId('moment-replay')).toBeVisible();
        const download=pa.waitForEvent('download');await pa.getByRole('button',{name:'Download image',exact:true}).click();expect((await download).suggestedFilename()).toContain('.png');
        await pa.screenshot({path:info.outputPath('garde-result.png'),fullPage:true});expect(errors).toEqual([]);
    }finally{await ca.close();await cb.close();}
});
