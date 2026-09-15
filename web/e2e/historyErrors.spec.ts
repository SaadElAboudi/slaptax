import {test,expect} from '@playwright/test';

test('history and My challenges expose loading failures instead of a false empty state',async({page,request})=>{
    const clientId=crypto.randomUUID(),response=await request.post('/api/session/join',{data:{clientId,playerName:'History'}});
    const {userId}=await response.json();
    await page.addInitScript(({clientId,userId})=>{
        for(const [key,value] of Object.entries({client_id:clientId,user_id:userId,onboarded:'1',lang:'fr'}))localStorage.setItem(`slaptax_${key}`,value);
    },{clientId,userId});
    await page.route('**/api/history?*',route=>route.fulfill({status:503,body:'{}'}));
    await page.goto('/?tab=stats');await expect(page.getByTestId('history-panel').getByRole('alert')).toContainText('Historique indisponible');
    await expect(page.getByText('Aucun resultat pour le moment.')).toHaveCount(0);
    await page.unroute('**/api/history?*');await page.getByRole('button',{name:'Actualiser l historique'}).click();
    await expect(page.getByTestId('history-panel').getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('Aucun resultat pour le moment.')).toBeVisible();
    await page.route('**/api/link-challenges/mine?*',route=>route.fulfill({status:503,body:'{}'}));
    await page.getByRole('button',{name:'Mes defis',exact:true}).click();
    await expect(page.getByTestId('my-challenges').getByRole('alert')).toContainText('Resultats indisponibles');
    await expect(page.getByText('Aucun defi ici pour le moment.')).toHaveCount(0);
    await page.unroute('**/api/link-challenges/mine?*');await page.getByRole('button',{name:'Actualiser les defis'}).click();
    await expect(page.getByText('Aucun defi ici pour le moment.')).toBeVisible();
});
