import {MusicLoop} from '../app/lib/music.js';
import {TerminalText,BRIEFING_LINES} from '../app/lib/briefing.js';
const {createTtsRuntime}=await import('data:text/javascript,'+encodeURIComponent(fs.readFileSync(new URL('../app/lib/tts.js',import.meta.url),'utf8').replace("import wx from 'wx';","const wx={speech:{playTTS:()=>''}};")));
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {PoseInput,yawActionLabel} from '../app/lib/pose.js';import {Controller} from '../app/lib/controller.js';import {drawScene} from '../app/lib/renderer.js';import {LEVELS} from '../app/lib/levels.js';
import {MenuMotion} from '../app/lib/menu-motion.js';
import {MenuController} from '../app/lib/menu-controller.js';
function context(){return new Proxy({calls:0},{get(target,key){if(key in target)return target[key];return (...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'nonfinite draw argument '+key);target.calls++;};},set(target,key,v){target[key]=v;return true;}});}
function pageHarness(){
 const code=fs.readFileSync(new URL('../app/pages/index/index.ink',import.meta.url),'utf8').match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm,'').replace('export default','return');
 let now=0;const active=new Set(),timers=new Map();let serial=0;const ctx=context();
 class Sensor{constructor(){this.events={};}addEventListener(k,f){this.events[k]=f;}removeEventListener(k){delete this.events[k];}start(){active.add(this);}stop(){active.delete(this);}read(){this.quaternion=[0,0,0,1];this.x=0;this.y=0;this.events.reading?.();}}
 const build=new Function('wx','PoseInput','yawActionLabel','Controller','drawScene','MenuController','MenuMotion','LEVELS','Gyroscope','AbsoluteOrientationSensor','setInterval','clearInterval','Date','Sound','TerminalText','BRIEFING_LINES','createTtsRuntime','MusicLoop',code);
 class TestInput extends PoseInput{constructor(options){super({...options,now:()=>now});}}
 class TestController extends Controller{constructor(options){super({...options,now:()=>now});}}
 class TestMotion extends MenuMotion{constructor(options){super({...options,now:()=>now,schedule:fn=>{timers.set(++serial,fn);return serial;},cancel:id=>timers.delete(id)});}}
 class TestTerminal extends TerminalText{constructor(options){super({...options,schedule:fn=>{timers.set(++serial,fn);return serial;},cancel:id=>timers.delete(id)});}}
 const page=build({createCanvasContext:()=>ctx},TestInput,yawActionLabel,TestController,drawScene,MenuController,TestMotion,LEVELS,Sensor,Sensor,fn=>{timers.set(++serial,fn);return serial;},id=>timers.delete(id),{now:()=>now},undefined,TestTerminal,BRIEFING_LINES,createTtsRuntime,MusicLoop);
 page.setData=()=>{}; // Deliberately asynchronous/no echo: business must never read UI data back.
 page.onLoad();return {page,ctx,active,timers,setNow(v){now=v;}};
}
test('actual Ink page uses one input owner, pauses and hides timers/sensors',async()=>{
 const h=pageHarness(),p=h.page;p.onShow();p.onReady();assert.equal(h.active.size,1,'menu owns gyro');assert.equal(h.timers.size,1);
 await p.menu.tap('start');assert.equal(p.game.phase,'briefing');assert.equal(p.game.flight.elapsed,0);await p.menu.tap('launch');assert.equal(p.game.phase,'calibrating');assert.equal(h.active.size,1,'game owns orientation, menu is stopped');
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

test('actual Ink menu animates fourth item and cancels motion on hide',()=>{
 const h=pageHarness(),p=h.page;p.onShow();p.onReady();p.menu.move(3);assert.equal(h.timers.size,2);h.setNow(180);for(const fn of [...h.timers.values()])fn();assert.equal(p.menuMotion.position,p.menu.menuScrollLeft);p.menu.move(-1);assert.equal(h.timers.size,2);const late=[...h.timers.values()].at(-1);p.onHide();assert.equal(h.timers.size,0);late();assert.equal(h.timers.size,0);
});

test('actual Ink free selection exposes all twenty levels and restores selected focus',async()=>{
 const h=pageHarness(),p=h.page;p.onShow();await p.menu.tap('levels');assert.equal(p.game.phase,'levels');assert.equal(p.menu.buttons.length,22);await p.menu.tap('level-20');assert.equal(p.game.levelId,20);assert.equal(p.game.phase,'ready');p.openLevels();assert.equal(p.menu.focus,20);p.menu.move(1);assert.equal(p.menu.focus,21);p.menu.move(1);assert.equal(p.menu.focus,0);p.onHide();assert.equal(h.timers.size,0);
});
test('host taps without dataset confirm the current menu focus without throwing',async()=>{
 const h=pageHarness(),p=h.page;p.onShow();p.menu.move(2);await p.onAction({currentTarget:{}});assert.equal(p.game.phase,'levels');p.menu.move(20);await p.onAction({});assert.equal(p.game.levelId,20);assert.equal(p.game.phase,'ready');p.onHide();
});
test('target dataset taps select the requested button rather than the current focus',async()=>{
 const h=pageHarness(),p=h.page;p.onShow();assert.equal(p.menu.focus,0);await p.onAction({target:{dataset:{id:'levels'}}});assert.equal(p.game.phase,'levels');await p.onAction({target:{dataset:{id:'level-7'}}});assert.equal(p.game.levelId,7);assert.equal(p.game.phase,'ready');p.onHide();
});

test('native settings starts in the corrected yaw direction and toggles reverse/restore consistently',async()=>{
 const h=pageHarness(),p=h.page;p.onShow();p.openSettings();assert.equal(p.input.yawSign,-1);assert.equal(p.menu.buttons[0].label,'反转左右');await p.menu.tap('yaw');assert.equal(p.input.yawSign,1);assert.equal(p.menu.buttons[0].label,'恢复左右');await p.menu.tap('yaw');assert.equal(p.input.yawSign,-1);assert.equal(p.menu.buttons[0].label,'反转左右');p.onHide();
});

test('Ink briefing cancels text callbacks and returns safely on Backspace',async()=>{const h=pageHarness(),p=h.page;p.onShow();await p.menu.tap('start');const callbacks=[...h.timers.values()];assert.equal(p.game.phase,'briefing');let prevented=false;p.onKeyUp({code:'Backspace',preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(p.game.phase,'ready');p.onHide();for(const fn of callbacks)fn();assert.equal(h.timers.size,0);assert.equal(h.active.size,0);});
