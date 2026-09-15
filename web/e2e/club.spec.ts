import {test,expect} from '@playwright/test';

test('club home keeps the social entry and all games, with usable feedback settings at 320px',async({page,request},info)=>{
    test.setTimeout(60000);
    const clientId=crypto.randomUUID(),playerName='Alexandremagnifique';
    const response=await request.post('/api/session/join',{data:{clientId,playerName}});expect(response.ok()).toBe(true);const {userId}=await response.json();
    await page.addInitScript(({clientId,playerName,userId})=>{for(const [k,v] of Object.entries({onboarded:'1',lang:'fr',client_id:clientId,player_name:playerName,user_id:userId}))localStorage.setItem('slaptax_'+k,v);},{clientId,playerName,userId});
    if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:740});
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
    await expect(page.getByTestId('club-home')).toBeVisible();await expect(page.getByRole('button',{name:'Defier un ami',exact:true})).toHaveCount(1);
    const entry=(await page.getByRole('button',{name:'Defier un ami',exact:true}).boundingBox())!;
    expect(entry.y+entry.height).toBeLessThan(page.viewportSize()!.height);
    await expect(page.getByRole('tabpanel').getByRole('heading')).toHaveCount(15);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath('club-home.png'),fullPage:false});
    await page.getByRole('button',{name:'Ouvrir les cosmétiques'}).click();
    await expect(page.getByRole('checkbox',{name:'Effets sonores'})).toBeChecked();await page.getByRole('checkbox',{name:'Effets sonores'}).uncheck();
    await expect(page.getByRole('checkbox',{name:'Vibrations'})).not.toBeChecked();await page.getByRole('checkbox',{name:'Vibrations'}).check();
    await page.getByRole('button',{name:'Fermer',exact:true}).click();await page.reload();
    await page.getByRole('button',{name:'Ouvrir les cosmétiques'}).click();await expect(page.getByRole('checkbox',{name:'Effets sonores'})).not.toBeChecked();await expect(page.getByRole('checkbox',{name:'Vibrations'})).toBeChecked();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Fermer',exact:true}).click();
    await page.getByRole('button',{name:'Defier un ami',exact:true}).click();expect(new URL(page.url()).searchParams.get('tab')).toBe('defy');
    expect(await page.evaluate(()=>localStorage.getItem('slaptax_duel_game'))).toBe('chroma');expect(errors).toEqual([]);
    await page.evaluate(()=>localStorage.setItem('slaptax_training_game','chroma'));
    await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?tab=training');
    await page.getByRole('button',{name:'Entrer dans l arene'}).click();
    await expect(page.getByTestId('chroma')).toHaveAttribute('data-phase','mix');
    for(const control of [page.getByTestId('chroma-picker'),page.getByRole('slider',{name:'Teinte'}),page.getByRole('slider',{name:'Saturation'}),page.getByRole('slider',{name:'Luminosite'}),page.getByRole('button',{name:'Verrouiller',exact:true})]){
        expect(await control.evaluate(node=>{const r=node.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&node.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
    }
    await page.screenshot({path:info.outputPath('club-chroma-french.png'),fullPage:false});
    await page.getByRole('button',{name:'Verrouiller',exact:true}).click();await expect(page.getByTestId('chroma')).toHaveAttribute('data-phase','reveal');
    expect(errors).toEqual([]);
});
