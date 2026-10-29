import test from 'node:test';import assert from 'node:assert/strict';
const module=await import('../app/lib/menu-motion.js').catch(()=>({}));
function harness(){assert.equal(typeof module.MenuMotion,'function','menu motion adapter is missing');let now=0,serial=0;const timers=new Map(),patches=[];const motion=new module.MenuMotion({emit:p=>patches.push(p),now:()=>now,schedule:fn=>{timers.set(++serial,fn);return serial;},cancel:id=>timers.delete(id)});return {motion,timers,patches,step(t){now=t;for(const fn of [...timers.values()])fn();}};}
test('fourth item moves the full rail left and settles within 180ms',()=>{
 const h=harness();h.motion.to(142);h.step(90);assert.ok(h.motion.position>0&&h.motion.position<142);h.step(180);assert.equal(h.motion.position,142);assert.equal(h.patches.at(-1).menuTrackLeft,-142);assert.equal(h.timers.size,0);
});
test('returning to third restores the first item without relying on native scroll',()=>{
 const h=harness();h.motion.to(142);h.step(180);h.motion.to(0);h.step(360);assert.equal(h.patches.at(-1).menuTrackLeft,0);assert.equal(h.timers.size,0);
});
test('fast direction changes animate from current position and hidden callbacks cannot update',()=>{
 const h=harness();h.motion.to(142);h.step(60);const position=h.motion.position;h.motion.to(0);assert.equal(h.motion.position,position);const late=[...h.timers.values()][0];h.motion.stop();const count=h.patches.length;late();assert.equal(h.patches.length,count);assert.equal(h.timers.size,0);
});
test('duplicate target does not restart animation; reset clears offset and timer',()=>{
 const h=harness();h.motion.to(142);h.step(90);h.motion.to(142);h.step(180);assert.equal(h.motion.position,142);h.motion.to(0);h.motion.reset();assert.equal(h.motion.position,0);assert.equal(h.timers.size,0);
});
