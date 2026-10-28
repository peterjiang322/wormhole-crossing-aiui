# 星门穿梭 / Stargate Flight

Rokid AIUI 展台小游戏。使用 aiui-dev、aiui-production 和 IMU 菜单规范。
- 单绿色 #40FF5E、448×352、ink:控制属性、setData异步。
- 游戏状态由Controller权威管理，不读异步UI快照作决策。
- 菜单复用技能imu.js和MenuController；游戏姿态与菜单传感器互斥。
- 无相机/麦克风/联网/模型，规则得分不代表AI判断。
- npm test / npm run check / npm run build；真实AIX不等于真机通过。
- app是AIUI源码；preview是共享引擎的浏览器伴随预览，不冒充Host。
