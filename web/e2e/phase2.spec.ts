import {test,expect,type Page} from '@playwright/test';
test.use({trace:'off'});
test.beforeEach(async({page},info)=>{if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:650});await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));});
test('accessible preferences persist and character choices reflect server unlocks',async({page},info)=>{
 await page.goto('/');await page.getByRole('button',{name:'Profil et réglages',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Profil et réglages'});const character=dialog.getByRole('button',{name:'Étincelle · disponible',exact:true});await expect(character).toHaveAttribute('aria-pressed','true');await expect(dialog.getByRole('button',{name:'Visière · verrouillé',exact:true})).toBeDisabled();
 const selection=page.waitForResponse(r=>r.url().endsWith('/api/progression/cosmetics')&&r.request().method()==='POST');await character.click();expect((await selection).ok()).toBe(true);
 for(const label of ['Contraste renforcé','Réduire les animations','Textes agrandis'])await dialog.getByRole('checkbox',{name:label,exact:true}).check();
 await expect(page.locator('html')).toHaveAttribute('data-high-contrast','true');await expect(page.locator('html')).toHaveAttribute('data-reduce-motion','true');await expect(page.locator('html')).toHaveAttribute('data-large-text','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('accessible-profile.png')});
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'Profil et réglages',exact:true})).toBeFocused();await page.reload();await expect(page.locator('html')).toHaveAttribute('data-reduce-motion','true');await page.getByRole('button',{name:'Profil et réglages',exact:true}).click();for(const label of ['Contraste renforcé','Réduire les animations','Textes agrandis'])await expect(page.getByRole('checkbox',{name:label,exact:true})).toBeChecked();await page.route('**/api/progression/cosmetics',r=>r.abort());await page.getByRole('button',{name:'Étincelle · disponible',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Choix non enregistré');
});
test('training guide is game-specific, skippable, persistent and replayable',async({page})=>{
 await page.goto('/?tab=training&game=fragile');const guide=page.getByTestId('training-tutorial');await expect(guide).toBeVisible();await expect(guide.getByRole('heading')).toHaveText('1 · Le défi');await expect(guide.getByRole('button',{name:'Précédent',exact:true})).toBeDisabled();
 await guide.getByRole('button',{name:'Suivant',exact:true}).click();await expect(guide.getByRole('heading')).toHaveText('2 · Ton geste');await guide.getByRole('button',{name:'Précédent',exact:true}).click();await expect(guide.getByRole('heading')).toHaveText('1 · Le défi');
 await guide.getByRole('button',{name:'Passer le guide',exact:true}).click();await expect(guide).toHaveCount(0);await page.reload();await expect(page.getByTestId('training-guide-replay')).toBeVisible();await expect(guide).toHaveCount(0);
 await page.getByTestId('training-guide-replay').click();for(let i=0;i<3;i++)await guide.getByRole('button',{name:'Suivant',exact:true}).click();await guide.getByRole('button',{name:'C’est parti',exact:true}).click();await expect(guide).toHaveCount(0);
 await page.goto('/?tab=training&game=table');await expect(guide).toBeVisible();await expect(guide).toContainText('Bagarre de Table');
});
async function traceShape(page:Page){const r=(await page.getByTestId('fragile-canvas').boundingBox())!;const points=[[.2,.2],[.8,.2],[.5,.8],[.2,.2]];await page.mouse.move(r.x+r.width*.2,r.y+r.height*.2);await page.mouse.down();for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.012);for(let n=1;n<=steps;n++){await page.mouse.move(r.x+r.width*(a[0]+(b[0]-a[0])*n/steps),r.y+r.height*(a[1]+(b[1]-a[1])*n/steps));await page.waitForTimeout(30);}}await page.mouse.up();}
test('a real completed practice unlocks achievements for that profile and survives reload',async({page})=>{
 test.setTimeout(50000);await page.goto('/?tab=training&game=fragile');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();await expect(page.getByTestId('fragile-canvas')).toBeVisible();await traceShape(page);
 await expect(page.getByRole('status').filter({hasText:'Succès débloqué'})).toContainText('Geste parfait',{timeout:35000});await page.goto('/?tab=stats');const achievements=page.getByTestId('achievements');await expect(achievements.locator('article[data-unlocked=true]')).toHaveCount(2);await expect(achievements).toContainText('Sur cet appareil');await page.reload();await expect(achievements.locator('article[data-unlocked=true]')).toHaveCount(2);await page.evaluate(()=>{localStorage.removeItem('slaptax_user_id');localStorage.setItem('slaptax_client_id',crypto.randomUUID());localStorage.setItem('slaptax_player_name','Other friend');});await page.reload();await expect(achievements.locator('article[data-unlocked=true]')).toHaveCount(0);
});
test('competition lobby shows the actual server avatar',async({page})=>{
 await page.goto('/?tab=survival');await page.getByRole('button',{name:'Créer une compétition',exact:true}).click();const avatar=page.getByTestId('lobby-character');await expect(avatar).toHaveAttribute('data-avatar','spark');await expect(avatar.locator('svg')).toBeVisible();
});

