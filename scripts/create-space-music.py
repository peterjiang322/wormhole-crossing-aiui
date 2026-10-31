"""Original four-bar chip-space theme. Standard library only, deterministic unsigned 8-bit PCM."""
from pathlib import Path
import math,wave,json,struct
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'app/assets/music';OUT.mkdir(parents=True,exist_ok=True)
RATE=11025
CHORDS=[[52,59,64,66],[48,55,59,64],[45,52,59,60],[47,54,59,64]]
MELODY=[76,0,78,79,83,0,79,78,76,0,71,74,76,0,78,71]
def freq(n):return 440*2**((n-69)/12)
def env(t,d):return min(1,t/.009,max(0,(d-t)/.025))
def voice(n,t,d,kind):
 if not n or t<0 or t>=d:return 0
 ph=2*math.pi*freq(n)*t
 if kind=='pulse':v=(math.sin(ph)+.33*math.sin(3*ph)+.16*math.sin(5*ph))/1.49
 else:v=(math.sin(ph)-math.sin(3*ph)/9+math.sin(5*ph)/25)/1.15
 return v*env(t,d)
def synth(bpm):
 beat=60/bpm;N=round(16*beat*RATE);a=[]
 for i in range(N):
  t=i/RATE;b=t/beat;bar=min(3,int(b/4));local=b%4;ch=CHORDS[bar]
  step=int(b*2);st=t-step*beat/2;arp=ch[[0,2,1,3,2,1,3,2][step%8]]+12
  v=.16*voice(arp,st,beat*.43,'pulse')
  mel=MELODY[int(b)%16];v+=.115*voice(mel,t-int(b)*beat,beat*.78,'pulse')
  bass=ch[0]-12;v+=.21*voice(bass,t-int(b/2)*beat*2,beat*1.8,'triangle')
  # A soft synthesized kick on beats 0 and 2, with a short tick on off-beats.
  kt=t-int(b)*beat
  if int(b)%2==0:v+=.11*math.sin(2*math.pi*(48*kt+24*.025*(1-math.exp(-kt/.025))))*math.exp(-kt*28)
  ht=t-int(b*2)*beat/2
  if step%2:v+=.018*(math.sin(2*math.pi*2850*ht)+math.sin(2*math.pi*3780*ht))*math.exp(-ht*100)
  a.append(v)
 # Circular echo provides ambience that is consistent across repeat boundaries.
 delay=round(.75*beat*RATE);a=[a[i]+.24*a[(i-delay)%N]+.10*a[(i-2*delay)%N] for i in range(N)]
 # Very short seam taper eliminates clicks with minimal perceptual interruption.
 fade=int(.005*RATE);data=bytes(round(128+max(-1,min(1,x))*min(1,i/fade,(N-1-i)/fade)*110) for i,x in enumerate(a))
 return data
manifest=[]
for band,bpm in enumerate([80,92,104,116]):
 data=synth(bpm);name=f'cosmic-{bpm}.wav'
 with wave.open(str(OUT/name),'wb') as w:w.setnchannels(1);w.setsampwidth(1);w.setframerate(RATE);w.writeframes(data)
 manifest.append({'band':band,'bpm':bpm,'file':name,'duration':len(data)/RATE,'bytes':len(data)+44,'levels':'体验关及1–5' if band==0 else f'{band*5+1}–{band*5+5}'})
# Editable MIDI sketch of the lead line (format 0, 480 PPQ, tempo 80 BPM).
def vlq(v):
 a=[v&127];v>>=7
 while v:a.insert(0,(v&127)|128);v>>=7
 return bytes(a)
events=[(0,b'\xff\x51\x03'+(750000).to_bytes(3,'big')),(0,b'\xc0\x50')]
for i,n in enumerate(MELODY):
 if n:events.extend([(i*480,bytes([0x90,n,70])),(i*480+360,bytes([0x80,n,0]))])
events.append((16*480,b'\xff\x2f\x00'));events.sort(key=lambda x:x[0]);track=b'';last=0
for at,msg in events:track+=vlq(at-last)+msg;last=at
(OUT/'cosmic-theme.mid').write_bytes(b'MThd'+struct.pack('>IHHH',6,0,1,480)+b'MTrk'+struct.pack('>I',len(track))+track)
(OUT/'manifest.json').write_text(json.dumps({'title':'虫洞回声 / Wormhole Echoes','composer':'Original procedural composition for Wormhole Roam','format':'11025 Hz, mono, unsigned 8-bit PCM WAV','bars':4,'beats':16,'tracks':manifest},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
