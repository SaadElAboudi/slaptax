import {test,expect} from '@playwright/test';

for(const size of [{width:320,height:650},{width:390,height:844}]){
 test(`color memory is playable with visible touch controls at ${size.width}x${size.height}`,async({page},info)=>{
  test.skip(!info.project.name.includes('mobile'),'Touch interactions');test.setTimeout(90000);
  await page.setViewportSize(size);
  await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_onboarded','1');});
  await page.goto('/?tab=training&game=chroma');
  await page.getByRole('button',{name:'Entrer dans l arene'}).click();
  const chroma=page.getByTestId('chroma');
  for(let attempt=0;attempt<3;attempt++){
   await expect(chroma).toHaveAttribute('data-phase','mix');
   for(const control of await chroma.locator('input,button').all()){
    const box=await control.boundingBox();expect(box).toBeTruthy();expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(size.height);
   }
   await page.getByRole('slider',{name:'Teinte',exact:true}).fill(String(80+attempt*60));
   const picker=await page.getByTestId('chroma-picker').boundingBox();
   await page.touchscreen.tap(picker!.x+picker!.width*.6,picker!.y+picker!.height*.4);
   await page.getByRole('button',{name:'Verrouiller',exact:true}).tap();
   await expect(chroma).toHaveAttribute('data-phase','reveal');
   if(attempt===0)await page.screenshot({path:info.outputPath(`color-reveal-${size.width}.png`)});
  }
  await expect(page.getByTestId('practice-next-goal')).toBeVisible({timeout:15000});
  await expect(page.getByRole('button',{name:'Je prends ma revanche',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Je prends ma revanche',exact:true}).tap();
  await expect(page.getByRole('button',{name:'Entrer dans l arene'})).toBeVisible();
 });
}
