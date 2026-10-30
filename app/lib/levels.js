// Route generation is local and deterministic. Profiles choose difficulty;
// seeds vary heading/mirroring while preserving every adjacent step length.
const BASE=Array.from({length:12},(_,i)=>({x:i===0?0:Math.sin(i*.92)*2.3,y:i<2?0:Math.sin(i*.73)*1.2}));
const STEPS=BASE.slice(1).map((p,i)=>({x:p.x-BASE[i].x,y:p.y-BASE[i].y}));
const BASE_MAX=Math.max(...STEPS.map(p=>Math.hypot(p.x,p.y)));
export const LEVELS=Object.freeze(Array.from({length:21},(_,id)=>{
 const t=id===0?0:(id-1)/19,band=id===0?0:Math.floor((id-1)/5);
 const radius=id===0?1.7:Number((1.7*(1-.7*t)).toFixed(6));
 const maxStep=id===0?BASE_MAX:Number((2.2+1.6*t).toFixed(6));
 const speed=id===0?9:Number((9*(1+.7*t)).toFixed(6)),speedScale=speed/9;
 const gateCount=Math.floor((39*speedScale-6)/3+1e-9)+1;
 return Object.freeze({id,label:id===0?'体验关':'第'+String(id).padStart(2,'0')+'关',duration:45,gateCount,radius,maxStep,speed,speedScale,seed:(7241+id*7919)>>>0,
  summary:id===0?'原版体验路线 · 每关45秒':'圈径 '+Math.round(radius/1.7*100)+'% · 位移 +'+Math.round((maxStep/BASE_MAX-1)*100)+'% · 速度 '+Math.round(speedScale*100)+'%',
  bandLabel:id===0?'轻松启航':['平稳进阶','舒展航线','斜向探索','精准领航'][band]});
}));
export function getLevel(id=0){if(!Number.isInteger(id)||id<0||id>20)throw new Error('关卡必须为0至20的整数');return LEVELS[id];}
function random(seed){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function gatesFor(points,profile){return points.map((p,id)=>({id,at:(6+id*3)/profile.speedScale,x:p.x,y:p.y,radius:profile.id===0?(id<2?2.2:1.7):profile.radius*(id<2?2.2/1.7:1),done:false,hit:false}));}
export function generateGates({level=0,seed}={}){
 const profile=getLevel(level);if(seed===undefined)seed=profile.seed;
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('种子必须为0至4294967295的整数');
 if(level===0)return gatesFor(BASE,profile);
 const scale=profile.maxStep/BASE_MAX;
 const base=Array.from({length:profile.gateCount},(_,i)=>BASE[i%BASE.length]);
 const steps=base.slice(1).map((p,i)=>({x:p.x-base[i].x,y:p.y-base[i].y}));
 for(let attempt=0;attempt<32;attempt++){
  const rng=random((seed+Math.imul(attempt,2654435761))>>>0),mx=rng()<.5?-1:1,my=rng()<.5?-1:1,points=[{x:0,y:0}];let x=0,y=0;
  for(const step of steps){const angle=(rng()-.5)*.18,c=Math.cos(angle),s=Math.sin(angle);x+=(step.x*c-step.y*s)*scale;y+=(step.x*s+step.y*c)*scale;points.push({x:x*mx,y:y*my});}
  if(points.every(p=>Math.abs(p.x)<=4.15&&Math.abs(p.y)<=2.3))return gatesFor(points,profile);
 }
 // Bounded fallback retains the exact same difficulty and timing.
 return gatesFor(base.map(p=>({x:p.x*scale,y:p.y*scale})),profile);
}
