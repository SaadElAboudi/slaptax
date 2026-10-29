import {test,expect} from '@playwright/test';
import selection from '../../shared/game-selection.json' with {type:'json'};
for(const language of ['fr','en'] as const)test(`selected catalogue has the full friend-challenge collection in ${language}`,async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(lang=>{localStorage.setItem('slaptax_lang',lang);localStorage.setItem('slaptax_training_game','mat');localStorage.setItem('slaptax_duel_game','falsestart');},language);
 await page.goto('/');const panel=page.getByRole('tabpanel');
 await expect(panel.getByRole('heading',{level:3})).toHaveText(selection.map(game=>language==='fr'?game.labelFr:game.labelEn));
 await expect(panel.locator('article')).toHaveCount(selection.length);
 for(const game of selection){const label=language==='fr'?game.labelFr:game.labelEn;await expect(panel.getByRole('button',{name:`${language==='fr'?'Jouer':'Play'} ${label}`,exact:true})).toBeVisible();await expect(panel.locator(`article[data-game="${game.id}"] [data-scene="${game.id}"]`)).toBeVisible();}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath(`selection-${language}.png`),fullPage:true});
 // Stored retired preferences cannot silently launch a removed solo game.
 await page.goto('/?tab=training');await expect(page.getByRole('heading',{level:3,name:language==='fr'?'Braquage du Goûter':'Snack Heist',exact:true})).toBeVisible();
 await page.locator('summary').filter({hasText:language==='fr'?'Changer de jeu':'Change game'}).click();
 const picker=page.locator('details[open]');await expect(picker.getByRole('button')).toHaveCount(selection.length);
 await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');
 const userId=await page.evaluate(()=>localStorage.getItem('slaptax_user_id')),clientId=await page.evaluate(()=>localStorage.getItem('slaptax_client_id'));
 const state=await (await page.request.get(`/api/state?userId=${userId}&clientId=${clientId}`)).json();
 expect(state.progression.solo.daily.games.every((id:string)=>selection.some(game=>game.id===id))).toBe(true);
 expect(errors).toEqual([]);
});
