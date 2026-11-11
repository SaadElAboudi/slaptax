import {test,expect} from '@playwright/test';
import selection from '../../shared/game-selection.json' with {type:'json'};

test.beforeEach(async({page},info)=>{
 if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:650});
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 await page.goto('/');
});

test('home offers six distinct games and an immediate first play',async({page},info)=>{
 const games=page.locator('#games');
 await expect(games.locator('article')).toHaveCount(6);
 await expect(games.getByRole('heading',{level:3})).toHaveText(selection.map(g=>g.labelFr));
 const start=page.getByRole('button',{name:'Jouer à quatre',exact:true});await expect(start).toBeInViewport();
 for(const id of ['toilet','pigeon','lift','balloon','garde','bombpass'])await expect(games.locator(`[data-game="${id}"]`)).toHaveCount(0);
 for(const button of await games.locator('button,a').all()){const box=(await button.boundingBox())!;expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('home-six-games.png'),fullPage:true});
 await start.click();await expect(page.getByRole('heading',{name:'La compétition des potes.',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Créer une compétition',exact:true})).toBeEnabled();
});

test('score challenge begins from its game card without a mode picker',async({page})=>{
 await page.getByRole('link',{name:'Défier un ami : Chef Couic',exact:true}).click();
 await expect(page.getByTestId('link-challenge')).toBeVisible();
 await expect(page.getByRole('button',{name:'Creer mon defi',exact:true})).toBeEnabled();
 expect(new URL(page.url()).searchParams.get('game')).toBe('decoupe');
});

test('joining from home validates a room code and recovers from a missing room',async({page})=>{
 await page.getByText('Ou jouer en équipes : Braquage 2v2', {exact:true}).click();
 const form=page.getByRole('textbox',{name:'Rejoindre avec un code'});
 const join=page.getByRole('button',{name:'Rejoindre',exact:true});
 await expect(join).toBeDisabled();await form.fill('ab!12');await expect(form).toHaveValue('AB12');await expect(join).toBeDisabled();
 await form.fill('abcdef');await expect(join).toBeEnabled();await form.press('Enter');
 await expect(page.getByTestId('snack-team-panel')).toBeVisible();
 await expect(page.getByText('Ce salon n’existe plus. Vérifie le code ou crée un salon.',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Créer un salon 2v2',exact:true})).toBeEnabled();
});

test('home exposes the actual 3D trials separately from the six-game catalogue',async({page})=>{
 test.setTimeout(60000);
 const trials=page.getByTestId('home-3d-trials');await expect(trials.locator('article')).toHaveCount(2);
 await trials.getByRole('button',{name:'Jouer à la course 3D',exact:true}).click();
 await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();
 const scene=page.getByTestId('race-scene-3d');await expect(scene).toHaveAttribute('data-renderer','webgl');await expect.poll(async()=>Number(await scene.getAttribute('data-frames'))).toBeGreaterThan(16);await expect(scene).toBeVisible();
 await expect(page.getByTestId('scene-render-status')).toContainText('3D');
});
