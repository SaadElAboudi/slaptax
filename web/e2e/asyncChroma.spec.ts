import {test,expect,type Page} from '@playwright/test';

test('CHROMA link supports an offline host, three private rounds, recap and fresh rematch',async({browser,page,request},info)=>{
    test.setTimeout(120000);
    const errors:string[]=[];
    async function session(target:Page,name:string){
        target.on('pageerror',e=>errors.push(e.message));
        const clientId=crypto.randomUUID();
        const response=await request.post('/api/session/join',{data:{clientId,playerName:name}});
        const {userId}=await response.json();
        await target.addInitScript(({clientId,userId,name})=>{
            for(const [key,value] of Object.entries({client_id:clientId,user_id:userId,player_name:name,onboarded:'1',lang:'fr'}))localStorage.setItem(`slaptax_${key}`,value);
        },{clientId,userId,name});
    }
    async function finish(target:Page){
        for(let round=0;round<3;round++){
            await expect(target.getByTestId('chroma')).toHaveAttribute('data-phase','mix');
            await expect(target.getByText('SCORE RIVAL MASQUE')).toBeVisible();
            await target.getByRole('slider',{name:'Teinte'}).fill('240');
            await Promise.all([
                target.waitForResponse(response=>response.url().includes('/action')&&response.request().postDataJSON()?.rgb?.[0]===51&&response.ok()),
                target.getByRole('slider',{name:'Saturation'}).fill('60'),
            ]);
            if(round===0){
                await target.reload();
                await expect(target.getByRole('slider',{name:'Teinte'})).toHaveValue('240');
                await expect(target.getByRole('slider',{name:'Saturation'})).toHaveValue('60');
                expect(await target.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
                const lock=await target.getByRole('button',{name:'Verrouiller',exact:true}).boundingBox();
                expect(lock!.y+lock!.height).toBeLessThanOrEqual(target.viewportSize()!.height);
                await target.screenshot({path:info.outputPath(`chroma-${target===page?'host':'guest'}-mix.png`)});
            }
            await target.getByRole('button',{name:'Verrouiller',exact:true}).click();
            await expect(target.getByTestId('chroma')).toHaveAttribute('data-phase','reveal');
        }
        await expect(target.getByLabel('Lien du defi')).toBeVisible();
    }
    await session(page,'Host');await page.goto('/?tab=training&link=new&game=chroma');
    await page.getByRole('button',{name:'Creer mon defi'}).click();
    await page.getByRole('button',{name:'Entrer dans l arene'}).click();
    await finish(page);
    const link=await page.getByLabel('Lien du defi').inputValue();
    await page.close();
    const context=await browser.newContext({viewport:info.project.use.viewport,isMobile:info.project.use.isMobile,hasTouch:info.project.use.hasTouch});
    try {
        const guest=await context.newPage();await session(guest,'Rival');await guest.goto(link);
        await expect(guest.getByText('Host te defie')).toBeVisible();
        await expect(guest.getByLabel('Comparaison des couleurs')).toHaveCount(0);
        await guest.getByRole('button',{name:'Entrer dans l arene'}).click();await finish(guest);
        await expect(guest.getByLabel('Comparaison des couleurs').locator('figure')).toHaveCount(9);
        await guest.reload();await expect(guest.getByLabel('Comparaison des couleurs')).toBeVisible();
        await expect(guest.getByTestId('chroma')).toHaveCount(0);
        await guest.screenshot({path:info.outputPath('chroma-recap.png'),fullPage:true});
        await guest.getByRole('link',{name:'Revanche, nouvelles couleurs'}).click();
        await guest.getByRole('button',{name:'Creer mon defi'}).click();
        await expect(guest.getByRole('button',{name:'Entrer dans l arene'})).toBeVisible();
        expect(guest.url()).not.toBe(link);expect(errors).toEqual([]);
    }finally{await context.close();}
});

test('unavailable presence is not displayed as zero players',async({page})=>{
    await page.addInitScript(()=>{localStorage.setItem('slaptax_onboarded','1');localStorage.setItem('slaptax_lang','fr');});
    await page.route('**/api/presence',route=>route.fulfill({status:503,body:'{}'}));
    await page.goto('/');await expect(page.getByTestId('online-players')).toHaveText('Presence indisponible');
});
