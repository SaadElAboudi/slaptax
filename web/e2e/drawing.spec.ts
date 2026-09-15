import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

async function player(request:APIRequestContext,name:string) {
    const clientId=crypto.randomUUID();const response=await request.post('/api/session/join',{data:{clientId,playerName:name}});
    expect(response.ok()).toBe(true);return {clientId,playerName:name,userId:(await response.json()).userId as string};
}
async function identify(page:Page,user:Awaited<ReturnType<typeof player>>) {
    await page.addInitScript(u=>{for(const [key,value] of Object.entries({onboarded:'1',lang:'en',client_id:u.clientId,user_id:u.userId,player_name:u.playerName}))localStorage.setItem('slaptax_'+key,value);},user);
}
async function stroke(page:Page,cut:boolean,mobile:boolean,offset=0) {
    const canvas=page.getByTestId('drawing-canvas');await canvas.scrollIntoViewIfNeeded();const box=(await canvas.boundingBox())!;
    const path=cut?[[.5+offset,.05],[.5+offset,.95]]:[[.2,.7-offset],[.5,.25+offset],[.8,.7-offset]];
    const coords=path.map(([x,y])=>({x:box.x+x*box.width,y:box.y+y*box.height}));
    if(mobile){const cdp=await page.context().newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[coords[0]]});
        for(const p of coords.slice(1))await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    }else{await page.mouse.move(coords[0].x,coords[0].y);await page.mouse.down();for(const p of coords.slice(1))await page.mouse.move(p.x,p.y,{steps:5});await page.mouse.up();}
    if(cut)await page.getByRole('button',{name:'Lock cut',exact:true}).click();
}
async function complete(page:Page,cut:boolean,mobile:boolean) {
    for(let i=0;i<3;i++){
        await expect(page.getByTestId('drawing')).toHaveAttribute('data-phase','drawpath');
        await stroke(page,cut,mobile);
        await expect(page.getByTestId('drawing')).toHaveAttribute('data-phase','reveal');
    }
}
for(const game of ['trace','decoupe'] as const) {
    test(`${game} practice accepts three real strokes and renders a nonblank responsive board`,async({page,request},info)=>{
        test.setTimeout(75000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
        await identify(page,await player(request,'DrawSolo'));await page.goto('/');
        await page.getByRole('button',{name:`Play ${game.toUpperCase()}`,exact:true}).click();
        await page.getByRole('button',{name:'Enter the arena'}).click();
        await expect(page.getByTestId('drawing')).toHaveAttribute('data-phase',game==='trace'?'observe':'drawpath');
        const pixels=await page.getByTestId('drawing-canvas').evaluate((el:HTMLCanvasElement)=>{
            const data=el.getContext('2d')!.getImageData(0,0,el.width,el.height).data;const colors=new Set<string>();
            for(let i=0;i<data.length;i+=16)colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);return colors.size;
        });expect(pixels).toBeGreaterThan(4);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.screenshot({path:info.outputPath(`${game}-board.png`),fullPage:true});
        await complete(page,game==='decoupe',info.project.name.includes('mobile'));
        await page.screenshot({path:info.outputPath(`${game}-reveal.png`),fullPage:true});
        await expect(page.getByRole('button',{name:'Replay',exact:true})).toBeVisible();
        expect(errors).toEqual([]);
    });
    test(`${game} link challenge runs host and visitor on identical server targets and survives reload`,async({page,request,browser},info)=>{
        test.setTimeout(120000);const host=await player(request,'DrawHost'),friend=await player(request,'DrawFriend');
        await identify(page,host);await page.goto(`/?tab=training&link=new&game=${game}`);
        await page.getByRole('button',{name:'Create challenge'}).click();
        await expect(page).toHaveURL(/link=[0-9a-f-]+/);
        await page.getByRole('button',{name:'Enter the arena'}).click();
        await complete(page,game==='decoupe',info.project.name.includes('mobile'));
        await expect(page.getByText('CHALLENGE READY',{exact:true})).toBeVisible();
        const url=await page.getByRole('textbox',{name:'Challenge link',exact:true}).inputValue();
        const context=await browser.newContext(info.project.use);
        try{const visitor=await context.newPage();await identify(visitor,friend);await visitor.goto(url);
            await expect(visitor.getByText('DrawHost challenges you',{exact:true})).toBeVisible();
            await expect(visitor.getByTestId('moment-replay')).toHaveCount(0);
            await visitor.getByRole('button',{name:'Enter the arena'}).click();
            await complete(visitor,game==='decoupe',info.project.name.includes('mobile'));
            await expect(visitor.getByTestId('moment-replay')).toBeVisible();
            await visitor.reload();await expect(visitor.getByTestId('moment-replay')).toBeVisible();
            await expect(visitor.getByRole('button',{name:'Enter the arena'})).toHaveCount(0);
            expect(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
            await visitor.screenshot({path:info.outputPath(`${game}-link-result.png`),fullPage:true});
        }finally{await context.close();}
    });
    test(`${game} live duel commits secretly and completes with comparison and a replay`,async({browser,request},info)=>{
        test.setTimeout(90000);const a=await player(request,'DrawingA'),b=await player(request,'DrawingB');
        const post=async(path:string,data:object)=>{const r=await request.post(path,{data});expect(r.ok(),await r.text()).toBe(true);return r.json();};
        const {duel}=await post('/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:game,ban:'bounce'},opponent:{pick:game,ban:'bounce'}}});
        for(const u of [a,b])await post(`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'bounce'});
        for(const u of [a,b])await post(`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});
        await post(`/api/duels/${duel.id}/start`,{userId:a.userId});
        const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
        try{const pa=await ca.newPage(),pb=await cb.newPage();await identify(pa,a);await identify(pb,b);
            await pa.goto('/?tab=defy');await pb.goto('/?tab=defy');
            for(const p of [pa,pb])await p.getByRole('button',{name:'Enter the arena'}).click();
            for(let i=0;i<3;i++){
                for(const p of [pa,pb])await expect(p.getByTestId('drawing')).toHaveAttribute('data-phase','drawpath');
                await stroke(pa,game==='decoupe',info.project.name.includes('mobile'));
                await expect(pa.getByText('Stroke locked',{exact:true})).toBeVisible();
                await expect(pb.getByTestId('drawing')).toHaveAttribute('data-phase','drawpath');
                // B deliberately expires: verifies that a missing stroke never beats a valid cut.
                await expect(pa.getByTestId('drawing')).toHaveAttribute('data-phase','reveal');
            }
            await expect(pa.getByTestId('round-recap')).toBeVisible();await expect(pa.getByTestId('round-evidence')).toBeVisible();
            await pa.getByRole('button',{name:'See result',exact:true}).click();
            await pa.locator('summary').filter({hasText:'The decisive moment'}).click();
            await expect(pa.getByTestId('moment-replay')).toBeVisible();
            await pa.screenshot({path:info.outputPath(`${game}-duel-result.png`),fullPage:true});
        }finally{await ca.close();await cb.close();}
    });
}
