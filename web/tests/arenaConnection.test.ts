import test from 'node:test';
import assert from 'node:assert/strict';
import {arenaConnection,ARENA_STALE_MS} from '../src/gameplay/arenaConnection.ts';
test('losing the connection blocks live controls even with a recent snapshot',()=>{assert.equal(arenaConnection(false,'playing',1000,1100),'reconnecting');});
test('a stalled stream cannot remain playable and a new snapshot restores it',()=>{assert.equal(arenaConnection(true,'playing',1000,3999),'live');assert.equal(arenaConnection(true,'playing',1000,1000+ARENA_STALE_MS),'stale');assert.equal(arenaConnection(true,'playing',4020,4050),'live');});
test('a countdown or cancelled match is never a live connection state',()=>{for(const phase of ['waiting','countdown','cancelled','done'])assert.equal(arenaConnection(true,phase,1000,9999),'waiting');});