test('visual comfort is reachable on a phone in the snack arena',async({page})=>{
 await page.setViewportSize({width:320,height:650});await page.goto('/?tab=training&game=snack');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();const comfort=page.getByTestId('snack-comfort');await expect(comfort).toBeVisible();await comfort.click();await expect(comfort).toHaveAttribute('aria-pressed','true');
 const r=(await comfort.boundingBox())!;expect(r.height).toBeGreaterThanOrEqual(44);await expect(page.getByRole('button',{name:'BAFFE !',exact:false})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('visual comfort remains accessible in the wide arena',async({page})=>{await page.setViewportSize({width:1280,height:900});await page.goto('/?tab=training&game=snack');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();const button=page.getByTestId('snack-comfort');await expect(button).toBeInViewport();const r=(await button.boundingBox())!;expect(r.height).toBeGreaterThanOrEqual(44);await button.click();await expect(button).toHaveAttribute('aria-pressed','true');});

test('a real authoritative duel victory unlocks only the winner achievement',async({browser,request})=>{
 test.setTimeout(65000);const users=[];for(const name of ['PhaseTwoA','PhaseTwoB']){const clientId=crypto.randomUUID(),r=await request.post('/api/session/join',{data:{clientId,playerName:name}});users.push({...await r.json(),clientId,playerName:name});}
 const[a,b]=users,headers=(u:typeof a)=>({'X-SlapTax-User':u.userId,'X-SlapTax-Client':u.clientId});
 const post=async(path:string,data:object,u=a)=>{const r=await request.post(path,{data,headers:headers(u)});expect(r.ok(),await r.text()).toBe(true);return r.json();};
 const {duel}=await post('/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'table',ban:'onemore'},opponent:{pick:'table',ban:'onemore'}}});
 for(const u of users)await post(`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'},u);for(const u of users)await post(`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true},u);await post(`/api/duels/${duel.id}/start`,{userId:a.userId});
 const contexts=[],pages:Page[]=[];
 try{
  for(const [i,u]of users.entries()){const context=await browser.newContext({viewport:{width:320,height:650},hasTouch:true,isMobile:true});contexts.push(context);await context.addInitScript(u=>{for(const[k,v]of Object.entries({lang:'fr',onboarded:'1',client_id:u.clientId,user_id:u.userId,player_name:u.playerName}))localStorage.setItem('slaptax_'+k,v);},u);if(i===1)await context.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:string,...args:any[]){if(type.startsWith('webgl')||type==='experimental-webgl')return null;return get.apply(this,[type,...args] as any);} as typeof get;});const page=await context.newPage();pages.push(page);await page.goto('/?tab=defy');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();}
  await expect(pages[0].getByTestId('table-canvas')).toBeVisible();const surface=pages[1].getByTestId('table-canvas');await expect(surface).toBeVisible();const r=(await surface.boundingBox())!;
  // A player genuinely dashes off the edge. The server resolves the match.
  for(let n=0;n<5&&await surface.count();n++){await pages[1].mouse.click(r.x+r.width*.97,r.y+r.height*.03);await pages[1].waitForTimeout(1000);}
  await expect.poll(async()=>{const r=await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`,{headers:headers(a)});return(await r.json()).match.winnerId;},{timeout:23000}).toBe(a.userId);
  await expect.poll(()=>pages[0].evaluate(()=>{const id=localStorage.getItem('slaptax_user_id')!;return !!JSON.parse(localStorage.getItem('slaptax.achievements.v1')||'null')?.state?.profiles?.[id]?.unlocked?.['first-win'];}),{timeout:15000}).toBe(true);
  expect(await pages[1].evaluate(()=>{const id=localStorage.getItem('slaptax_user_id')!;return !!JSON.parse(localStorage.getItem('slaptax.achievements.v1')||'null')?.state?.profiles?.[id]?.unlocked?.['first-win'];})).toBe(false);
  await pages[0].reload();await expect.poll(()=>pages[0].evaluate(()=>{const id=localStorage.getItem('slaptax_user_id')!;return JSON.parse(localStorage.getItem('slaptax.achievements.v1')||'null')?.state?.profiles?.[id]?.wins;})).toBe(1);
 }finally{for(const context of contexts)await context.close();}
});
