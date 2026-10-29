import {test,expect} from '@playwright/test';

test('public privacy/support/deletion pages work without creating a guest profile',async({page})=>{
 const errors:string[]=[];let joins=0;page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/api/session/join'))joins++;});
 for(const [path,title]of [['/privacy','Confidentialité'],['/support','Support SlapTax'],['/delete-account','Supprimer mon profil'],['/terms','Règles et conditions']]){await page.goto(path);await expect(page.getByRole('heading',{level:1,name:title})).toBeVisible();await expect(page.getByText('gignoski@gmail.com',{exact:false}).first()).toBeVisible();}
 expect(joins).toBe(0);expect(errors).toEqual([]);
});
test('a public invitation offers the app route without leaking a session identity',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=team&room=ABC123');
 const link=page.getByRole('link',{name:'Ouvrir cette invitation dans l’app'});await expect(link).toHaveAttribute('href','slaptax://play/?tab=team&room=ABC123');expect((await link.getAttribute('href'))).not.toContain('clientId');
});
test('profile deletion is confirmed, persisted, and does not recreate an account on its receipt',async({page,request},info)=>{
 const clientId=crypto.randomUUID(),joined=await(await request.post('/api/session/join',{data:{clientId,playerName:'DeleteMobile'}})).json();let receiptJoins=0;
 await page.addInitScript(({clientId,userId})=>{if(location.pathname!=='/')return;localStorage.setItem('slaptax_client_id',clientId);localStorage.setItem('slaptax_user_id',userId);localStorage.setItem('slaptax_player_name','DeleteMobile');localStorage.setItem('slaptax_lang','fr');},{clientId,userId:joined.userId});
 await page.goto('/');await page.getByRole('button',{name:'Profil et réglages'}).click();await page.getByRole('button',{name:'Supprimer mon profil et mes données',exact:true}).click();await expect(page.getByText('Cette action est définitive',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Confirmer la suppression définitive'}).click();await expect(page.getByRole('heading',{name:'Profil supprimé',exact:true})).toBeVisible();
 page.on('request',r=>{if(r.url().endsWith('/api/session/join'))receiptJoins++;});await page.reload();await expect(page.getByRole('heading',{name:'Profil supprimé',exact:true})).toBeVisible();expect(receiptJoins).toBe(0);
 const headers={'X-SlapTax-User':joined.userId,'X-SlapTax-Client':clientId};expect((await request.post('/api/account/delete',{headers,data:{userId:joined.userId,clientId,confirm:true}})).status()).toBeGreaterThanOrEqual(400);
 await page.screenshot({path:info.outputPath('profile-deleted.png'),fullPage:true});
});
test('report and future-duel block are accessible in settings',async({page,request})=>{
 const rival=await(await request.post('/api/session/join',{data:{clientId:crypto.randomUUID(),playerName:'SafetyRival'}})).json();await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/');
 await page.getByRole('button',{name:'Profil et réglages'}).click();await page.getByRole('button',{name:'Signaler ou bloquer un joueur',exact:true}).click();await page.getByLabel('Joueur',{exact:true}).selectOption(rival.userId);
 await page.getByRole('button',{name:'Bloquer les prochains duels',exact:true}).click();await expect(page.getByRole('button',{name:'Débloquer',exact:true})).toBeVisible();await page.getByRole('button',{name:'Envoyer le signalement'}).click();await expect(page.getByRole('status')).toContainText('Signalement enregistré');
});
test('legacy canvas and crypto APIs have a working gameplay fallback',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true});Object.defineProperty(CanvasRenderingContext2D.prototype,'roundRect',{value:undefined,writable:true,configurable:true});});
 await page.goto('/?tab=training&game=pie');await expect.poll(()=>page.evaluate(()=>localStorage.getItem('slaptax_client_id'))).toMatch(/^[a-f0-9]{48}$/);
 await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect(page.getByTestId('pie-canvas')).toBeVisible();
 await expect.poll(()=>page.getByTestId('pie-canvas').evaluate((canvas:HTMLCanvasElement)=>canvas.getContext('2d')!.getImageData(0,0,1,1).data[3])).toBeGreaterThan(0);expect(errors).toEqual([]);
});
