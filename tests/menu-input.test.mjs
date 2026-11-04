import test from 'node:test';
import assert from 'node:assert/strict';
import {MenuController} from '../app/lib/menu-controller.js';

function fixture() {
 let now=1000,confirmed=0;
 const menu=new MenuController({Sensor:null,now:()=>now,emit(){}});
 menu.configure({buttons:Array.from({length:5},(_,i)=>({id:String(i),label:String(i),run(){confirmed++;}}))});
 menu.show();
 return {menu,setNow(t){now=t;},confirmed:()=>confirmed,key(code,repeat=false){let prevented=false;menu.key({code,repeat,preventDefault(){prevented=true;}});return prevented;}};
}

test('a burst of swipe release events advances once so the second item remains selectable',()=>{
 const h=fixture();assert.equal(h.key('ArrowDown'),true);assert.equal(h.menu.focus,1);
 h.setNow(1035);assert.equal(h.key('ArrowDown'),true);
 h.setNow(1080);h.key('ArrowRight');
 h.setNow(1250);h.key('ArrowDown');
 assert.equal(h.menu.focus,1,'duplicate releases must not skip the second item');
 h.setNow(1750);h.key('ArrowDown');assert.equal(h.menu.focus,2,'the next deliberate swipe moves one more item');
});

test('a long swipe burst remains one move until releases have been quiet for 500ms',()=>{
 const h=fixture();h.key('ArrowRight');
 for(const t of [1310,1620,1930]){h.setNow(t);h.key('ArrowDown');assert.equal(h.menu.focus,1);}
 h.setNow(2430);h.key('ArrowRight');assert.equal(h.menu.focus,2);
 h.setNow(2930);h.key('ArrowLeft');assert.equal(h.menu.focus,1);
});

test('confirm is immediate after a swipe; repeat direction events and host Backspace remain safe',async()=>{
 const h=fixture();h.key('ArrowDown');h.setNow(1040);h.key('ArrowDown',true);assert.equal(h.menu.focus,1);
 h.key('Enter');await Promise.resolve();assert.equal(h.confirmed(),1);
 assert.equal(h.key('Backspace'),false);h.menu.hide();h.setNow(2000);h.key('ArrowRight');assert.equal(h.menu.focus,1);
});

test('hand swipe briefly owns selection without changing the IMU algorithm or its normal pacing',()=>{
 const h=fixture();h.key('ArrowDown');
 h.setNow(1100);h.menu.imu.move(1);assert.equal(h.menu.focus,1,'incidental head movement must not add another step');
 h.setNow(1500);h.menu.imu.move(1);assert.equal(h.menu.focus,2);
 h.setNow(1540);h.menu.imu.move(1);assert.equal(h.menu.focus,3,'normal IMU selection is not given a key debounce');
});

test('separate swipes retain fourth-to-third viewport recovery and wrap-around',()=>{
 const h=fixture();
 for(const t of [1000,1500,2000]){h.setNow(t);h.key('ArrowRight');}
 assert.equal(h.menu.focus,3);assert.ok(h.menu.menuScrollLeft>0);
 h.setNow(2500);h.key('ArrowLeft');assert.equal(h.menu.focus,2);assert.equal(h.menu.menuScrollLeft,0);
 for(const t of [3000,3500,4000]){h.setNow(t);h.key('ArrowLeft');}
 assert.equal(h.menu.focus,4);assert.ok(h.menu.menuScrollLeft>0);
});
