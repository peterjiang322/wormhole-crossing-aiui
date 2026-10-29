import {Controller} from '../app/lib/controller.js';
import {drawScene} from '../app/lib/renderer.js';
import {MenuController} from '../app/lib/menu-controller.js';
import {MenuMotion} from '../app/lib/menu-motion.js';
import {LEVELS,getLevel} from '../app/lib/levels.js';
const $=id=>document.getElementById(id),stage=$('stage'),ctx=$('scene').getContext('2d');
let mouse={yaw:0,pitch:0},center={yaw:0,pitch:0},settings=false,soundOn=true,yawSign=1,pitchSign=1,lastMenu='',previousPhase='',frames=0,fpsAt=performance.now(),raf=null,audio;
const pointer={mode:'orientation',start(){center={...mouse};},stop(){},healthy:()=>true,timedOut:()=>false,recenter(){center={...mouse};},get:()=>({yaw:(mouse.yaw-center.yaw)*yawSign,pitch:(mouse.pitch-center.pitch)*pitchSign})};
function sound(event){if(!soundOn||event==='miss')return;try{audio=audio||new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(event==='hit'?660:880,audio.currentTime);o.frequency.exponentialRampToValueAtTime(event==='hit'?990:1320,audio.currentTime+.13);g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.21);}catch(_){}}
const motion=new MenuMotion({emit:patch=>{$('buttons').style.left=patch.menuTrackLeft+'px';}});
const menu=new MenuController({Sensor:null,emit(patch){
 const root=$('buttons');root.replaceChildren();root.style.width=patch.buttonRowWidth+'px';
 for(const item of patch.menuButtons){const b=document.createElement('button');b.textContent=item.label;b.style.width=patch.buttonWidth+'px';b.className=item.className;b.dataset.id=item.id;b.onclick=()=>menu.tap(item.id);root.append(b);}
 motion.to(patch.menuScrollLeft);if(game.phase==='levels')renderLevelPreview();
}});
const game=new Controller({input:pointer,now:()=>performance.now(),emit:renderUI,sound});
function begin(mode){settings=false;menu.hide();lastMenu='';mouse={yaw:0,pitch:0};center={...mouse};game.start(mode);}
function syncMenu(){
 const key=settings?'settings':game.phase;if(lastMenu===key)return;lastMenu=key;menu.hide();motion.reset();
 if(['flying','calibrating'].includes(game.phase))return;
 let buttons;
 if(settings)buttons=[{id:'yaw',label:yawSign===1?'反转左右':'恢复左右',run(){yawSign*=-1;lastMenu='';syncMenu();}},{id:'pitch',label:pitchSign===1?'反转上下':'恢复上下',run(){pitchSign*=-1;lastMenu='';syncMenu();}},{id:'sound',label:soundOn?'关闭音效':'开启音效',run(){soundOn=!soundOn;lastMenu='';syncMenu();}},{id:'close',label:'返回',run(){settings=false;lastMenu='';renderUI();}}];
 else if(game.phase==='levels')buttons=LEVELS.map(level=>({id:'level-'+level.id,label:level.label,run:()=>game.selectLevel(level.id)})).concat([{id:'home',label:'返回首页',run:()=>game.home()}]);
 else if(game.phase==='ready')buttons=[{id:'start',label:'开始飞行',run:()=>begin('head')},{id:'demo',label:'观赏演示',run:()=>begin('demo')},{id:'levels',label:'自由选关',run:()=>game.openLevels()},{id:'settings',label:'设置',run(){settings=true;renderUI();}},{id:'keys',label:'按键模式',run:()=>begin('keys')}];
 else if(game.phase==='paused')buttons=[{id:'resume',label:'继续飞行',run:()=>game.resume()},{id:'keys',label:'改用按键',run:()=>game.useKeys()},{id:'home',label:'结束本局',run:()=>game.home()}];
 else buttons=(game.levelId<20?[{id:'next',label:game.mode==='demo'?'下一关演示':'下一关',run:()=>game.nextLevel()}]:[]).concat([{id:'again',label:game.mode==='demo'?'再看一次':'再来一次',run:()=>begin(game.mode)},{id:'levels',label:'自由选关',run:()=>game.openLevels()},{id:'home',label:'回到首页',run:()=>game.home()}]);
 menu.configure({buttons});if(game.phase==='levels')menu.focus=game.levelId;menu.show();
}
function renderLevelPreview(){const p=LEVELS[menu.focus];$('eyebrow').textContent='自由选关 · 体验关 + 20关';$('title').className='small';$('title').textContent=p?p.label:'返回首页';$('subtitle').textContent=p?p.summary:'保留当前关卡选择';$('chips').textContent='左右选择 · 点击确认 · 无需解锁';}
function renderUI(){
 if(!game)return;syncMenu();const f=game.flight,phase=game.phase,active=phase==='flying';
 $('hud').hidden=!active;$('flight-footer').hidden=!active;$('intro').hidden=active;$('menu').hidden=active||phase==='calibrating';
 $('score').textContent=f.score;$('time').textContent=Math.ceil(45-f.elapsed)+'s';$('gates').textContent=f.hits+' / 12';$('feedback').textContent=f.message;
 $('sensor').textContent=game.mode==='demo'?'自动演示 · 不计成绩':game.mode==='keys'?'方向键转向 · 空格回正':'鼠标模拟头动 · 空格回正';
 $('level-label').textContent='STARGATE / '+getLevel(game.levelId).label;$('mode-label').textContent=game.mode==='demo'?'自动演示':'星门穿梭';$('status').textContent=active?'FLIGHT IN PROGRESS':phase==='result'?'MISSION COMPLETE':'READY TO EXPLORE';
 $('help').textContent='左右方向键选择 · 点击 / Enter 确认';$('input-label').textContent=game.mode==='demo'?'INPUT / AUTOPILOT DEMO':game.mode==='keys'?'INPUT / KEYBOARD':'INPUT / POINTER → HEAD POSE';
 const title=$('title'),subtitle=$('subtitle'),chips=$('chips'),eyebrow=$('eyebrow');title.className='';chips.className='';
 if(settings){eyebrow.textContent='FLIGHT CONTROLS';title.textContent='飞行设置';title.className='small';subtitle.textContent='两轴可反转 · 音效'+(soundOn?'开':'关');chips.textContent='小幅转头即可，原地体验；按键也能玩。';}
 else if(phase==='ready'){eyebrow.textContent='SPATIAL JOY · FLIGHT EXPERIENCE';title.textContent='星门穿梭';subtitle.textContent=getLevel(game.levelId).label+' · 每关45秒';chips.textContent=getLevel(game.levelId).summary;}
 else if(phase==='levels'){renderLevelPreview();}
 else if(phase==='calibrating'){eyebrow.textContent=getLevel(game.levelId).label+' · '+(game.mode==='demo'?'演示不计成绩':'准备启航');title.textContent=Math.max(1,Math.ceil((2000-(performance.now()-game.began))/1000));subtitle.textContent='保持正视前方';chips.textContent=game.mode==='keys'?'方向键转向 · 空格回正 · Enter 暂停':'马上出发 · 移动鼠标模拟轻轻转头';}
 else if(phase==='paused'){eyebrow.textContent='FLIGHT PAUSED';title.className='small';title.textContent='暂停航行';subtitle.textContent=game.message;chips.textContent='继续时正视前方，重新校准朝向';}
 else if(phase==='result'){eyebrow.textContent=getLevel(game.levelId).label+' · '+(game.mode==='demo'?'演示不计成绩':'航行完成');title.className='small';title.textContent=game.mode==='demo'?'星空等你来':f.title;subtitle.textContent='穿越 '+f.hits+' / 12 · 最佳连击 '+f.bestCombo;chips.textContent=game.mode==='demo'?'45 秒星际之旅':f.score+' PTS';chips.className='result-score';}
 previousPhase=phase;
}
stage.addEventListener('pointermove',e=>{const b=stage.getBoundingClientRect();mouse={yaw:(e.clientX-b.left-b.width/2)/b.width*.6,pitch:-(e.clientY-b.top-b.height/2)/b.height*.4};});
$('pause').onclick=()=>game.pause();$('recenter').onclick=()=>{game.recenter();};
document.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape',' '].includes(e.key))return;e.preventDefault();if(game.phase==='flying'){if(e.key.startsWith('Arrow')&&game.mode==='head'){game.mode='keys';game.keyPose={...game.filtered};}game.key(e.key);}else if(game.phase==='calibrating'){if(e.key==='Enter')game.pause('校准已暂停');}else menu.key({code:e.key,preventDefault(){}});});
function resize(){const shell=document.querySelector('.display-shell'),width=shell.clientWidth-28,scale=width/448;stage.style.transform='scale('+scale+')';shell.style.height=(352*scale+28)+'px';}new ResizeObserver(resize).observe(document.querySelector('.display-shell'));resize();
function frame(time){game.tick();const active=['flying','paused','result'].includes(game.phase);drawScene(ctx,game.flight,active?game.flight.pose:{yaw:Math.sin(time/5000)*.035,pitch:0},time/1000,{phase:game.phase,menu:!['flying','paused'].includes(game.phase)});frames++;if(time-fpsAt>1000){$('fps').textContent=Math.round(frames*1000/(time-fpsAt))+' FPS';fpsAt=time;frames=0;}raf=requestAnimationFrame(frame);}
function show(){lastMenu='';game.show();raf=requestAnimationFrame(frame);}document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);game.hide();menu.hide();motion.stop();audio?.suspend();}else{audio?.resume();show();}});window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);game.hide();menu.hide();motion.stop();audio?.close();});
// Read-only diagnostics for local acceptance; no simulated results or time acceleration.
window.stargate={get state(){return {levelId:game.levelId,levelLabel:getLevel(game.levelId).label,phase:game.phase,mode:game.mode,elapsed:game.flight.elapsed,hits:game.flight.hits,score:game.flight.score,menuScroll:Math.round(motion.position),focus:menu.focus};}};
show();
