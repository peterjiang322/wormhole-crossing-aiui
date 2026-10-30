import test from 'node:test';import assert from 'node:assert/strict';import {Controller} from '../app/lib/controller.js';import {Flight} from '../app/lib/flight.js';import {LEVELS,generateGates} from '../app/lib/levels.js';
test('selected level survives pause/recalibration/replay, demo-to-keys and visibility round reset',()=>{
 let now=0;const c=new Controller({now:()=>now});c.show();c.selectLevel(16);c.start('demo');now=2000;c.tick();for(let i=0;i<90;i++){now+=50;c.tick();}c.pause();const f=c.flight,t=f.elapsed;c.resume();now+=2100;c.tick();assert.equal(c.flight,f);assert.equal(c.levelId,16);assert.equal(c.flight.elapsed,t);c.pause();c.useKeys();assert.equal(c.flight.levelId,16);assert.equal(c.flight.score,0);c.hide();c.show();assert.equal(c.levelId,16);assert.equal(c.phase,'ready');
});
test('a completed level waits for explicit next; final level has no next or wraparound',()=>{
 let now=0;const c=new Controller({now:()=>now});c.show();c.selectLevel(19);c.start('demo');now=2000;c.tick();now+=45000;c.tick();assert.equal(c.phase,'result');assert.equal(c.levelId,19);now+=5000;c.tick();assert.equal(c.levelId,19);assert.equal(c.nextLevel(),true);assert.equal(c.levelId,20);now+=2000;c.tick();now+=45000;c.tick();assert.equal(c.phase,'result');assert.equal(c.flight.hits,c.flight.gates.length);assert.equal(c.nextLevel(),false);assert.equal(c.levelId,20);
});
test('active rounds reject free selection and invalid level or seed inputs never enter a flight',()=>{
 const c=new Controller();c.show();c.start('keys');assert.equal(c.openLevels(),false);assert.equal(c.selectLevel(20),false);assert.equal(c.levelId,0);assert.throws(()=>c.selectLevel(21));for(const seed of [NaN,-1,1.1,4294967296])assert.throws(()=>generateGates({level:1,seed}));
});
test('420 generated seeds remain playable in the actual flight engine',()=>{
 for(const p of LEVELS)for(let seed=0;seed<20;seed++){
  const f=new Flight();f.start(p.id);f.gates=generateGates({level:p.id,seed});for(let i=0;i<450;i++)f.step(.1,{},true);assert.equal(f.hits,f.gates.length,'level '+p.id+' seed '+seed);
 }
});
