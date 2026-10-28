import {clamp} from './flight.js';
function unit(q){if(!q||q.length!==4||!Array.from(q).every(Number.isFinite))return null;const n=Math.hypot(...q);return n>.0001?Array.from(q,v=>v/n):null;}
export function relativePose(current,origin){
 const q=unit(current),b=unit(origin);if(!q||!b)return null;
 const ax=-b[0],ay=-b[1],az=-b[2],aw=b[3],bx=q[0],by=q[1],bz=q[2],bw=q[3];
 const x=aw*bx+ax*bw+ay*bz-az*by,y=aw*by-ax*bz+ay*bw+az*bx,z=aw*bz+ax*by-ay*bx+az*bw,w=aw*bw-ax*bx-ay*by-az*bz;
 return {yaw:Math.atan2(2*(w*y+x*z),1-2*(x*x+y*y)),pitch:Math.asin(clamp(2*(w*x-y*z),-1,1))};
}
export class PoseInput {
 constructor({Orientation,Gyro,now=()=>Date.now(),report=()=>{}}={}){Object.assign(this,{Orientation,Gyro,now,report});this.sensor=null;this.epoch=0;this.value={yaw:0,pitch:0};this.lastValid=null;this.mode='off';this.yawSign=1;this.pitchSign=1;}
 start(){this.stop();this.startedAt=this.now();this.lastValid=null;this.lastTime=null;this.base=null;this.latest=null;this.value={yaw:0,pitch:0};
  if(this.Orientation&&this.attach(this.Orientation,'orientation'))return;
  if(this.Gyro&&this.attach(this.Gyro,'gyro'))return;
  this.mode='unavailable';this.report('头动不可用 · 可切换按键模式');
 }
 attach(Sensor,mode){
  const epoch=++this.epoch;let sensor;
  try{
   sensor=new Sensor({frequency:30});this.sensor=sensor;this.mode=mode;
   this.reading=()=>{if(this.sensor!==sensor||this.epoch!==epoch)return;this.sample(sensor);};
   this.error=e=>{if(this.sensor!==sensor||this.epoch!==epoch)return;this.stop();this.mode='failed';this.report((e&&e.message)||'姿态传感器失败');};
   sensor.addEventListener('reading',this.reading);sensor.addEventListener('error',this.error);sensor.start();return this.sensor===sensor;
  }catch(e){this.stop();this.report(e.message||String(e));return false;}
 }
 sample(s){
  const now=this.now();let value;
  if(this.mode==='orientation'){
   const q=unit(s.quaternion);if(!q)return;this.latest=q;if(!this.base)this.base=q;value=relativePose(q,this.base);
  }else{
   if(!Number.isFinite(s.x)||!Number.isFinite(s.y))return;
   const dt=this.lastTime===null?0:(now-this.lastTime)/1000;this.lastTime=now;
   if(dt<0||dt>.25)return;
   value={yaw:this.value.yaw-(Math.abs(s.y)>.025?s.y:0)*dt,pitch:this.value.pitch-(Math.abs(s.x)>.025?s.x:0)*dt};
  }
  if(!value)return;this.value={yaw:clamp(value.yaw,-.55,.55),pitch:clamp(value.pitch,-.4,.4)};this.lastValid=now;
 }
 get(){return {yaw:this.value.yaw*this.yawSign,pitch:this.value.pitch*this.pitchSign};}
 recenter(){if(this.latest)this.base=this.latest.slice();this.value={yaw:0,pitch:0};this.lastTime=null;}
 healthy(){return this.lastValid!==null&&this.now()-this.lastValid<1000;}
 timedOut(){return this.lastValid===null?this.now()-this.startedAt>2000:!this.healthy();}
 stop(){this.epoch++;const sensor=this.sensor;this.sensor=null;if(sensor){try{sensor.removeEventListener('reading',this.reading);sensor.removeEventListener('error',this.error);sensor.stop();}catch(_){}}this.reading=null;this.error=null;this.mode='off';}
}
