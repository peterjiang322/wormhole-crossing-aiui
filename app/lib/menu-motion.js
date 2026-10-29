// MenuController owns numeric focus/scroll targets. This surface adapter moves
// the clipped rail directly so host scroll interpolation cannot lag behind focus.
export class MenuMotion {
 constructor({emit,now=()=>Date.now(),schedule=fn=>setInterval(fn,30),cancel=id=>clearInterval(id)}){
  Object.assign(this,{emit,now,schedule,cancel});this.position=0;this.target=0;this.timer=null;this.epoch=0;
 }
 to(offset){
  const target=Number.isFinite(offset)?Math.max(0,offset):0;
  if(target===this.target&&(this.timer!==null||target===this.position))return;
  this.stop();this.target=target;const from=this.position,start=this.now(),epoch=this.epoch;
  if(from===target)return;
  this.timer=this.schedule(()=>{
   if(epoch!==this.epoch)return;
   const t=Math.max(0,Math.min(1,(this.now()-start)/180));
   this.position=t===1?target:from+(target-from)*(1-Math.pow(1-t,3));
   this.emit({menuTrackLeft:-Math.round(this.position)||0});
   if(t===1)this.stop();
  });
 }
 reset(){this.stop();this.position=0;this.target=0;this.emit({menuTrackLeft:0});}
 stop(){this.epoch++;if(this.timer!==null)this.cancel(this.timer);this.timer=null;}
}
