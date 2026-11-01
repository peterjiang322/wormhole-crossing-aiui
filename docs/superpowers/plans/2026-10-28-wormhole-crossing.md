# 穿越虫洞 Implementation Plan

**Goal:** 构建单关45秒、头动透视的Rokid AIUI线下展示，并交付私有仓库。
**Architecture:** 纯数学引擎与Canvas渲染共用于AIUI和浏览器；页面控制器管理权威状态，设备适配隔离传感器生命周期，公共菜单互斥。
**Tech Stack:** JavaScript ES modules、AIUI Ink/WXML/WXSS、Canvas 2D、AIX CLI 0.10.1。

## Global Constraints
- 448px、单绿色#40FF5E、ink:指令；不引入未确认浏览器API到眼镜运行时。
- 45秒/单关/12门，2秒校准；无外部AI、语音、相机、网络或持久用户成绩。
- 支持姿态、陀螺仪降级、按键、明确标注的自动演示；菜单复用skill资产。

## 执行任务（本会话顺序执行）
- [x] 先写数学/头动/游戏测试并验证缺失实现失败；实现project(point,pose)、Flight.start/step/pause/resume和命中判定，验证旋转、近裁剪、结束、重玩与暂停。
- [x] 先写姿态适配与控制器生命周期测试；实现PoseInput.start/recenter/stop、绝对姿态回退、有效样本/断流处理、generation隔离、键盘和菜单互斥。
- [x] 实现drawScene(ctx,flight,pose,time)及Ink页面：星点/线框隧道/光门/粒子/HUD、起始/暂停/结果横排菜单、两轴反转和本地音效。
- [x] 构建共享引擎的浏览器预览，使用鼠标模拟头部/键盘/真实规则模式与独立自动演示；浏览器截图、运行45秒、重玩/暂停与控制边界验收。
- [x] 生成本地宣传资产与说明，检查文案/PNG/路由一致性；静态检查、测试、真实AIX打包和源码ZIP；报告证据边界。
- [x] 独立git初始化，代码review修复后提交，创建peterjiang322/wormhole-crossing-aiui（现名）私有仓库并正常推送，核验远端可见性和提交SHA。

## 设备联调
指定Rokid型号/固件的Canvas、轴向、传感器频率、菜单完整点头、音效路径、前后台清理、明亮商场可读性均需真实设备验收。无设备时交付操作清单并标注待验收，不把网页模拟当真机。
