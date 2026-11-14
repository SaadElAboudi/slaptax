import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {stageProjection} from '../src/gameplay/cinematic/stage.ts';

test('worker camera snapshots preserve ground targeting across portrait, square and wide views',()=>{
 for(const aspect of [.5,1,2]){
  const camera=new T.PerspectiveCamera(40,aspect,.1,100);camera.position.set(6,10,16);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const project=stageProjection({projectionInverse:camera.projectionMatrixInverse.toArray(),world:camera.matrixWorld.toArray()});
  for(const [x,z]of [[-3,-3],[0,0],[3,2]]){
   const screen=new T.Vector3(x,0,z).project(camera),point=project((screen.x+1)/2,(1-screen.y)/2);
   assert.ok(point);assert.ok(Math.abs(point.x-(x*50+300))<1e-6);assert.ok(Math.abs(point.y-(z*50+300))<1e-6);
  }
 }
});
