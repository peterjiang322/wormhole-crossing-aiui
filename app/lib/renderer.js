import {project,WIDTH,HEIGHT,SPEED,clamp} from './flight.js';
const TAU=Math.PI*2;
const stars=Array.from({length:90},(_,i)=>({x:Math.sin(i*127.1)*34,y:Math.cos(i*311.7)*24,z:((i*23.73)%160)+3,size:i%7===0?1.6:.8}));
const octagon=(x,y,z,r,aspect=1,rotation=Math.PI/8)=>Array.from({length:8},(_,i)=>({x:x+Math.cos(i*TAU/8+rotation)*r,y:y+Math.sin(i*TAU/8+rotation)*r*aspect,z}));
export function drawScene(ctx,flight,pose={},time=0,{phase=flight.phase,menu=false}={}){
 const playing=phase==='flying'||phase==='paused'||phase==='result';
 const elapsed=playing?flight.elapsed:time*.45;
 const active=phase==='flying';
 const cam={yaw:pose.yaw||0,pitch:pose.pitch||0,x:playing?flight.ship.x:0,y:playing?flight.ship.y:0};
 ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.fillStyle='#000000';ctx.fillRect(0,0,WIDTH,HEIGHT);
 ctx.save();ctx.beginPath();ctx.rect(0,0,WIDTH,HEIGHT);ctx.clip();
 function path(points,alpha=.5,width=1,close=false){
  ctx.strokeStyle='rgba(64,255,94,'+alpha+')';ctx.lineWidth=width;ctx.beginPath();let pen=false;
  for(const pt of points){const p=project(pt,cam);if(!p){pen=false;continue;}if(!pen){ctx.moveTo(p.x,p.y);pen=true;}else ctx.lineTo(p.x,p.y);}
  if(close&&points.every(p=>project(p,cam)))ctx.closePath();ctx.stroke();
 }
 function line2(x,y,x2,y2,alpha=.6,width=1){ctx.strokeStyle='rgba(64,255,94,'+alpha+')';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
 for(const s of stars){const z=((s.z-elapsed*SPEED*.45)%160+160)%160+2;
  const p=project({x:s.x,y:s.y,z},cam);if(!p||p.x<0||p.x>WIDTH||p.y<0||p.y>HEIGHT)continue;
  ctx.fillStyle='rgba(64,255,94,'+(.18+.55*(1-z/162))+')';ctx.fillRect(p.x,p.y,s.size,s.size);
  if(active&&flight.elapsed>39){const far=project({x:s.x,y:s.y,z:z+6},cam);if(far)line2(p.x,p.y,far.x,far.y,.38);}
 }
 // Fixed world ribs and approaching cross-sections produce perspective and parallax.
 const rings=[];for(let i=0;i<13;i++){
  const z=2+((i*10-elapsed*SPEED)%130+130)%130;
  rings.push({z,points:octagon(0,0,z,7.7,.68)});
 }rings.sort((a,b)=>b.z-a.z);
 for(const ring of rings)path(ring.points,.09+.22*(1-ring.z/132),1,true);
 for(let i=0;i<8;i++){
  const a=i*TAU/8+Math.PI/8,x=Math.cos(a)*7.7,y=Math.sin(a)*5.236;
  path([{x,y,z:1.6},{x,y,z:140}],i%2===0?.36:.19,1);
 }
 if(playing){
  for(const g of flight.gates.filter(g=>!g.done&&g.at-flight.elapsed<15).reverse()){
   const z=(g.at-flight.elapsed)*SPEED;
   if(z<.65)continue;
   const alpha=clamp(1-z/180,.15,1),isNext=g===flight.nextGate();
   const pts=octagon(g.x,g.y,z,g.radius);
   path(pts,alpha*.12,7,true);path(pts,alpha,isNext?2:1,true);
   path(octagon(g.x,g.y,z,g.radius*1.12),alpha*.48,1,true);
   // Segmented outer lock markers, all on the same 3D plane.
   for(let i=0;i<4;i++){const a=i*TAU/4+Math.PI/4;
    path([{x:g.x+Math.cos(a)*g.radius*1.2,y:g.y+Math.sin(a)*g.radius*1.2,z},{x:g.x+Math.cos(a)*g.radius*1.4,y:g.y+Math.sin(a)*g.radius*1.4,z}],alpha*.7,2);
   }
   const p=project({x:g.x,y:g.y,z},cam);
   if(p&&isNext&&z>9){ctx.font='10px monospace';ctx.textAlign='center';ctx.fillStyle='#40FF5E';ctx.fillText('GATE '+String(g.id+1).padStart(2,'0'),p.x,p.y-g.radius*p.scale-13);}
  }
 }else{
  for(let i=3;i>=0;i--){const z=16+i*14;path(octagon(Math.sin(time*.22)*.5,0,z,2.3,1,time*.04+Math.PI/8),.6-i*.1,2,true);}
 }
 // One outward burst per successful crossing, no full-screen flashing.
 if(flight.pulse>0&&active){const spread=(1-flight.pulse)*210;
  for(let i=0;i<22;i++){const a=i*TAU/22;line2(224+Math.cos(a)*(40+spread),176+Math.sin(a)*(24+spread*.7),224+Math.cos(a)*(50+spread),176+Math.sin(a)*(31+spread*.7),flight.pulse*.8,1.5);}
 }
 // Cockpit stays attached to the display while the world changes beneath it.
 ctx.strokeStyle='rgba(64,255,94,0.4)';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(0,HEIGHT);ctx.lineTo(54,HEIGHT-48);ctx.lineTo(136,HEIGHT-34);ctx.moveTo(WIDTH,HEIGHT);ctx.lineTo(WIDTH-54,HEIGHT-48);ctx.lineTo(WIDTH-136,HEIGHT-34);ctx.stroke();
 const cx=224,cy=176;
 line2(cx-16,cy,cx-6,cy,.8);line2(cx+6,cy,cx+16,cy,.8);line2(cx,cy-16,cx,cy-6,.8);line2(cx,cy+6,cx,cy+16,.8);
 ctx.strokeStyle='rgba(64,255,94,0.28)';ctx.beginPath();ctx.arc(cx,cy,24,0,TAU);ctx.stroke();ctx.fillStyle='#40FF5E';ctx.fillRect(cx-1,cy-1,2,2);
 for(let y=96;y<=264;y+=28){line2(12,y,y===180?24:18,y,.42);line2(WIDTH-12,y,WIDTH-(y===180?24:18),y,.42);}
 // Fixed HUD geometry and flight progress.
 for(const [x,y,sx,sy] of [[8,8,1,1],[440,8,-1,1],[8,344,1,-1],[440,344,-1,-1]]){line2(x,y,x+sx*18,y,.75);line2(x,y,x,y+sy*15,.75);}
 if(active){
  line2(76,HEIGHT-14,372,HEIGHT-14,.2,2);line2(76,HEIGHT-14,76+296*flight.elapsed/45,HEIGHT-14,.9,2);
  ctx.font='9px monospace';ctx.textAlign='left';ctx.fillStyle='rgba(64,255,94,0.6)';ctx.fillText(flight.elapsed>39?'HYPERDRIVE':'VECTOR / '+(pose.yaw*180/Math.PI||0).toFixed(0)+'°',20,HEIGHT-28);
  ctx.textAlign='right';ctx.fillText(flight.levelId?'LEVEL '+String(flight.levelId).padStart(2,'0'):'TRIAL',428,HEIGHT-28);
 }
 if(menu){ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(24,54,400,270);}
 ctx.restore();if(typeof ctx.flush==='function')ctx.flush();
}
