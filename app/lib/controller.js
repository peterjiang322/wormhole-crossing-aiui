import {getLevel,LEVELS} from './levels.js';
import {Flight,clamp,DURATION} from './flight.js';
export class Controller {
 constructor({input=null,now=()=>Date.now(),emit=()=>{},sound=()=>{}}={}){Object.assign(this,{input,now,emit,sound});this.levelId=0;this.flight=new Flight(this.levelId);this.phase='ready';this.mode='head';this.visible=false;this.message='';this.keyPose={yaw:0,pitch:0};this.filtered={yaw:0,pitch:0};this.lastHud=0;this.last=0;}
 show(){this.visible=true;this.home();}
 home(){this.input?.stop();this.phase='ready';this.flight=new Flight(this.levelId);this.message='小幅转头 · 穿越星门';this.publish();}
 start(mode='head'){
  if(!this.visible)return;this.resumePending=false;this.input?.stop();this.mode=mode;this.phase='calibrating';this.began=this.now();this.last=this.began;this.keyPose={yaw:0,pitch:0};this.filtered={yaw:0,pitch:0};this.message='保持正视前方';this.flight=new Flight(this.levelId);
  if(mode==='head'){if(!this.input){this.phase='paused';this.message='头动不可用 · 请选择按键模式';}else this.input.start();}this.publish();
 }
 openLevels(){if(!this.visible||!['ready','result'].includes(this.phase))return false;this.input?.stop();this.phase='levels';this.publish();return true;}
 selectLevel(id){getLevel(id);if(!this.visible||!['ready','levels','result'].includes(this.phase))return false;this.levelId=id;this.home();return true;}
 nextLevel(){if(!this.visible||this.phase!=='result'||this.levelId>=LEVELS.length-1)return false;this.levelId++;this.start(this.mode);return true;}
 tick(){
  if(!this.visible)return;const now=this.now(),dt=clamp((now-this.last)/1000,0,45);this.last=now;
  if(this.phase==='calibrating'){
   if(this.mode==='head'&&this.input.timedOut()){this.pause('未收到有效头动 · 可重试或用按键');return;}
   if(now-this.began>=2000&&(this.mode!=='head'||this.input.healthy())){this.input?.recenter();if(this.resumePending){this.flight.resume();this.resumePending=false;}else this.flight.start(this.levelId);this.phase='flying';this.publish();}
  }else if(this.phase==='flying'){
   if(this.mode==='head'&&this.input.timedOut()){this.pause('头动读数中断 · 可重试或用按键');return;}
   const raw=this.mode==='head'?this.input.get():this.keyPose;
   let remaining=dt;const events=new Set();
   while(remaining>1e-8&&this.flight.phase==='flying'){const step=Math.min(.05,remaining);remaining-=step;const ease=1-Math.exp(-step*12);this.filtered.yaw+=(raw.yaw-this.filtered.yaw)*ease;this.filtered.pitch+=(raw.pitch-this.filtered.pitch)*ease;this.flight.step(step,this.filtered,this.mode==='demo');for(const event of this.flight.events)events.add(event);}
   for(const event of events)this.sound(event);
   if(this.flight.phase==='result'){this.phase='result';this.input?.stop();this.publish();}
  }
  if(now-this.lastHud>=200){this.lastHud=now;this.publish();}
 }
 pause(reason='飞行已暂停'){if(this.phase!=='flying'&&this.phase!=='calibrating')return;this.flight.pause();this.phase='paused';this.message=reason;this.input?.stop();this.publish();}
 resume(){
  if(this.phase!=='paused')return;
  if(this.flight.phase!=='paused'){this.start(this.mode);return;}
  // Reacquire sensor and neutral pose before resuming the same flight.
  this.resumeFlight=this.flight;this.start(this.mode);this.flight=this.resumeFlight;this.resumePending=true;this.resumeFlight=null;
 }
 useKeys(){if(this.mode==='demo'){this.start('keys');return;}if(this.phase==='paused'&&this.flight.phase==='paused'){this.input?.stop();this.mode='keys';this.keyPose={yaw:0,pitch:0};this.filtered={yaw:0,pitch:0};this.flight.resume();this.phase='flying';this.last=this.now();this.publish();}else this.start('keys');}
 key(code){
  if(this.phase!=='flying')return;
  const delta=.045;
  if(code==='ArrowLeft')this.keyPose.yaw=clamp(this.keyPose.yaw-delta,-.32,.32);
  if(code==='ArrowRight')this.keyPose.yaw=clamp(this.keyPose.yaw+delta,-.32,.32);
  if(code==='ArrowUp')this.keyPose.pitch=clamp(this.keyPose.pitch+delta,-.22,.22);
  if(code==='ArrowDown')this.keyPose.pitch=clamp(this.keyPose.pitch-delta,-.22,.22);
  if(code==='Enter'||code==='Escape')this.pause();
  if(code===' '||code==='Space')this.recenter();
 }
 recenter(){this.input?.recenter();this.keyPose={yaw:0,pitch:0};this.filtered={yaw:0,pitch:0};}
 hide(){this.visible=false;this.input?.stop();this.resumePending=false;}
 publish(){this.emit({levelId:this.levelId,levelLabel:getLevel(this.levelId).label,levelSummary:getLevel(this.levelId).summary,hasNextLevel:this.levelId<20,phase:this.phase,mode:this.mode,message:this.message,seconds:Math.ceil(DURATION-this.flight.elapsed),score:this.flight.score,hits:this.flight.hits,combo:this.flight.combo,bestCombo:this.flight.bestCombo,title:this.flight.title,countdown:Math.max(1,Math.ceil((2000-(this.now()-this.began))/1000)),feedback:this.flight.message,sensor:this.mode==='demo'?'自动演示 · 不计成绩':this.mode==='keys'?'按键控制':this.input?.mode==='gyro'?'陀螺仪模式 · 可重置朝向':'头部姿态控制'});}
}
