import {test,expect} from '@playwright/test';
import type {AbsurdState} from '../src/gameplay/party';
test('pigeon keeps real flight and one drop action visible on a small screen',async({page},info)=>{
 const mobile=info.project.name.includes('mobile');if(mobile)await page.setViewportSize({width:320,height:650});
 let state:AbsurdState|undefined;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('websocket',ws=>ws.on('framereceived',f=>{try{const d=JSON.parse(String(f.payload));if(d.party?.absurd)state=d.party.absurd;}catch{}}));
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=training&game=pigeon');await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 const drop=page.getByRole('button',{name:'LARGUE !',exact:true});await expect(drop).toBeEnabled();await expect(page.getByTestId('pigeon-streak')).toContainText('PLEIN CENTRE ×0');
 const id=await page.evaluate(()=>localStorage.getItem('slaptax_user_id')),me=()=>state?.bodies.find(p=>p.id===id);const before=me()!.x;
 if(mobile){const b=(await page.getByTestId('pigeon-canvas').boundingBox())!;await page.touchscreen.tap(b.x+b.width*.8,b.y+b.height*.2);}else{await page.getByTestId('absurd-game').focus();await page.keyboard.press('ArrowRight');}
 await expect.poll(()=>me()?.x).not.toBe(before);
 if(mobile)await drop.tap();else await page.keyboard.press('j');await expect.poll(()=>me()?.cooldown||0).toBeGreaterThan(0);await expect.poll(()=>state?.shots.some(s=>s.owner===id)).toBe(true);
 await expect(page.getByRole('button',{name:'PARASOL !',exact:true})).toHaveCount(0);await expect(page.getByRole('slider')).toHaveCount(0);
 for(const element of [page.getByTestId('pigeon-canvas'),page.getByTestId('pigeon-streak'),drop]){const b=(await element.boundingBox())!;expect(b.y).toBeGreaterThanOrEqual(0);expect(b.y+b.height).toBeLessThanOrEqual(page.viewportSize()!.height);expect(b.x+b.width).toBeLessThanOrEqual(page.viewportSize()!.width);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);expect(errors).toEqual([]);await page.screenshot({path:info.outputPath('pigeon-forecast-controls.png')});
});
