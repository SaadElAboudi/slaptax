import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pigeonLanding,pigeonCarX} from '../src/gameplay/absurd.ts';
const require=createRequire(import.meta.url);
const {createParty,beginParty,actParty,tickParty,publicParty}=require('../../api/games/partyGames.js');
test('pigeon forecast follows authoritative wind integration and both car paths',()=>{
 for(const launch of [1000,2050,6000,17000]){
  const g=createParty('pigeon',['a','b'],(min:number)=>min);beginParty(g,1000);tickParty(g,launch);
  assert.equal(actParty(g,'a',{turn:g.turn,action:'drop'},launch),true);
  const origin=g.absurd.shots[0].x;tickParty(g,launch+850);
  const s=publicParty(g,'a',launch+850).absurd;
  assert.ok(Math.abs(s.shots[0].x-pigeonLanding(origin,launch-1000,850))<1e-9);
  for(const p of s.bodies)assert.ok(Math.abs(p.carX-pigeonCarX(p.slot,s.elapsed))<1e-9);
 }
});
