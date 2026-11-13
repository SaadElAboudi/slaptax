import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {prepareCampaign} from '../campaign-demos.mjs';
import {loadVideos,root} from '../prepare.mjs';
let directory,data;
before(async()=>{directory=await mkdtemp(path.join(tmpdir(),'slaptax-promo-'));await mkdir(path.join(directory,'src'));data=await prepareCampaign(directory);});
after(async()=>{if(directory)await rm(directory,{recursive:true,force:true});});
test('campaign covers the active catalogue once and excludes all retired games',async()=>{
 const campaign=JSON.parse(await readFile(path.join(root,'campaign.json'),'utf8')),selection=JSON.parse(await readFile(path.join(root,'../shared/game-selection.json'),'utf8')),videos=await loadVideos();
 const active=campaign.featured.map(id=>videos.find(v=>v.id===id));assert.deepEqual(active.map(v=>v.game).sort(),selection.map(v=>v.id).sort());
 for(const v of active){assert.equal(v.renderer,'campaign-engine-demo');assert.equal(v.duration,15);assert.equal(v.music,null);assert.equal(v.voice,null);assert.equal(v.status,'demo');}
});
test('CHROMA hides the target while mixing and scores the accepted answer with production precision',()=>{
 const mix=data.chroma.frames.filter(s=>s.phase==='mix');assert.ok(mix.length>0);assert.ok(mix.every(s=>!s.color&&!s.feedback.color));
 const result=data.chroma.result,target=result.feedback.color,answer=result.feedback.colors.demo;
 const error=Math.round(Math.hypot(...target.map((n,i)=>n-answer[i]))*1000);
 assert.equal(result.runs.demo.errors[0],error);assert.equal(result.scores.demo,-error);assert.ok(error>0);
});
test('table consequence follows a real collision, elimination and awarded KO',()=>{
 assert.ok(data.table.frames.slice(0,data.table.end).some(s=>s.table.hits>0));
 const end=data.table.frames[data.table.end];assert.equal(end.phase,'done');assert.equal(end.table.winnerId,'demo');assert.equal(end.table.bodies.find(b=>b.id==='rival').out,true);assert.equal(end.table.bodies.find(b=>b.id==='demo').kos,1);
});
test('pie scene includes accepted dodges and scored hits without presenting a final match victory',()=>{
 assert.ok(data.pie.dodges>=1);assert.ok(data.pie.hits>=1);
 const last=data.pie.frames.at(-1);assert.equal(last.phase,'brawl');assert.equal(last.scores.demo,last.carnival.bodies.find(b=>b.id==='demo').score);assert.ok(last.scores.demo>0);
});
