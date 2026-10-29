import test from 'node:test';import assert from 'node:assert/strict';
import {Flight} from '../app/lib/flight.js';import {Controller} from '../app/lib/controller.js';
const mod=await import('../app/lib/levels.js').catch(()=>({}));
const lengths=g=>g.slice(1).map((p,i)=>Math.hypot(p.x-g[i].x,p.y-g[i].y));
test('original experience plus twenty selectable level profiles with small five-level size steps',()=>{
 assert.equal(typeof mod.getLevel,'function','level profiles are missing');assert.equal(mod.LEVELS.length,21);
 for(let n=1;n<=20;n++){const p=mod.getLevel(n);assert.equal(p.radius,Number((1.7*(1-Math.floor((n-1)/5)*.03)).toFixed(3)));assert.equal(p.duration,45);assert.equal(p.gateCount,12);}
 assert.throws(()=>mod.getLevel(21));assert.throws(()=>mod.getLevel(-1));
});
test('actual adjacent distances and mean increase gradually across the twenty authored seeds',()=>{
 assert.equal(typeof mod.generateGates,'function','level generator is missing');let previous=null;
 for(let n=1;n<=20;n++){const p=mod.getLevel(n),g=mod.generateGates({level:n,seed:p.seed}),d=lengths(g);
  assert.ok(Math.abs(Math.max(...d)-p.maxStep)<1e-8);
  if(previous)for(let i=0;i<d.length;i++){assert.ok(d[i]>previous[i]);assert.ok(d[i]-previous[i]<.05);}
  assert.equal(g.length,12);assert.equal(g[11].at,39);previous=d;
 }
});
test('seeded generation is repeatable, variable, bounded and reachable over 420 routes',()=>{
 assert.equal(typeof mod.generateGates,'function');
 assert.deepEqual(mod.generateGates({level:10,seed:123}),mod.generateGates({level:10,seed:123}));assert.notDeepEqual(mod.generateGates({level:10,seed:123}),mod.generateGates({level:10,seed:124}));
 for(let n=0;n<=20;n++)for(let seed=0;seed<20;seed++){
  const g=mod.generateGates({level:n,seed});for(const p of g){assert.ok(Math.abs(p.x)<=3.3);assert.ok(Math.abs(p.y)<=1.8);assert.ok(p.radius>=1.54);assert.ok(Number.isFinite(p.at));}
  for(const d of lengths(g))assert.ok(Math.atan(d/27)*180/Math.PI<7);
 }
});
test('all twenty levels run 45 seconds and autopilot reaches every gate',()=>{
 assert.equal(typeof mod.getLevel,'function');for(let n=0;n<=20;n++){const f=new Flight();f.start(n);for(let i=0;i<450;i++)f.step(.1,{},true);assert.equal(f.phase,'result');assert.equal(f.hits,12,'level '+n);assert.equal(f.levelId,n);assert.equal(f.elapsed,45);}
});
test('free selection, replay, manual next and final level boundary work without lock or auto advance',()=>{
 const c=new Controller();c.show();assert.equal(typeof c.openLevels,'function','selection flow is missing');c.openLevels();assert.equal(c.phase,'levels');c.selectLevel(20);assert.equal(c.levelId,20);assert.equal(c.phase,'ready');c.start('keys');assert.equal(c.levelId,20);assert.equal(c.nextLevel(),false);c.phase='result';assert.equal(c.nextLevel(),false);c.home();c.selectLevel(5);c.phase='result';assert.equal(c.nextLevel(),true);assert.equal(c.levelId,6);assert.equal(c.phase,'calibrating');
});
