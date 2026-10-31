export const BRIEFING_LINES=['请坐稳驾驶椅，保持上身稳定。','轻轻转头控制航向。','请勿在驾驶车辆或行走时游玩。','不适请暂停。'];
export const BRIEFING_TEXT=BRIEFING_LINES.map(line=>'> '+line).join('\n');
export class TerminalText {
 constructor({emit,schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}){Object.assign(this,{emit,schedule,cancel});this.token=0;}
 start(text=BRIEFING_TEXT){this.stop();const token=this.token;let i=0;this.emit('');const step=()=>{if(token!==this.token)return;this.emit(text.slice(0,++i));if(i<text.length)this.timer=this.schedule(step,65);};step();}
 stop(){this.token++;if(this.timer!=null)this.cancel(this.timer);this.timer=null;}
}
