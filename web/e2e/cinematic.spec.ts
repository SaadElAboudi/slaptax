import {test,expect} from '@playwright/test';
test.use({trace:'off'});
for(const id of ['stopgo','fragile','table'])test(`cinematic ${id} renders and keeps mobile controls usable`,async({page},info)=>{
 test.setTimeout(60000);await page.setViewportSize({width:360,height:740});await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`/?tab=training&game=${id}`);await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();
 if(id==='fragile'){const canvas=page.getByTestId('fragile-canvas');await expect(canvas).toBeVisible();const image=canvas.locator('image');await expect(image).toHaveAttribute('href','/art/cinematic/cookie-v3.webp');}else{const scene=page.getByTestId(`${id==='stopgo'?'race':'table'}-scene-3d`);await expect(scene).toBeVisible();await expect(scene).toHaveAttribute('data-renderer','webgl');await expect.poll(async()=>Number(await scene.getAttribute('data-frames'))).toBeGreaterThan(id==='table'?2:16);await expect(scene).toHaveAttribute('data-renderer','webgl');}
 const controls=id==='stopgo'?page.getByTestId('stopgo-control'):id==='table'?page.getByRole('button',{name:'Se propulser',exact:true}):page.getByTestId('fragile-canvas');const r=(await controls.boundingBox())!;expect(r.height).toBeGreaterThanOrEqual(44);expect(r.y+r.height).toBeLessThanOrEqual(740);
 // Test the gesture before screenshots: robots continue playing during a capture.
 if(id==='table'){await expect(controls).toBeEnabled();const surface=page.getByTestId('table-canvas'),box=(await surface.boundingBox())!,x=Number(await surface.getAttribute('data-player-x')),y=Number(await surface.getAttribute('data-player-y'));await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await expect.poll(async()=>Math.hypot(Number(await surface.getAttribute('data-player-x'))-x,Number(await surface.getAttribute('data-player-y'))-y),{timeout:2500}).toBeGreaterThan(4);}
 await page.screenshot({path:info.outputPath(`${id}-cinematic.png`),animations:'disabled',timeout:5000});
 expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);

});

test('cinematic robot arena has four visible contestants',async({page},info)=>{test.setTimeout(60000);await page.setViewportSize({width:360,height:740});await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=survival');await page.getByRole('button',{name:'M’entraîner contre 3 robots',exact:true}).click();const scene=page.getByTestId('race-scene-3d');await expect(scene).toHaveAttribute('data-renderer','webgl',{timeout:25000});await expect.poll(async()=>Number(await scene.getAttribute('data-frames'))).toBeGreaterThan(3);await page.addStyleTag({content:'span[class*="cameraLabel"]{visibility:hidden!important}'});await expect(page.getByTestId('stopgo-control')).toBeEnabled();const clip=(await page.getByTestId('race-scene').boundingBox())!;await page.screenshot({clip,path:info.outputPath('arena-preview.png'),animations:'disabled',timeout:8000});});


test('slow frames adapt quality without replacing the 3D scene',async({page})=>{
 test.setTimeout(60000);
 await page.addInitScript(()=>{
  localStorage.setItem('slaptax_lang','fr');
  const dataset=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'dataset')!;
  Object.defineProperty(HTMLCanvasElement.prototype,'dataset',{get(){const real=dataset.get!.call(this);return new Proxy(real,{get(target,key){return key==='renderMs'?'200':Reflect.get(target,key,target);},set(target,key,value){return Reflect.set(target,key,value,target);}});}});
 });
 await page.goto('/?tab=training&game=stopgo');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();
 const scene=page.getByTestId('race-scene-3d');await expect(scene).toHaveAttribute('data-quality','2',{timeout:20000});
 await expect.poll(async()=>Number(await scene.getAttribute('data-frames'))).toBeGreaterThan(24);
 await expect(scene).toHaveAttribute('data-renderer','webgl');await expect(scene).toBeVisible();
 await expect(page.getByTestId('scene-render-status')).toHaveText('3D · qualité adaptée');await expect(page.getByTestId('stopgo-control')).toBeEnabled();
});

test('unavailable 3D is explicitly labelled and offers a retry',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:string,...args:any[]){if(type.startsWith('webgl')||type==='experimental-webgl')return null;return get.apply(this,[type,...args] as any);} as typeof get;});
 await page.goto('/?tab=training&game=stopgo');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();
 await expect(page.getByTestId('race-scene-3d')).toHaveAttribute('data-renderer','fallback');await expect(page.getByTestId('scene-render-status')).toContainText('Vue légère · 3D indisponible');
 await page.getByRole('button',{name:'Réessayer la 3D',exact:true}).click();await expect(page.getByTestId('race-scene-3d')).toHaveAttribute('data-renderer','fallback');await expect(page.getByTestId('stopgo-control')).toBeEnabled();
});
