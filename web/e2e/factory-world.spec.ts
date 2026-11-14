import {test,expect} from '@playwright/test';

test('factory identity never adds a story gate before the six games',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 await page.goto('/');
 await expect(page.locator('#games article')).toHaveCount(6);
 await expect(page.getByTestId('factory-story')).toHaveCount(0);
 await expect(page.getByTestId('factory-episode')).toHaveCount(0);
 await page.getByRole('button',{name:'Jouer Braquage du Goûter',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Braquage du Goûter',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Entrer dans l arene'})).toBeEnabled();
});

test('a previous practice does not hide games or change the primary entry',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 await page.goto('/');await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');
 await page.evaluate(()=>{const id=localStorage.getItem('slaptax_user_id')||'';localStorage.setItem(`slaptax_practice_history_${id}`,JSON.stringify([{id:'local-incident',gameId:'snack',score:500,completedAt:1}]));});
 await page.reload();await expect(page.locator('#games article')).toHaveCount(6);
 await page.getByRole('button',{name:'Jouer Chef Couic',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Chef Couic',exact:true})).toBeVisible();
});
