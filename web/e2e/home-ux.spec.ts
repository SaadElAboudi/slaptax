import {test,expect} from '@playwright/test';

test.beforeEach(async({page},info)=>{
 if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:740});
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 await page.goto('/');
});

test('home shows accurate catalogue counts and readable controls',async({page},info)=>{
 const library=page.locator('section').filter({has:page.getByRole('heading',{name:'L’arène et ses trois complices',exact:true})}).last();
 await expect(library.locator('header')).toContainText('4 JEUX');
 await expect(page.getByRole('tabpanel').locator('article')).toHaveCount(4);
 await page.getByRole('tab',{name:'Tous · jeux bonus',exact:true}).click();
 await expect(page.getByRole('tabpanel').locator('article')).toHaveCount(12);
 await expect(page.getByRole('heading',{name:'Choisis ton prochain délire'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('tab',{name:'Les incontournables',exact:true}).click();
 await page.screenshot({path:info.outputPath('home-refined.png'),fullPage:true});
});

test('joining from home validates and normalizes a room code with recoverable failure',async({page})=>{
 const form=page.getByRole('textbox',{name:'Tes amis sont déjà là ?'});
 const join=page.getByRole('button',{name:'Rejoindre',exact:true});
 await expect(join).toBeDisabled();await form.fill('ab!12');await expect(form).toHaveValue('AB12');await expect(join).toBeDisabled();
 await form.fill('abcdef');await expect(join).toBeEnabled();await form.press('Enter');
 await expect(page.getByTestId('snack-team-panel')).toBeVisible();
 await expect(page.getByText('Ce salon n’existe plus. Vérifie le code ou crée un salon.',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Créer un salon 2v2',exact:true})).toBeEnabled();
});
