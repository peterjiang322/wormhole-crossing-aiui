import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {PoseInput} from '../app/lib/pose.js';import {Controller} from '../app/lib/controller.js';import {drawScene} from '../app/lib/renderer.js';import {MenuController} from '../app/lib/menu-controller.js';
function context(){return new Proxy({calls:0},{get(target,key){if(key in target)return target[key];return (...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'nonfinite draw argument '+key);target.calls++;};},set(target,key,v){target[key]=v;return true;}});}
function pageHarness(){
 const code=fs.readFileSync(new URL('../app/pages/index/index.ink',import.meta.url),'utf8').match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm,'').replace('export default','return');
 let now=0;const active=new Set(),timers=new Map();let serial=0;const ctx=context();
 class Sensor{constructor(){this.events={};}addEventListener(k,f){this.events[k]=f;}removeEventListener(k){delete this.events[k];}start(){active.add(this);}stop(){active.delete(this);}read(){this.quaternion=[0,0,0,1];this.x=0;this.y=0;this.events.reading?.();}}
 const build=new Function('wx','PoseInput','Controller','drawScene','MenuController','Gyroscope','AbsoluteOrientationSensor','setInterval','clearInterval','Date','Sound',code);
 class TestInput extends PoseInput{constructor(options){super({...options,now:()=>now});}}
 class TestController extends Controller{constructor(options){super({...options,now:()=>now});}}
 const page=build({createCanvasContext:()=>ctx},TestInput,TestController,drawScene,MenuController,Sensor,Sensor,fn=>{timers.set(++serial,fn);return serial;},id=>timers.delete(id),{now:()=>now},undefined);
 page.setData=()=>{}; // Deliberately asynchronous/no echo: business must never read UI data back.
 page.onLoad();return {page,ctx,active,timers,setNow(v){now=v;}};
}
test('actual Ink page uses one input owner, pauses and hides timers/sensors',async()=>{
 const h=pageHarness(),p=h.page;p.onShow();p.onReady();assert.equal(h.active.size,1,'menu owns gyro');assert.equal(h.timers.size,1);
 await p.menu.tap('start');assert.equal(p.game.phase,'calibrating');assert.equal(h.active.size,1,'game owns orientation, menu is stopped');
 p.input.sensor.read();h.setNow(2100);p.input.sensor.read();p.frame();assert.equal(p.game.phase,'flying');
 p.onPause();assert.equal(p.game.phase,'paused');assert.equal(h.active.size,1,'paused menu owns gyro, game is stopped');
 const late=[...h.timers.values()][0];p.onHide();assert.equal(h.active.size,0);assert.equal(h.timers.size,0);late();assert.equal(h.active.size,0);
 p.onShow();assert.equal(p.game.phase,'ready');p.onUnload();assert.equal(h.active.size,0);assert.equal(h.timers.size,0);
});
test('actual Ink page never intercepts the host Backspace exit',()=>{
 const {page}=pageHarness();page.onShow();let prevented=false;page.onKeyUp({code:'Backspace',preventDefault(){prevented=true;}});assert.equal(prevented,false);page.onHide();
});
test('renderer emits finite Canvas commands throughout a complete round and extreme head poses',()=>{
 const c=new Controller();c.show();c.flight.start();const ctx=context();
 for(let i=0;i<450;i++){c.flight.step(.1,{yaw:Math.sin(i)*.38,pitch:Math.cos(i)*.25});drawScene(ctx,c.flight,c.flight.pose,i*.1,{phase:c.flight.phase});}
 assert.equal(c.flight.phase,'result');assert.ok(ctx.calls>10000);
});
test('menu fourth item scrolls into view and third restores first viewport',()=>{
 let patch;const m=new MenuController({Sensor:null,emit:p=>patch=p});m.configure({buttons:[1,2,3,4].map(id=>({id,label:String(id),run(){}}))});m.show();m.move(3);assert.ok(patch.menuScrollLeft>0);m.move(-1);assert.equal(patch.menuScrollLeft,0);m.hide();
});
