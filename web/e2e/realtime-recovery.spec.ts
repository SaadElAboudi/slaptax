import {test,expect} from '@playwright/test';
test('a missing initial state reconnects automatically instead of leaving the game connecting forever',async({page,request})=>{
 test.setTimeout(30000);let joins=0;const practiceIds:string[]=[];const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.routeWebSocket('**/api/realtime**',ws=>{
  const server=ws.connectToServer();let arena=false;
  ws.onMessage(message=>{const data=JSON.parse(String(message));if(data.type==='party.practice'){arena=true;joins++;practiceIds.push(data.practiceId);}server.send(message);});
  server.onMessage(message=>{if(arena&&joins===1)return;ws.send(message);});
 });
 const clientId=crypto.randomUUID(),playerName='FirstFrame';const response=await request.post('/api/session/join',{data:{clientId,playerName}});expect(response.ok()).toBe(true);const {userId}=await response.json();
 await page.addInitScript(u=>{for(const [key,value] of Object.entries({client_id:u.clientId,user_id:u.userId,player_name:u.playerName,lang:'fr'}))localStorage.setItem(`slaptax_${key}`,value);},{clientId,userId,playerName});
 await page.goto('/');await page.getByRole('button',{name:'Jouer Tarte ta Face',exact:true}).click();await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 await expect(page.getByText('Connexion en cours…',{exact:true})).toBeVisible();await expect(page.getByTestId('pie-canvas')).toHaveCount(0);
 await expect.poll(()=>joins,{timeout:13000}).toBeGreaterThan(1);await expect(page.getByTestId('pie-canvas')).toBeVisible();await expect(page.getByRole('slider',{name:'Viser la tarte'})).toBeEnabled({timeout:7000});
 expect(new Set(practiceIds).size).toBe(1);expect(errors).toEqual([]);
});
