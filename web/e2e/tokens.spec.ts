import {test,expect} from '@playwright/test';
test('daily tokens are claimed once, journaled and preserved after reload',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/');
 await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');
 await page.getByRole('button',{name:'Ouvrir mes jetons',exact:true}).click();const wallet=page.getByRole('dialog',{name:'Mes jetons',exact:true});
 await expect(wallet.getByTestId('token-balance')).toHaveText('25');
 await wallet.getByRole('button',{name:'Récupérer mon bonus',exact:true}).click();await expect(wallet.getByTestId('token-balance')).toHaveText('35');
 await expect(wallet.getByRole('button',{name:'Bonus déjà récupéré',exact:true})).toBeDisabled();await expect(wallet.getByText('Bonus quotidien',{exact:true})).toBeVisible();
 await wallet.getByText('Mise, versement et vrai bénéfice',{exact:true}).click();await expect(wallet.getByRole('table')).toContainText('8,5');await expect(wallet).toContainText('15 % du pot');
 await page.screenshot({path:info.outputPath('token-wallet.png')});await wallet.getByRole('button',{name:'Fermer les jetons',exact:true}).click();
 await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','35');await page.reload();await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','35');
 await page.getByRole('button',{name:'Ouvrir mes jetons',exact:true}).click();await expect(page.getByRole('button',{name:'Bonus déjà récupéré',exact:true})).toBeDisabled();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Mes jetons',exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('failed requests keep the balance unchanged and offer an explicit retry',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/');await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');
 await page.route('**/api/tokens',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Connexion interrompue'})}));
 await page.getByRole('button',{name:'Ouvrir mes jetons',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Connexion interrompue');
 await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');await page.unroute('**/api/tokens');
 await page.getByRole('button',{name:'Actualiser les jetons',exact:true}).click();await expect(page.getByTestId('token-balance')).toHaveText('25');
});
test('friend duel quotes separate the payout from profit before the stake is committed',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=defy');
 const quote=page.getByTestId('stake-quote').first();await expect(quote).toContainText('Versement si victoire : 8,5');await expect(quote).toContainText('Bénéfice net : +3,5');
 await expect(quote).toContainText('15 % du pot');await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');
});
test('audio device failure never prevents starting a server-owned practice game',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax.music.enabled','1');
  Object.defineProperty(window,'AudioContext',{configurable:true,value:class{
   state='running';currentTime=0;resume(){return Promise.resolve();}
   createOscillator(){throw new Error('Audio device unavailable');}
   createGain(){throw new Error('Audio device unavailable');}
  }});
 });
 await page.goto('/?tab=training&game=onemore');
 await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();
 await expect(page.getByTestId('stack-canvas')).toBeVisible();expect(errors).toEqual([]);
});
