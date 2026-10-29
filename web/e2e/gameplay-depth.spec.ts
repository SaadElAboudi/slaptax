import {test,expect} from '@playwright/test';
import {visualAbsurd,pigeonLanding} from '../src/gameplay/absurd';
import {visualCarnival} from '../src/gameplay/carnival';
import type {AbsurdState,CarnivalState} from '../src/gameplay/party';

test('visual projection is bounded and never invents scores, collisions or future warnings',()=>{
 const state={kind:'pigeon',elapsed:1000,wind:0,bodies:[{id:'a',slot:0,x:100,targetX:500,carX:100,lane:0,score:180}],shots:[{id:1,x:200,progress:.5}],strikes:[],wave:null,events:[{age:0,kind:'splat',value:180}]} as unknown as AbsurdState;
 const next=visualAbsurd(state,5000,new Map(),1200);expect(next.elapsed).toBe(1100);expect(next.bodies[0].x).toBe(132);expect(next.bodies[0].score).toBe(180);expect(state.bodies[0].x).toBe(100);expect(next.shots[0].progress).toBeLessThan(1);expect(next.events[0].age).toBe(100);
 const laneState={...state,kind:'lift',wave:{index:1,gas:null,bean:null,remaining:710}};
 const lane=visualAbsurd(laneState,100,new Map([['a',{from:0,to:2,at:1000}]]),1070);expect(lane.bodies[0].visualLane).toBeGreaterThan(0);expect(lane.bodies[0].visualLane).toBeLessThan(2);expect(lane.wave?.gas).toBeNull();
 const pie={kind:'pie',elapsed:1000,bodies:[{id:'a',x:.3,targetX:.32,manual:true,score:0}],shots:[],events:[]} as unknown as CarnivalState;
 expect(visualCarnival(pie,100).bodies[0].x).toBe(.32);expect(pie.bodies[0].x).toBe(.3);
 let expected=200;for(let t=0;t<900;t+=50)expected+=Math.sin((1000+t+25)/2300)*58*.05;expect(pigeonLanding(200,1000)).toBeCloseTo(expected,10);
});

test('lower scene controls movement without firing, with an accessible placement alternative',async({page},info)=>{
 if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:740});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let state:CarnivalState|undefined;
 page.on('websocket',ws=>ws.on('framereceived',event=>{try{const message=JSON.parse(String(event.payload));if(message.party?.carnival)state=message.party.carnival;}catch{}}));
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=training&game=pie');await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>state?.bodies.length).toBe(2);
 const canvas=page.getByTestId('pie-canvas'),box=(await canvas.boundingBox())!,width=Math.min(box.width,box.height*600/420),left=box.x+(box.width-width)/2,top=box.y+(box.height-width*420/600)/2,x=left+100/600*width,y=top+330/600*width;
 if(info.project.name.includes('mobile')){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}else await page.mouse.click(x,y);
 await expect.poll(()=>state?.bodies.find(p=>!p.bot)?.manual).toBe(true);await expect.poll(()=>state?.bodies.find(p=>!p.bot)?.x).toBeLessThan(.15);
 expect(state?.events.some(e=>e.kind==='throw'&&e.id===state?.bodies.find(p=>!p.bot)?.id)).toBe(false);
 await page.getByRole('slider',{name:'Déplacer le pâtissier'}).fill('1');await expect.poll(()=>state?.bodies.find(p=>!p.bot)?.x).toBeGreaterThan(.89);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('manual-pie-movement.png'),fullPage:true});expect(errors).toEqual([]);
});
