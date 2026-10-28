import test from 'node:test';
import assert from 'node:assert/strict';
const core = await import('../app/lib/flight.js').catch(()=>({}));
const pose = await import('../app/lib/pose.js').catch(()=>({}));
test('projection responds to yaw/pitch and depth, clips points behind camera',()=>{
 assert.equal(typeof core.project,'function','projection is not implemented');
 const p=core.project({x:1,y:0,z:10},{}), far=core.project({x:1,y:0,z:20},{});
 assert.ok(p.x>far.x); assert.ok(core.project({x:0,y:0,z:10},{yaw:.1}).x<224);
 assert.ok(core.project({x:0,y:0,z:10},{pitch:.1}).y>176);
 assert.equal(core.project({x:0,y:0,z:-1},{}),null);
});
test('a round has 12 reachable gates, lasts 45 seconds and resets cleanly',()=>{
 assert.equal(typeof core.Flight,'function','flight is not implemented');
 const f=new core.Flight(); f.start(); assert.equal(f.gates.length,12);
 for(let i=0;i<450;i++)f.step(.1,{yaw:0,pitch:0},true);
 assert.equal(f.phase,'result');assert.equal(f.elapsed,45);assert.equal(f.resolved,12);assert.equal(f.hits,12);
 assert.ok(f.score>0);f.start();assert.equal(f.score,0);assert.equal(f.hits,0);assert.equal(f.elapsed,0);
});
test('pause freezes gameplay; misses are resolved once without ending the round',()=>{
 assert.equal(typeof core.Flight,'function');const f=new core.Flight();f.start();f.step(1,{});const before=f.elapsed;
 f.pause();f.step(10,{});assert.equal(f.elapsed,before);f.resume();
 for(let i=0;i<450;i++)f.step(.1,{yaw:.5,pitch:.3});
 assert.equal(f.resolved,12);assert.equal(f.phase,'result');assert.ok(f.hits<12);assert.ok(f.score>=0);
});
test('quaternion relative rotation wraps at ±180 and rejects invalid values',()=>{
 assert.equal(typeof pose.relativePose,'function','pose is not implemented');
 const q=a=>[0,Math.sin(a/2),0,Math.cos(a/2)];
 const p=pose.relativePose(q(-Math.PI+.02),q(Math.PI-.02));assert.ok(Math.abs(p.yaw)<.05);
 assert.equal(pose.relativePose([NaN,0,0,1],[0,0,0,1]),null);
 assert.equal(pose.relativePose([0,0,0,0],[0,0,0,1]),null);
});
test('looking toward a gate steers toward it; looking straight retains lateral position',()=>{
 const f=new core.Flight();f.start();for(let i=0;i<20;i++)f.step(.05,{yaw:.15,pitch:0});
 const x=f.ship.x;assert.ok(x>.8);for(let i=0;i<20;i++)f.step(.05,{yaw:0,pitch:0});assert.ok(Math.abs(f.ship.x-x)<.01,'returning gaze should not drag ship away from the gate');
});
test('scene uses the AIUI 448 by 352 full-screen reference viewport',()=>{assert.equal(core.WIDTH,448);assert.equal(core.HEIGHT,352);});
