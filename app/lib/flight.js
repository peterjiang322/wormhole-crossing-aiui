import {getLevel,generateGates} from './levels.js';
export const WIDTH=448, HEIGHT=352, DURATION=45, SPEED=9;
export const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function project(point, camera={}) {
 const yaw=camera.yaw||0,pitch=camera.pitch||0;
 const x=point.x-(camera.x||0), y=point.y-(camera.y||0), z=point.z;
 const rx=Math.cos(yaw)*x-Math.sin(yaw)*z;
 const rz=Math.sin(yaw)*x+Math.cos(yaw)*z;
 const ry=Math.cos(pitch)*y-Math.sin(pitch)*rz;
 const depth=Math.sin(pitch)*y+Math.cos(pitch)*rz;
 if(!Number.isFinite(depth)||depth<.6)return null;
 return {x:WIDTH/2+260*rx/depth,y:HEIGHT/2-260*ry/depth,scale:260/depth,z:depth};
}
export class Flight {
 constructor(levelId=0){this.levelId=getLevel(levelId).id;this.phase='ready';this.elapsed=0;this.ship={x:0,y:0};this.pose={yaw:0,pitch:0};this.gates=[];this.score=0;this.hits=0;this.resolved=0;this.combo=0;this.bestCombo=0;this.pulse=0;this.message='';this.events=[];}
 start(levelId=this.levelId){
  this.levelId=getLevel(levelId).id;
  Object.assign(this,{phase:'flying',elapsed:0,ship:{x:0,y:0},pose:{yaw:0,pitch:0},score:0,hits:0,resolved:0,combo:0,bestCombo:0,pulse:0,message:'看向光门 · 轻轻转头',events:[]});
  this.gates=generateGates({level:this.levelId});
 }
 nextGate(){return this.gates.find(g=>!g.done)||null;}
 step(dt,input={},auto=false){
  this.events=[];if(this.phase!=='flying'||!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,DURATION-this.elapsed);const previous=this.elapsed;this.elapsed=Math.min(DURATION,this.elapsed+dt);
  if(this.elapsed>DURATION-1e-8)this.elapsed=DURATION;
  const next=this.nextGate();
  const yaw=auto&&next?clamp((next.x-this.ship.x)*.5,-.22,.22):clamp(Number.isFinite(input.yaw)?input.yaw:0,-.38,.38);
  const pitch=auto&&next?clamp((next.y-this.ship.y)*.5,-.18,.18):clamp(Number.isFinite(input.pitch)?input.pitch:0,-.25,.25);
  this.pose={yaw,pitch};
  const old={...this.ship};this.ship.x=clamp(this.ship.x+Math.tan(yaw)*SPEED*dt,-4.3,4.3);this.ship.y=clamp(this.ship.y+Math.tan(pitch)*SPEED*dt,-2.6,2.6);
  this.pulse=Math.max(0,this.pulse-dt*1.8);
  for(const g of this.gates){
   if(g.done||g.at>this.elapsed)continue;
   const t=clamp((g.at-previous)/Math.max(dt,.0001),0,1),x=old.x+(this.ship.x-old.x)*t,y=old.y+(this.ship.y-old.y)*t;
   g.done=true;g.hit=Math.hypot(x-g.x,y-g.y)<g.radius;this.resolved++;
   if(g.hit){this.hits++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.score+=100+Math.min(this.combo,10)*20;this.pulse=1;this.message=this.combo>1?'连击 × '+this.combo:'完美穿越';this.events.push('hit');}
   else{this.combo=0;this.message='擦肩而过 · 看向下一道门';this.events.push('miss');}
  }
  if(this.elapsed>=DURATION){this.phase='result';this.events.push('finish');}
 }
 pause(){if(this.phase==='flying')this.phase='paused';}
 resume(){if(this.phase==='paused')this.phase='flying';}
 get title(){return this.hits>=10?'王牌领航员':this.hits>=6?'星际探索者':'初航完成';}
}
