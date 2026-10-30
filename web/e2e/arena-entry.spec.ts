import {test,expect} from '@playwright/test';

test('an unavailable server explains entry and reconnects into the same practice screen',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 let unavailable=true,duels=0;
 page.on('request',r=>{if(r.method()==='POST'&&/\/api\/duels$/.test(r.url()))duels++;});
 await page.route('**/api/health*',route=>unavailable?route.fulfill({status:503,contentType:'application/json',body:'{"ok":false}'}):route.continue());
 await page.goto('/?tab=training&game=snack');
 const entry=page.getByRole('button',{name:'Entrer dans l arene'});
 await expect(entry).toBeDisabled();await expect(page.getByTestId('entry-connection')).toContainText('Connexion au serveur');
 await page.getByRole('button',{name:'Réessayer la connexion',exact:true}).click();
 await expect(page.getByTestId('entry-connection')).toContainText('Le serveur ne répond pas encore');
 unavailable=false;await page.getByRole('button',{name:'Réessayer la connexion',exact:true}).click();
 await expect(entry).toBeEnabled();if(info.project.name.includes('mobile'))await entry.tap();else await entry.click();
 await expect(page.getByTestId('snack-game')).toHaveAttribute('data-phase','brawl');expect(duels).toBe(0);
});
