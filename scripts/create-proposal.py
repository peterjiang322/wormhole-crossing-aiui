from pathlib import Path
import math,json
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/虫洞漫游_作品策划案_Spatial_Joy_2026.pdf'
pdfmetrics.registerFont(TTFont('CN','/System/Library/Fonts/STHeiti Light.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('CNB','/System/Library/Fonts/STHeiti Medium.ttc',subfontIndex=0))
W,H=A4; M=43; CW=W-2*M
INK=HexColor('#15261F'); MUTED=HexColor('#607369'); GREEN=HexColor('#09753B'); NEON=HexColor('#40FF5E'); LINE=HexColor('#DCE7DF'); PALE=HexColor('#EFF6F1'); DARK=HexColor('#06110B')
c=canvas.Canvas(str(OUT),pagesize=A4,pageCompression=1)
c.setTitle('虫洞漫游｜Spatial Joy 2026 全球开发大赛作品策划案')
c.setAuthor('虫洞漫游项目组');c.setSubject('Rokid AI 赛道 AIUI 智能体；基于1.2.1实现状态的参赛作品策划案')
page=0

def text(s,x,y,size=10,color=INK,bold=False):
 c.setFillColor(color);c.setFont('CNB' if bold else 'CN',size);c.drawString(x,H-y-size*.83,s)
def para(s,x,y,w=CW,size=10.2,leading=17,color=INK,bold=False):
 st=ParagraphStyle('p',fontName='CNB' if bold else 'CN',fontSize=size,leading=leading,textColor=color,wordWrap='CJK',spaceAfter=0)
 p=Paragraph(s,st);_,h=p.wrap(w,H);p.drawOn(c,x,H-y-h)
 if y+h>H-48:raise ValueError(f'page {page} overflow: {s[:60]} {y+h}')
 return y+h

def rule(y):
 c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(M,H-y,W-M,H-y)
def box(x,y,w,h,color=PALE,stroke=None,r=9):
 c.setFillColor(color);c.setStrokeColor(stroke or color);c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=int(stroke is not None))
def base(kicker,title,sub):
 global page
 page+=1;c.setFillColor(white);c.rect(0,0,W,H,fill=1,stroke=0)
 text('虫洞漫游',M,26,9,GREEN,True);text('SPATIAL JOY 2026 / ROKID AIUI',W-255,27,8,MUTED)
 rule(48);text(kicker,M,66,9,GREEN,True);text(title,M,88,25,INK,True)
 para(sub,M,126,size=10.2,color=MUTED,leading=16)
 rule(H-39);text('作品策划案 · 2026.10.30 · 基于 1.2.1 实现状态',M,H-28,8,MUTED)
 text(f'{page:02d} / 09',W-M-37,H-28,8,MUTED)

def section(title,s,y):
 text(title,M,y,13,GREEN,True)
 return para(s,M,y+24,size=10.4,leading=18)+20

def callout(label,s,y,h=78):
 box(M,y,CW,h);text(label,M+15,y+13,11,GREEN,True);para(s,M+15,y+35,CW-30,10.1,17)

def end():c.showPage()

def image_region(path,x,y,w,h,region=None):
 im=Image.open(path);iw,ih=im.size
 if region is None:region=(0,0,iw,ih)
 l,t,r,b=region;scale=min(w/(r-l),h/(b-t));dw=(r-l)*scale;dh=(b-t)*scale
 xx=x+(w-dw)/2;yy=y+(h-dh)/2
 c.saveState();clip=c.beginPath();clip.rect(xx,H-yy-dh,dw,dh);c.clipPath(clip,stroke=0,fill=0)
 c.drawImage(str(path),xx-l*scale,H-yy-dh-(ih-b)*scale,width=iw*scale,height=ih*scale,mask='auto');c.restoreState()

# 01 / Cover
page=1;c.setFillColor(DARK);c.rect(0,0,W,H,fill=1,stroke=0)
for i in range(26):
 x=(i*113+41)%int(W);y=(i*193+53)%int(H)
 c.setFillColor(Color(.25,1,.37,alpha=.14+(i%3)*.08));c.circle(x,y,.7+(i%2)*.5,fill=1,stroke=0)
text('SPATIAL JOY 2026',M,43,11,NEON,True)
text('全球开发大赛',M,65,12,HexColor('#BFD3C5'))
text('虫洞漫游',M,117,49,white,True)
text('转动头部，穿越星海。',M+2,184,17,NEON)
text('作品策划案',M,228,19,white)
para('Rokid AI 赛道 AIUI 智能体',M,261,size=12,color=HexColor('#C6D8CB'),leading=19)
# Native vector portal illustration
cx,cy=365,H-456
for j in range(8):
 r=125*(.74**j);dx=-j*5;dy=j*2
 c.setStrokeColor(Color(.25,1,.37,alpha=.23+(7-j)*.07));c.setLineWidth(1.2 if j<3 else .8)
 pts=[(cx+dx+r*math.cos(math.pi/8+k*math.pi/4),cy+dy+r*math.sin(math.pi/8+k*math.pi/4)) for k in range(8)]
 p=c.beginPath();p.moveTo(*pts[0]);[p.lineTo(*pt) for pt in pts[1:]];p.close();c.drawPath(p)
for k in range(8):
 a=math.pi/8+k*math.pi/4;c.setStrokeColor(Color(.25,1,.37,alpha=.19));c.line(cx-35,cy+14,cx+125*math.cos(a),cy+125*math.sin(a))
text('45 秒',M,385,25,NEON,True);text('单局短体验',M,420,10,HexColor('#BFD3C5'))
text('1 + 20 关',M,464,23,NEON,True);text('体验关与进阶挑战',M,499,10,HexColor('#BFD3C5'))
text('头动操控',M,543,23,NEON,True);text('离线运行 · 自由选关',M,578,10,HexColor('#BFD3C5'))
c.setStrokeColor(HexColor('#21442D'));c.line(M,157,W-M,157)
para('面向 Rokid AI 眼镜的短时飞行闯关体验。以头部姿态驱动航向与透视变化，在绿色线框宇宙中连续穿越光门。',M,708,CW,11,19,HexColor('#D2DFD6'))
text('参赛名称：虫洞漫游  /  实现基线：1.2.1  /  2026.10.30',M,794,8.5,HexColor('#86A48E'))
end()

# 02 / Overview
base('01 / PROJECT OVERVIEW','作品概述','一句话定位：戴上眼镜，轻轻转头，用 45 秒完成一次虫洞飞行挑战。')
y=174
y=section('项目摘要','「虫洞漫游」是一款运行于 Rokid AIUI 的头动飞行小游戏。玩家在原地通过小幅左右转头、抬头与低头控制航向，穿过前方不断接近的光门；远近星点、线框隧道与透视变化共同构成具有纵深感的虚拟太空。单局包含约 2 秒朝向校准与 45 秒飞行，结束后显示命中、得分与最佳连击。',y)
y=section('目标用户与使用场景','面向商场路演观众、科技展参观者及第一次接触 AI 眼镜的用户。计划于 2026 年 11 月 27 日至 29 日的商场线下路演展示，也适合开发者演示、零售体验与短时休闲场景。',y)
# 3 objective cards
cards=[('容易上手','把“看向光门”转化为操控动作，让第一次佩戴的观众快速理解。'),('立即有感','头部运动与画面变化形成直接反馈，让纵深、速度与穿越感可感知。'),('适合轮换','固定时长、无需账号、自由选关与自动演示，方便展台连续接待。')]
cw=(CW-22)/3
for i,(a,b) in enumerate(cards):
 x=M+i*(cw+11);box(x,y,cw,132);text(a,x+12,y+13,12,GREEN,True);para(b,x+12,y+40,cw-24,9.7,16)
y+=157
y=section('参赛价值与 AIUI 定位','作品探索 AI 眼镜上的轻量娱乐交互：将设备姿态输入、前台菜单与游戏反馈组成一条完整体验链。当前版本采用本地规则生成路线和规则计分，没有调用大模型、图像识别或语音识别；“AIUI 智能体”指作品的运行与调起形态，智能教练等能力作为后续拓展方向。',y)
callout('本次申报口径','参赛作品、应用界面、调用意图、安装包、预览与宣传素材统一使用「虫洞漫游」；英文名为 Wormhole Roam。当前版本 1.2.1，玩法与难度参数沿用已体验确认的版本。',y,81)
end()

# 03 / Journey
base('02 / EXPERIENCE DESIGN','体验流程与交互设计','从戴上眼镜到完成挑战，围绕一条短而完整的体验链设计。')
y=174
steps=[('01','选择','开始飞行或自由选关'),('02','校准','正视前方约 2 秒'),('03','飞行','45 秒头动穿门挑战'),('04','反馈','看成绩，重玩或下一关')]
for i,(n,a,b) in enumerate(steps):
 x=M+i*(CW/4);box(x,y,CW/4-7,105);text(n,x+12,y+12,10,GREEN,True);text(a,x+12,y+33,14,INK,True);para(b,x+12,y+59,CW/4-30,9.6,15)
y+=132
y=section('菜单：左右选择，点头确认','所有操作按钮横向排列。左右摇头切换焦点，完成一次点头并回正后确认；焦点越过可视区域时，整排菜单平滑横移，返回时恢复前面的按钮。保留点击、方向键与确认键回退，适配传感器缺失或现场辅助操作。',y)
y=section('飞行：小幅转头，朝向光门','校准建立当前正前方。飞行时左右转头改变偏航，抬低头改变俯仰，航向与画面视角同步变化；光门由远及近接近玩家。支持“重置朝向”、暂停与继续；继续后重新校准。菜单与飞行传感器分时运行，避免一次头动同时触发两种操作。',y)
y=section('反馈：看得见的进步','穿门后出现连击、粒子与短音效反馈；漏门中断连击，但仍可继续完成本局。单门基础 100 分，另加当前连击数 × 20 分，连击加成最高 200 分。结束后按命中比例给出“王牌领航员”“星际探索者”或“初航完成”等反馈。',y)
callout('三种体验入口','头动模式用于主要体验；按键模式用于回退与辅助操作；观赏演示自动穿门，明确标注“不计成绩”。从演示切到手动时重新开局，避免混用演示得分。',y,86)
end()

# 04 / Level design
base('03 / GAME & LEVEL DESIGN','难度曲线与关卡设计','保留原体验关，增加 20 个进阶关卡；无需解锁，每关可自由选择。')
y=169
para('进阶关采用连续渐变：光门基准直径从 100% 缩至 30%，最大相邻位置差从 2.2 增至 3.8，飞行速度从 100% 增至 170%。世界门距保持不变，速度提高会使到达间隔缩短。每关仍为 45 秒，前两门保留引导放大。',M,y,size=10.1,leading=17)
rows=[['关卡','光门直径','速度','最大相邻位移','光门数量']]
for i in range(1,21):
 t=(i-1)/19;speed=1+.7*t;count=math.floor((39*speed-6)/3+1e-9)+1
 rows.append([f'{i:02d}',f'{100*(1-.7*t):.1f}%',f'{100*speed:.1f}%',f'{2.2+1.6*t:.3f}',str(count)])
t=Table(rows,colWidths=[54,108,98,139,110],rowHeights=[25]+[18.5]*20)
t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'CN'),('FONTNAME',(0,0),(-1,0),'CNB'),('FONTSIZE',(0,0),(-1,-1),9),('BACKGROUND',(0,0),(-1,0),GREEN),('TEXTCOLOR',(0,0),(-1,0),white),('TEXTCOLOR',(0,1),(-1,-1),INK),('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('ROWBACKGROUNDS',(0,1),(-1,-1),[PALE,white]),('LINEBELOW',(0,-1),(-1,-1),.5,LINE)]))
tw,th=t.wrap(CW,H);t.drawOn(c,M,H-245-th)
y=245+th+17
para('注：位移为游戏世界坐标单位；百分比以新增第 1 关为基准。实际前两门比本关标准光门略大。原体验关独立保留，共 12 门。',M,y,size=8.8,leading=14,color=MUTED)
y+=43
callout('关卡生成：已有基础，后续可开放','代码已实现带种子的确定性路线生成，按等级控制段长、边界与速度，并设置有界重试及回退。当前提供已配置关卡；自定义参数界面、无限模式与 AI 生成路线尚未开放。',y,85)
end()

# 05 / Technology
base('04 / SPATIAL & TECHNICAL DESIGN','空间感呈现与技术方案','用适配眼镜显示条件的轻量图形，构成持续、清晰的飞行反馈。')
y=176
# architecture stacked / one input row, engine, native rendering
arch=[('设备与回退输入','相对姿态四元数 / 陀螺仪回退 / 按键'),('权威控制与游戏引擎','校准与生命周期 → 关卡生成 → 飞行与命中 → 计分'),('AIUI 页面与 Canvas 绘制','三维点透视投影 / 线框隧道 / 光门 / HUD / 粒子与音效')]
for i,(a,b) in enumerate(arch):
 yy=y+i*77;box(M,yy,CW,62);text(a,M+15,yy+10,11,GREEN,True);text(b,M+15,yy+33,9.5,INK)
 if i<2:
  c.setStrokeColor(GREEN);c.setLineWidth(1);c.line(W/2,H-yy-64,W/2,H-yy-74)
y+=252
y=section('透视与视差线索','场景以三维坐标描述，经相对偏航与俯仰旋转后投影到二维 Canvas。近处光门更大、远处光门更小，星点与隧道随航向改变，飞行推进持续改变物体深度；这些线索共同建立空间纵深和速度感。',y)
y=section('原生 AIUI 与可维护结构','原生页面采用 .ink，逻辑拆分为姿态输入、菜单控制、关卡、飞行、绘图与生命周期模块。显示逻辑按 448 × 352 单绿色界面适配，主色 #40FF5E；浏览器伴随预览复用游戏引擎与绘图代码，输入与音频适配单独处理。',y)
callout('能力边界','当前是单画面的三维透视表现。未实现双目立体、六自由度位置追踪、真实环境空间锚定或身体位移识别；玩家无需真实向前行走。',y,80)
end()

# 06 / Real screenshots
base('05 / CURRENT BUILD','实际运行画面','以下为更名后 1.2.1 版本的真实运行截图，分别来自共享引擎预览与官方 Reader。')
text('A  飞行画面：浏览器伴随预览，共享游戏引擎',M,170,11,GREEN,True)
image_region(ROOT/'verification/rename-preview-flight.png',M,196,CW,285,region=(598,163,1381,782))
para('绿色线框隧道、光门、剩余时间、命中数量与连击反馈。此图采用自动演示输入，不作为真实玩家成绩或眼镜实机截图。',M,488,size=9.1,leading=15,color=MUTED)
text('B  第 20 关：官方 AIUI Reader 0.19.1',M,538,11,GREEN,True)
image_region(ROOT/'verification/rename-reader-level20.png',M,561,235,185,region=(171,202,651,554))
para('实际显示：<br/>圈径 30%<br/>速度 170%<br/>横向自由选关菜单<br/><br/>Reader 中没有有效 IMU 时，页面明确提示按键 / 点击回退。',M+259,568,CW-259,10,17)
para('截图对应来源：verification/rename-preview-flight.png；verification/rename-reader-level20.png。仅截取运行界面区域排版，未重绘界面或改写截图内容。',M,758,size=8,leading=12,color=MUTED)
end()

# 07 / Implementation
base('06 / IMPLEMENTATION STATUS','实现进度与验证证据','已有可运行原型与真实构建产物，后续重点是参赛包装与现场设备验收。')
y=172
rows=[['模块','当前状态'],['核心玩法','45 秒飞行、穿门、漏门、连击、结算与重玩已实现'],['交互与菜单','头动输入、点头确认、横滚、按键回退与朝向反转已实现'],['关卡系统','原体验关 + 20 关，自由选关、主动下一关已实现'],['运行管理','暂停继续、重新校准、隐藏后清理与传感器异常处理已实现'],['交付产物','AIUI 源码、真实 AIX 安装包、源码 ZIP、伴随预览与 Reader'],['规划能力','自定义关卡界面、无限模式、智能教练尚未实现']]
styles=ParagraphStyle('cell',fontName='CN',fontSize=9.5,leading=15,wordWrap='CJK',textColor=INK)
rr=[[Paragraph(escape(v),styles) for v in row] for row in rows]
t=Table(rr,colWidths=[99,CW-99],rowHeights=[28]+[41]*6)
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PALE),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),10),('LINEBELOW',(0,0),(-1,-1),.5,LINE)]));_,th=t.wrap(CW,H);t.drawOn(c,M,H-y-th)
y+=th+23
text('验证记录',M,y,13,GREEN,True);y+=24
for a,b in [('工程验证','现有记录：39 项自动化测试、55 项静态检查通过，并完成真实 AIX 打包。覆盖计时、方向切换、生命周期、菜单回滚，以及 420 组种子的实际引擎自动穿门。'),('界面验证','浏览器与官方 Reader 已运行验证；第 20 关完整自动演示记录为 45 秒、21/21 门，明确标注不计玩家成绩。'),('用户体验反馈','用户已实际体验，确认底部菜单正常，并在最新一轮反馈中表示“基本上都没什么问题”。反馈属于定性体验，未形成标准化设备性能报告。')]:
 text(a,M,y,10.3,INK,True);y=para(b,M+81,y,CW-81,9.7,16)+15
