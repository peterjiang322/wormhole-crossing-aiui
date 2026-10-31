export const MUSIC_BPMS=[80,92,104,116];
export function musicTrack(level=0){const band=Math.min(3,Math.max(0,Math.floor((level-1)/5)));const bpm=MUSIC_BPMS[band];return {bpm,path:'/assets/music/cosmic-'+bpm+'.wav',duration:Math.round(16*60/bpm*11025)/11025};}
// Sound has no loop flag or end event. Replay at the known PCM duration;
// native scheduling can leave a small gap and must be checked on the target host.
export class MusicLoop {
 constructor({Sound,report=()=>{},schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}={}){Object.assign(this,{Sound,report,schedule,cancel});this.token=0;this.key='';this.failed='';}
 update(phase,level,enabled){const key=phase==='flying'&&enabled?musicTrack(level).path:'';if(!key){this.stop();this.failed='';return;}if(key===this.key||key===this.failed)return;this.stop();if(!this.Sound){this.failed=key;this.report('背景音乐不可用 · 游戏可继续');return;}const token=this.token,track=musicTrack(level);try{this.player=new this.Sound(track.path);this.player.volume=.18;this.key=key;const replay=()=>{if(token!==this.token)return;try{this.player.play();this.timer=this.schedule(replay,track.duration*1000);}catch(_){this.stop();this.failed=key;this.report('背景音乐不可用 · 游戏可继续');}};replay();}catch(_){this.stop();this.failed=key;this.report('背景音乐不可用 · 游戏可继续');}}
 stop(){this.token++;if(this.timer!=null)this.cancel(this.timer);this.timer=null;const p=this.player;this.player=null;this.key='';if(p){try{p.stop();}catch(_){}try{p.destroy();}catch(_){}}}
}
