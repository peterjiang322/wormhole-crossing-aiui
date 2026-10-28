<script def>
{"navigationBarTitleText":"星门穿梭","navigationStyle":"custom","description":"45秒头动透视穿门展示，提供原地校准、横排点头菜单、按键回退和自动演示。","schema":{"data":{"type":"object","properties":{}}}}
</script>
<script setup>
import wx from 'wx';
import {PoseInput} from '../../lib/pose.js';
import {Controller} from '../../lib/controller.js';
import {drawScene} from '../../lib/renderer.js';
import {MenuController} from '../../lib/menu-controller.js';

export default {
 data:{phase:'ready',mode:'head',message:'小幅转头 · 穿越星门',seconds:45,score:0,hits:0,combo:0,bestCombo:0,title:'',countdown:2,feedback:'',sensor:'',menuButtons:[],buttonWidth:132,buttonRowWidth:416,menuScrollLeft:0,menuHelp:'',soundLabel:'音效开',errorText:'',settings:false},
 onLoad(){
  this._visible=false;this._ready=false;this._generation=0;this._soundOn=true;this._settings=false;this._renderFailures=0;this._canvasAttempts=0;this._menuPhase='';this._sounds={};
  this.input=new PoseInput({Orientation:typeof AbsoluteOrientationSensor==='undefined'?null:AbsoluteOrientationSensor,Gyro:typeof Gyroscope==='undefined'?null:Gyroscope,report:message=>{if(this._visible)this.setData({errorText:message});}});
  this.game=new Controller({input:this.input,emit:patch=>{if(!this._visible)return;this.setData(patch);this.syncMenu(patch.phase);},sound:event=>this.playSound(event)});
  this.menu=new MenuController({Sensor:typeof Gyroscope==='undefined'?null:Gyroscope,emit:patch=>{if(this._visible)this.setData(patch);},report:error=>this.setData({errorText:error.message||String(error)})});
 },
 onShow(){this._visible=true;this._generation++;this._menuPhase='';this._settings=false;this.setData({settings:false,errorText:''});this.game.show();if(this._ready)this.beginRender();},
 onReady(){this._ready=true;if(this._visible)this.beginRender();},
 onHide(){this.cleanup();},onUnload(){this.cleanup();},
 syncMenu(phase){
  const id=this._settings?'settings':phase;if(this._menuPhase===id)return;this._menuPhase=id;
  this.menu.hide();
  if(phase==='flying'||phase==='calibrating'){return;}
  let buttons;
  if(this._settings){buttons=[{id:'yaw',label:this.input.yawSign===1?'反转左右':'恢复左右',run:()=>this.flipAxis('yaw')},{id:'pitch',label:this.input.pitchSign===1?'反转上下':'恢复上下',run:()=>this.flipAxis('pitch')},{id:'sound',label:this._soundOn?'关闭音效':'开启音效',run:()=>this.toggleSound()},{id:'close',label:'返回',run:()=>this.closeSettings()}];}
  else if(phase==='ready'){buttons=[{id:'start',label:'开始飞行',run:()=>this.start('head')},{id:'demo',label:'观赏演示',run:()=>this.start('demo')},{id:'settings',label:'设置',run:()=>this.openSettings()},{id:'keys',label:'按键模式',run:()=>this.start('keys')}];}
  else if(phase==='paused'){buttons=[{id:'resume',label:'继续飞行',run:()=>this.resume()},{id:'keys',label:'改用按键',run:()=>this.game.useKeys()},{id:'home',label:'结束本局',run:()=>this.game.home()}];}
  else if(phase==='result'){buttons=[{id:'again',label:this.game.mode==='demo'?'再看一次':'再来一次',run:()=>this.start(this.game.mode)},{id:'home',label:'回到首页',run:()=>this.game.home()}];}
  else{buttons=[{id:'retry',label:'重试画布',run:()=>this.retryCanvas()},{id:'home',label:'回到首页',run:()=>{this.game.home();this.retryCanvas();}}];}
  this.menu.configure({buttons});this.menu.show();
 },
 start(mode){this._settings=false;this.setData({settings:false,errorText:''});this.menu.hide();this._menuPhase='';this.game.start(mode);},
 resume(){this.menu.hide();this._menuPhase='';this.game.resume();},
 openSettings(){this._settings=true;this.setData({settings:true});this.syncMenu(this.game.phase);},
 closeSettings(){this._settings=false;this.setData({settings:false});this.syncMenu(this.game.phase);},
 flipAxis(axis){if(axis==='yaw')this.input.yawSign*=-1;else this.input.pitchSign*=-1;this._menuPhase='';this.syncMenu(this.game.phase);},
 toggleSound(){this._soundOn=!this._soundOn;this.stopSounds();this.setData({soundLabel:this._soundOn?'音效开':'音效关'});this._menuPhase='';this.syncMenu(this.game.phase);},
 onAction(event){if(this._visible)this.menu.tap(event.currentTarget.dataset.id);},
 onPause(){if(this.game.phase==='flying')this.game.pause();},
 onRecenter(){if(this.game.phase==='flying')this.game.recenter();},
 onKeyUp(event){
  if(!this._visible||event.code==='Backspace')return;
  if(this.game.phase==='flying'){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape',' ','Space'].includes(event.code)){event.preventDefault();this.game.key(event.code);}return;}
  if(this.game.phase==='calibrating'){if(event.code==='Enter'){event.preventDefault();this.game.pause('校准已暂停');}return;}
  this.menu.key(event);
 },
 beginRender(){
  if(this._timer)clearInterval(this._timer);this._ctx=null;this._canvasAttempts=0;this._renderFailures=0;this._lastFrame=Date.now();const token=this._generation;
  this._timer=setInterval(()=>{if(!this._visible||token!==this._generation)return;this.frame();},50);this.frame();
 },
 frame(){
  if(!this._ctx){try{this._ctx=wx.createCanvasContext('flight');}catch(e){this._canvasError=e;}
   if(!this._ctx){if(++this._canvasAttempts>=20)this.canvasFailed(this._canvasError||new Error('画布未就绪'));return;}}
  try{
   this.game.tick();const playing=this.game.phase==='flying'||this.game.phase==='paused';
   const pose=playing?this.game.flight.pose:{yaw:Math.sin(Date.now()/5000)*.035,pitch:0};
   drawScene(this._ctx,this.game.flight,pose,Date.now()/1000,{phase:this.game.phase,menu:!playing});this._renderFailures=0;
  }catch(e){if(++this._renderFailures>=3)this.canvasFailed(e);}
 },
 canvasFailed(error){
  if(this._timer)clearInterval(this._timer);this._timer=null;this._ctx=null;this.input.stop();this.stopSounds();this.game.phase='error';this.game.message='画布不可用，请重试';this._settings=false;this._menuPhase='';this.setData({settings:false,errorText:error.message||String(error)});this.game.publish();
 },
 retryCanvas(){this._menuPhase='';this.game.home();this.setData({errorText:''});this.beginRender();},
 playSound(event){
  if(!this._visible||!this._soundOn||event==='miss')return;
  try{if(typeof Sound==='undefined')return;const name=event==='finish'?'finish':'gate';let sound=this._sounds[name];if(!sound){sound=new Sound('/assets/'+name+'.wav');sound.volume=.35;this._sounds[name]=sound;}sound.play();}catch(e){this.setData({errorText:'音效不可用 · 游戏可继续'});}
 },
 stopSounds(){for(const name of Object.keys(this._sounds)){try{this._sounds[name].stop();this._sounds[name].destroy();}catch(_){}}this._sounds={};},
 cleanup(){this._visible=false;this._generation++;if(this._timer)clearInterval(this._timer);this._timer=null;this._ctx=null;this.menu.hide();this.game.hide();this.stopSounds();}
};
</script>
<page>
 <view class="stage">
  <canvas id="flight" width="448" height="352" class="scene"></canvas>
  <view class="topline"><text>STARGATE / 01</text><text>{{mode === 'demo' ? '自动演示' : '星门穿梭'}}</text></view>
  <view class="hud" style="display: {{phase === 'flying' ? 'flex' : 'none'}}">
   <view class="stat"><text class="tiny">SCORE</text><text class="value">{{score}}</text></view>
   <view class="stat middle"><text class="tiny">TIME LEFT</text><text class="value">{{seconds}}s</text></view>
   <view class="stat right"><text class="tiny">GATES</text><text class="value">{{hits}} / 12</text></view>
  </view>
  <view class="flight-footer" style="display: {{phase === 'flying' ? 'flex' : 'none'}}">
   <text class="feedback">{{feedback}}</text><text class="tiny">{{sensor}}</text>
   <view class="mini-row"><card class="mini" bindtap="onRecenter"><text>重置朝向</text></card><card class="mini" bindtap="onPause"><text>暂停</text></card></view>
  </view>
  <view class="intro" style="display: {{phase === 'ready' && !settings ? 'flex' : 'none'}}">
   <text class="eyebrow">SPATIAL JOY · FLIGHT EXPERIENCE</text><text class="hero">星门穿梭</text><text class="sub">看向光门，向星空出发。</text>
   <view class="chips"><text>45 秒</text><text>12 道星门</text><text>轻轻转头</text></view>
  </view>
  <view class="intro" style="display: {{settings ? 'flex' : 'none'}}"><text class="eyebrow">FLIGHT CONTROLS</text><text class="hero small">飞行设置</text><text class="sub">两轴可反转 · {{soundLabel}}</text><text class="tiny">小幅转头即可，原地体验；按键也能玩。</text></view>
  <view class="intro" style="display: {{phase === 'calibrating' ? 'flex' : 'none'}}"><text class="eyebrow">{{mode === 'demo' ? '观赏模式 · 不计真实成绩' : '准备启航'}}</text><text class="hero">{{countdown}}</text><text class="sub">保持正视前方</text><text class="tiny">{{mode === 'keys' ? '方向键转向 · 空格回正 · 确认键暂停' : '马上出发 · 原地轻轻转头即可'}}</text></view>
  <view class="intro" style="display: {{phase === 'paused' ? 'flex' : 'none'}}"><text class="eyebrow">FLIGHT PAUSED</text><text class="hero small">暂停航行</text><text class="sub">{{message}}</text><text class="tiny">继续时正视前方，重新校准朝向</text></view>
  <view class="intro result" style="display: {{phase === 'result' ? 'flex' : 'none'}}"><text class="eyebrow">{{mode === 'demo' ? '自动演示完成 · 不计成绩' : 'MISSION COMPLETE'}}</text><text class="hero small">{{mode === 'demo' ? '星空等你来' : title}}</text><text class="result-score">{{mode === 'demo' ? '45 秒星际之旅' : score + ' PTS'}}</text><text class="sub">穿越 {{hits}} / 12 · 最佳连击 {{bestCombo}}</text></view>
  <view class="intro" style="display: {{phase === 'error' ? 'flex' : 'none'}}"><text class="hero small">画布暂不可用</text><text class="sub">{{message}}</text></view>
  <view class="menu" style="display: {{phase !== 'flying' && phase !== 'calibrating' ? 'flex' : 'none'}}">
   <scroll-view class="menu-rail" scroll-x="true" scroll-left="{{menuScrollLeft}}"><view class="menu-row" style="width: {{buttonRowWidth}}px"><card ink:for="{{menuButtons}}" ink:key="id" class="menu-card" style="width: {{buttonWidth}}px" data-id="{{item.id}}" bindtap="onAction"><view class="{{item.className}}"><text>{{item.label}}</text></view></card></view></scroll-view>
   <text class="menu-help">{{menuHelp}}</text>
  </view>
  <text class="error-text" style="display: {{errorText ? 'flex' : 'none'}}; top: {{phase === 'flying' ? 86 : 332}}px">{{errorText}}</text>
 </view>
</page>
<style>
page { background-color: #000000; color: #40FF5E; }
.stage { width: 448px; height: 352px; position: relative; overflow: hidden; background-color: #000000; color: #40FF5E; }
.scene { position: absolute; left: 0; top: 0; width: 448px; height: 352px; }
.topline { flex-direction: row; position: absolute; left: 20px; top: 12px; width: 408px; display: flex; justify-content: space-between; font-size: 11px; line-height: 16px; color: rgba(64,255,94,0.6); }
.hud { position: absolute; top: 39px; left: 20px; width: 408px; display: flex; flex-direction: row; justify-content: space-between; }
.stat { display: flex; flex-direction: column; width: 116px; }.middle { align-items: center; }.right { align-items: flex-end; }
.tiny { font-size: 11px; line-height: 18px; color: rgba(64,255,94,0.6); }.value { font-size: 26px; line-height: 32px; font-weight: bold; }
.intro { position: absolute; top: 66px; left: 32px; width: 384px; height: 172px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; }
.eyebrow { font-size: 10px; line-height: 16px; color: rgba(64,255,94,0.6); }.hero { font-size: 48px; line-height: 58px; font-weight: bold; }.small { font-size: 34px; line-height: 42px; }.sub { font-size: 17px; line-height: 24px; text-align: center; }
.chips { display: flex; flex-direction: row; gap: 20px; font-size: 12px; line-height: 24px; color: rgba(64,255,94,0.6); }.result-score { font-size: 25px; line-height: 32px; font-weight: bold; }
.menu { position: absolute; left: 16px; top: 240px; width: 416px; display: flex; flex-direction: column; gap: 8px; }
.menu-rail { width: 416px; height: 64px; flex-shrink: 0; }.menu-row { display: flex; flex-direction: row; gap: 10px; height: 64px; }
.menu-card { --card-padding: 0px; --card-border-width: 0px; border-width: 0px; height: 64px; min-height: 64px; margin: 0; flex-shrink: 0; box-sizing: border-box; }
.menu-action { display: flex; align-items: center; justify-content: center; height: 64px; padding: 6px 4px; border: 1px solid rgba(64,255,94,0.4); border-radius: 4px; color: rgba(64,255,94,0.6); font-size: 18px; line-height: 24px; box-sizing: border-box; background-color: #000000; }.selected { border-color: #40FF5E; color: #40FF5E; background-color: rgba(64,255,94,0.08); }
.menu-help { font-size: 11px; line-height: 18px; text-align: center; color: rgba(64,255,94,0.6); }
.flight-footer { position: absolute; left: 40px; top: 248px; width: 352px; display: flex; flex-direction: column; align-items: center; gap: 2px; }.feedback { font-size: 16px; line-height: 22px; }
.mini-row { display: flex; flex-direction: row; gap: 24px; }.mini { --card-padding: 3px; --card-border-width: 0px; border-width: 0px; color: rgba(64,255,94,0.6); font-size: 11px; line-height: 18px; }
.error-text { position: absolute; left: 24px; top: 332px; width: 400px; height: 18px; font-size: 10px; line-height: 16px; color: #40FF5E; }
</style>