callout('尚待现场量化','本开发环境未连接实体 Rokid，尚无目标设备上的帧率、头动延迟、续航、强光可辨识性与连续佩戴舒适度数据。自动化测试、Reader 与用户定性反馈分别记录，不相互替代。',y,84)
end()

# 08 / Onsite
base('07 / SCENARIO & OPERATIONS','线下路演落地方案','预定展示场景：2026 年 11 月 27 日至 29 日，商场 AI 设备与前沿科技体验展台。')
y=174
y=section('接待流程','工作人员协助佩戴与调整显示 → 用一句话说明“看向下一道光门” → 新手进入体验关并校准 → 完成 45 秒飞行 → 展示结果并邀请重玩或选关 → 退出与清洁设备。无人体验时使用明确标注的观赏演示，用于吸引观众。',y)
y=section('展台配置与轮换','核心配置为可运行 AIUI 的 Rokid 眼镜、供电 / 充电条件与工作人员；电脑伴随预览可作为讲解及异常回退展示。单人接待按约 2 至 3 分钟估算，理论可接待约 20 至 30 人 / 小时 / 台，已包含佩戴、说明、清洁及换人时间，实际吞吐量需现场测定。',y)
# targets card
box(M,y,CW,132);text('上线前验收目标（尚非实测结果）',M+15,y+13,12,GREEN,True)
para('流畅性：目标帧率不低于 20 fps，头动到画面响应目标在 200 ms 内。<br/>连续性：建议完成至少 30 轮交替体验与暂停 / 退出检查。<br/>可用性：检查商场光照、音效可听性、最小光门辨识与左右方向。<br/>上手：邀请新手试用，记录首次完成率、校准次数和主观舒适度。',M+15,y+40,CW-30,10,19)
y+=156
y=section('体验安全与异常处理','在固定体验点站定或坐定，轻微转头即可，不引导真实走动或大幅甩头。出现不适时立即暂停并结束；头动输入异常或断流时显式暂停，允许重试或切换按键。页面隐藏后清理传感器、定时器与音频，避免换人后残留上一局状态。',y)
callout('离线与隐私','游戏本体不申请相机、麦克风或网络权限，无账号登录与数据上传；分数、选关与设置保存在当前会话内存。官方网页 Reader 首次加载运行时需要联网，与眼镜游戏本体的离线运行分开。',y,86)
end()

