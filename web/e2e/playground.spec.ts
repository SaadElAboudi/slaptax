import {test,expect} from '@playwright/test';

test('new player sees games immediately and can navigate without onboarding or a forced game',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 await page.goto('/');
 await expect(page.getByTestId('club-home')).toBeVisible();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 const nav=page.getByRole('navigation',{name:'Navigation principale'});
 await expect(nav.getByRole('button')).toHaveCount(4);
 await expect(page.getByRole('button',{name:'Jouer maintenant',exact:true})).toBeVisible();
 await page.screenshot({path:info.outputPath('home.png'),fullPage:true});
 await page.getByRole('button',{name:'Jouer Chef Couic',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Chef Couic',level:3,exact:true})).toBeVisible();
 await expect(page.locator('details').filter({has:page.locator('summary', {hasText:'Changer de jeu'})})).not.toHaveAttribute('open');
 await page.screenshot({path:info.outputPath('solo.png'),fullPage:true});
 await page.getByRole('button',{name:'Accueil Slap Tax'}).click();
 await expect(page.getByTestId('club-home')).toBeVisible();
 await nav.getByRole('button',{name:'Défis',exact:true}).click();
 await expect(page).toHaveURL(/tab=challenges/);
 await nav.getByRole('button',{name:'Tournois',exact:true}).click();
 await expect(page).toHaveURL(/tab=tournament/);
 await nav.getByRole('button',{name:'Jouer',exact:true}).click();
 await expect(page.getByTestId('club-home')).toBeVisible();
 expect(errors).toEqual([]);
});

test('profile controls and game catalog fit narrow screens and preserve preferences',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 await page.goto('/');
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:900});
  await expect(page.getByTestId('club-home')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath(`home-${width}.png`),fullPage:true});
 }
 await page.setViewportSize({width:320,height:740});
 await page.getByRole('button',{name:'Profil et réglages',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Profil et réglages'});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('checkbox',{name:'Musique',exact:true})).not.toBeChecked();
 await dialog.getByRole('checkbox',{name:'Musique',exact:true}).check();
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:'Profil et réglages',exact:true}).click();
 await expect(dialog.getByRole('checkbox',{name:'Musique',exact:true})).toBeChecked();
 await page.screenshot({path:info.outputPath('settings-320.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('friend setup keeps the chosen game, creates a real invite and browser Back restores the menu',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 await page.goto('/');
 await page.getByRole('button',{name:'Defier: Chef Couic',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Duel entre amis',exact:true})).toBeVisible();
 const picker=page.locator('details').filter({has:page.locator('summary',{hasText:'Jeu favori'})});
 await expect(picker).toContainText('Chef Couic');
 await expect(picker).not.toHaveAttribute('open');
 await page.getByText('Options de partie et invitation directe',{exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Format',exact:true})).toBeVisible();
 await page.getByText('Options de partie et invitation directe',{exact:true}).click();
 await page.getByRole('button',{name:'Créer et copier le lien',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Lien d invitation'})).toBeVisible();
 await page.screenshot({path:info.outputPath('friend-invite.png'),fullPage:true});
 await page.goBack();
 await expect(page.getByTestId('club-home')).toBeVisible();
 await page.goForward();
 await expect(page.getByRole('heading',{name:'Duel entre amis',exact:true})).toBeVisible();
});
