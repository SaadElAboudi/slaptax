const test=require('node:test'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {createPostgresStore}=require('../infrastructure/store');
const {makeDefaultState}=require('../infrastructure/db');
function fake(acquired=true){
 const lease=new EventEmitter();lease.released=false;lease.release=()=>{lease.released=true;};
 const state=makeDefaultState(),pool={closed:false,fail:false,writes:[],connect:async()=>lease,query:async(sql,args)=>{
  if(sql.startsWith('SELECT payload'))return {rows:[{payload:state}]};
  if(sql.includes('INSERT INTO')){if(pool.fail)throw new Error('temporary database failure');pool.writes.push(JSON.parse(args[1]));}
  return {rows:[]};
 },end:async()=>{pool.closed=true;}};
 lease.query=(sql,args)=>sql.includes('advisory')?Promise.resolve({rows:[{acquired}]}):pool.query(sql,args);
 return {pool,lease};
}
test('a second state-cache writer is refused and its pool is closed',async()=>{
 const f=fake(false),s=createPostgresStore('unused',{pool:f.pool});await assert.rejects(s.ready,/Another SlapTax/);assert.equal(f.lease.released,true);assert.equal(f.pool.closed,true);
});
test('a failed persistence attempt does not permanently poison the write queue',async()=>{
 const f=fake(),s=createPostgresStore('unused',{pool:f.pool});await s.ready;
 const outside=s.read();outside.users[0].wallet=999;assert.equal(s.read().users[0].wallet,25);
 let state=s.read();state.users[0].wallet=35;f.pool.fail=true;s.write(state);await assert.rejects(s.flush(),/temporary/);
 f.pool.fail=false;state=s.read();s.write(state);await s.flush();assert.equal(f.pool.writes.at(-1).users[0].wallet,35);await s.close();assert.equal(f.lease.released,true);assert.equal(f.pool.closed,true);
});
test('loss of the exclusive database lease fails closed for reads and writes',async()=>{
 const f=fake(),s=createPostgresStore('unused',{pool:f.pool});await s.ready;const state=s.read();f.lease.emit('error',Error('connection lost'));
 assert.throws(()=>s.read(),/lease lost/);assert.throws(()=>s.write(state),/lease lost/);await s.close();
});
