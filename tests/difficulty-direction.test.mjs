import test from 'node:test';import assert from 'node:assert/strict';
import {getLevel,generateGates} from '../app/lib/levels.js';import {Flight} from '../app/lib/flight.js';import {PoseInput} from '../app/lib/pose.js';
test('twenty levels shrink from 100% to 30%, increase displacement and actual speed',()=>{
 assert.equal(getLevel(1).radius,1.7);assert.equal(getLevel(20).radius,.51);assert.equal(getLevel(1).speed,9);assert.equal(getLevel(20).speed,15.3);
 for(let n=2;n<=20;n++){const a=getLevel(n-1),b=getLevel(n);assert.ok(b.radius<a.radius);assert.ok(b.maxStep>a.maxStep);assert.ok(b.speed>a.speed);assert.ok(a.radius-b.radius<.064);}
});
test('increased speed advances more gates in the same wall time, using the same world spacing',()=>{
 const easy=generateGates({level:1}),hard=generateGates({level:20});assert.equal(easy.length,12);assert.equal(hard.length,21);assert.ok(hard[1].at-hard[0].at<easy[1].at-easy[0].at);
 assert.ok(Math.abs((hard[1].at-hard[0].at)*getLevel(20).speed-27)<1e-8);assert.ok(hard.at(-1).at<=39);
 const a=new Flight(),b=new Flight();a.start(1);b.start(20);a.step(.1,{yaw:.1});b.step(.1,{yaw:.1});assert.ok(b.ship.x>a.ship.x);assert.equal(b.speed,15.3);
});
test('new default reverses former yaw, toggle restores former sign and recenter preserves choice',()=>{
 const p=new PoseInput();p.value={yaw:.12,pitch:.06};assert.equal(p.get().yaw,-.12);assert.equal(p.get().pitch,.06);p.yawSign*=-1;assert.equal(p.get().yaw,.12);p.recenter();assert.equal(p.yawSign,1);p.yawSign*=-1;p.value.yaw=.12;assert.equal(p.get().yaw,-.12);
});
