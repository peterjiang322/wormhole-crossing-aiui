import test from 'node:test';import assert from 'node:assert/strict';
import {PoseInput} from '../app/lib/pose.js';
const module=await import('../app/lib/controller.js').catch(()=>({}));
class Sensor {static all=[];constructor(){this.events={};Sensor.all.push(this);}addEventListener(k,f){this.events[k]=f;}removeEventListener(k){delete this.events[k];}start(){}stop(){this.stopped=true;}read(q){this.quaternion=q;this.events.reading?.();}}
test('sensor detaches and ignores a late reading after stop',()=>{
 let now=0;const p=new PoseInput({Orientation:Sensor,now:()=>now});p.start();const s=p.sensor;s.read([0,0,0,1]);const late=s.events.reading;p.stop();now=100;s.quaternion=[0,1,0,0];late();assert.equal(p.lastValid,0);assert.equal(s.stopped,true);assert.equal(p.sensor,null);
});
test('sensor rejects invalid quaternion and detects absence and stream loss',()=>{
 let now=0;const p=new PoseInput({Orientation:Sensor,now:()=>now});p.start();const s=p.sensor;
 s.read([0,0,0,0]);assert.equal(p.healthy(),false);now=2100;assert.equal(p.timedOut(),true);s.read([0,0,0,1]);assert.equal(p.healthy(),true);now+=1100;assert.equal(p.timedOut(),true);
});
test('gyro fallback integrates finite short samples without integrating gaps',()=>{
 let now=0;const p=new PoseInput({Gyro:Sensor,now:()=>now});p.start();const s=p.sensor;s.x=0;s.y=1;p.sample(s);now=100;p.sample(s);assert.equal(p.get().yaw,-.1);now=2000;p.sample(s);assert.equal(p.get().yaw,-.1);p.recenter();assert.equal(p.get().yaw,0);
});
test('controller calibrates, pauses on input loss and hides all resources',()=>{
 assert.equal(typeof module.Controller,'function','controller is not implemented');
 let now=0;let cleaned=0;const input={mode:'orientation',lastValid:0,start(){},stop(){cleaned++;},healthy(){return now<3000;},timedOut(){return now>=3000;},get(){return {yaw:.1,pitch:0};},recenter(){}};
 const c=new module.Controller({input,now:()=>now});c.show();c.start('head');assert.equal(c.phase,'calibrating');now=2100;c.tick();assert.equal(c.phase,'flying');now=2200;c.tick();assert.ok(c.flight.elapsed>0);now=3300;c.tick();assert.equal(c.phase,'paused');const t=c.flight.elapsed;c.hide();now=5000;c.tick();assert.equal(c.flight.elapsed,t);assert.ok(cleaned>0);assert.equal(c.visible,false);
});
test('keyboard mode and demo finish, demo is explicitly marked, restart clears scores',()=>{
 assert.equal(typeof module.Controller,'function');let now=0;const c=new module.Controller({now:()=>now});c.show();c.start('demo');now=2100;c.tick();
 for(let i=0;i<900;i++){now+=50;c.tick();}assert.equal(c.phase,'result');assert.equal(c.mode,'demo');assert.equal(c.flight.hits,12);
 c.start('keys');assert.equal(c.flight.score,0);assert.equal(c.phase,'calibrating');c.hide();c.show();assert.equal(c.phase,'ready');
});
test('slow rendering does not extend a 45-second flight',()=>{
 let now=0;const c=new module.Controller({now:()=>now});c.show();c.start('keys');now=2000;c.tick();
 for(let i=0;i<45;i++){now+=1000;c.tick();}
 assert.equal(c.phase,'result');assert.equal(c.flight.elapsed,45);
});
test('switching an automatic demonstration to keys starts a fresh manual round',()=>{
 let now=0;const c=new module.Controller({now:()=>now});c.show();c.start('demo');now=2000;c.tick();
 for(let i=0;i<400;i++){now+=100;c.tick();}assert.ok(c.flight.score>0);c.pause();c.useKeys();
 assert.equal(c.mode,'keys');assert.equal(c.flight.score,0);assert.equal(c.phase,'calibrating');
});
test('resume preserves flight and paused wall time is excluded',()=>{
 let now=0;const c=new module.Controller({now:()=>now});c.show();c.start('keys');now=2000;c.tick();now=2500;c.tick();c.pause();const time=c.flight.elapsed;now=25000;c.resume();now+=2100;c.tick();assert.equal(c.flight.elapsed,time);now+=100;c.tick();assert.ok(c.flight.elapsed>time);assert.ok(c.flight.elapsed<time+.2);
});
