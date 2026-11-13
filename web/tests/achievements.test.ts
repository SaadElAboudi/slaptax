import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAchievement,emptyAchievements} from '../src/gameplay/achievements.ts';
test('a repeated authoritative result cannot add wins or a false achievement',()=>{
 const event={id:'duel:server-id',type:'duel' as const,won:true};const first=applyAchievement(emptyAchievements(),event,100);const repeat=applyAchievement(first.progress,event,200);
 assert.equal(repeat.progress,first.progress);assert.equal(repeat.progress.wins,1);assert.deepEqual(repeat.added,[]);
});
test('only three distinct duel victories count toward the three-win achievement',()=>{
 let state=emptyAchievements();for(let i=0;i<2;i++)state=applyAchievement(state,{id:`duel:${i}`,type:'duel',won:true},i+1).progress;
 state=applyAchievement(state,{id:'training:one',type:'training',score:900},3).progress;assert.equal(state.wins,2);
 state=applyAchievement(state,{id:'duel:loss',type:'duel',won:false},4).progress;assert.equal(state.wins,2);assert.equal(state.unlocked['three-wins'],undefined);
 state=applyAchievement(state,{id:'duel:0',type:'duel',won:true},5).progress;assert.equal(state.wins,2);
 state=applyAchievement(state,{id:'duel:third',type:'duel',won:true},6).progress;assert.equal(state.unlocked['three-wins'],6);
});
test('practice scores must be valid and exactly perfect; a competition win has its own badge',()=>{
 let state=emptyAchievements();for(const score of [-1,NaN,Infinity,1001])assert.equal(applyAchievement(state,{id:'invalid',type:'training',score},1).progress,state);
 state=applyAchievement(state,{id:'training:good',type:'training',score:999},2).progress;assert.equal(state.unlocked['perfect-practice'],undefined);
 state=applyAchievement(state,{id:'training:perfect',type:'training',score:1000},3).progress;assert.equal(state.unlocked['perfect-practice'],3);
 state=applyAchievement(state,{id:'competition:ABC:3',type:'competition',won:true},4).progress;assert.equal(state.unlocked.survivor,4);assert.equal(state.wins,0);
});