# 09 / Roadmap
base('08 / ROADMAP & SUBMISSION','后续迭代与参赛交付','保留已经成立的短体验链，逐步拓展内容与可重复游玩的空间。')
y=174
road=[('近期：参赛与路演定版','应用、安装包和展示物料已统一使用「虫洞漫游」；接下来针对目标 Rokid 设备做方向、流畅度、光照与舒适度验收，完成现场工作人员说明卡与部署检查。'),('下一步：开放规则生成','基于现有关卡生成器，增加自定义难度入口，允许调整光门大小、位置差、速度与种子；增加可复现的随机挑战。所有参数仍受边界与可达性约束。'),('探索：智能体验辅助','评估引入局后智能教练，以命中、漏门和操作统计生成简短建议；若接入模型，应明确新增依赖、权限与等待反馈。语音启动、无限模式、排行榜等按验证结果另行规划。')]
for a,b in road:y=section(a,b,y)
callout('作品的核心亮点','头动直接参与游戏；45 秒形成完整体验；单绿色线框呈现空间纵深；从体验关到 20 关逐步提高挑战；离线运行、按键回退与生命周期管理适合真实展台轮换。',y,85);y+=109
text('本次交付与工程依据',M,y,13,GREEN,True);y+=25
y=para('本文件：参赛作品策划案 PDF。<br/>现有工程：原生 AIUI 页面及模块、AIX 安装包、源码 ZIP、浏览器伴随预览、官方 Reader。<br/>事实核对：README、关卡参数表、验证报告、测试与静态检查记录。<br/>截图依据：工程中保留的真实运行截图；未将概念图作为实现证据。',M,y,size=10,leading=19)+22
para('本策划案使用报名者提供的赛事名称与赛道表述编制，未引用未提供的评分细则。功能与验证状态截至 2026 年 10 月 30 日；规划项不作为已交付能力。',M,y,size=9,leading=15,color=MUTED)
end();c.save()
print(OUT)
print('pages:',page,'bytes:',OUT.stat().st_size)
