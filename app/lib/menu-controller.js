import { MenuIMU } from './imu.js';

export function horizontalLayout(count, width = 416) {
  const columns = Math.min(3, Math.max(1, count));
  const buttonWidth = Math.floor((width - (columns - 1) * 10) / columns);
  return { buttonWidth, buttonRowWidth: Math.max(width, count * (buttonWidth + 10) - 10) };
}

// actions: [{ id, label, run() }]; list entries use the same shape.
// Controller state is authoritative; never read async setData patches back.
export class MenuController {
  constructor({ Sensor, emit, report = () => {}, now, navigationCooldownMs = 0, keyNavigationCooldownMs = 280 }) {
    this.emit = emit; this.report = report; this.foreground = false;
    this.now = now || (() => Date.now()); this.confirmUntil = 0;
    this.navigationCooldownMs = Math.max(0, navigationCooldownMs); this.lastMoveAt = -Infinity; this.recordStep = 36;
    // A temple swipe can arrive as several release events (including direction
    // aliases). Deduplicate manual selection only; preserve normal IMU pacing.
    this.keyNavigationCooldownMs = Math.max(0, keyNavigationCooldownMs); this.keyNavigationUntil = -Infinity;
    this.blocked = false; this.pending = false; this.focus = 0; this.epoch = 0;
    this.buttons = []; this.records = []; this.width = 416; this.menuScrollLeft = 0;
    this.imu = new MenuIMU(Sensor, delta => {
      if (this.now() >= this.keyNavigationUntil) this.move(delta);
    }, () => this.render(), this.now, () => this.confirm());
  }
  configure({ buttons, records = [], width = 416, recordStep = 36 }) {
    this.imu.stop(); this.epoch++; this.pending = false;
    this.recordStep = recordStep;
    this.menuScrollLeft = 0; this.buttons = buttons; this.records = records; this.width = width; this.focus = 0; this.confirmUntil = 0;
    this.render();
  }
  show() { this.foreground = true; this.render(); }
  hide() { this.foreground = false; this.epoch++; this.pending = false; this.imu.stop(); }
  setBlocked(blocked) { this.blocked = blocked; this.render(); }
  items() { return [...this.buttons, ...this.records]; }
  enabled() { return this.foreground && !this.blocked && !this.pending && this.items().length > 0; }
  inRecords() { return this.focus >= this.buttons.length && this.focus < this.items().length; }
  move(delta) {
    if (!this.enabled()) return;
    const time = this.now();
    if (time - this.lastMoveAt < this.navigationCooldownMs) return;
    this.lastMoveAt = time;
    const count = this.items().length;
    this.focus = this.records.length ? Math.max(0, Math.min(count - 1, this.focus + delta)) : (this.focus + delta + count) % count;
    this.render();
  }
  confirm() {
    if (!this.enabled()) return;
    const action = this.items()[this.focus];
    if (!action) return;
    const epoch = this.epoch;
    this.confirmUntil = this.now() + 1000;
    this.pending = true; this.imu.stop();
    let result;
    // run synchronously on this input callback, especially for takePhoto.
    try { result = action.run(); }
    catch (error) {
      if (epoch === this.epoch && this.foreground) { this.pending = false; this.report(error); this.render(); }
      return;
    }
    this.render();
    return Promise.resolve(result).catch(error => {
      if (epoch === this.epoch && this.foreground) this.report(error);
    }).finally(() => {
      if (epoch !== this.epoch || !this.foreground) return;
      this.pending = false; this.render();
    });
  }
  tap(id) {
    if (!this.enabled()) return;
    const index = this.items().findIndex(item => item.id === id);
    if (index < 0) return;
    this.focus = index; this.imu.reset();
    return this.confirm();
  }
  key(event) {
    // The owning page may implement an internal back action separately.
    if (event.code === 'Backspace' || !this.enabled()) return;
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.code)) {
      event.preventDefault();
      if (event.repeat || this.now() < this.keyNavigationUntil) return;
      this.keyNavigationUntil = this.now() + this.keyNavigationCooldownMs;
      this.imu.reset();
      this.move(event.code === 'ArrowLeft' || event.code === 'ArrowUp' ? -1 : 1);
    } else if (event.code === 'Enter') {
      event.preventDefault(); this.imu.reset(); return this.confirm();
    }
  }
  render() {
    if (!this.foreground) return;
    this.focus = Math.min(this.focus, Math.max(0, this.items().length - 1));
    const listMode = this.inRecords();
    this.imu.sync(this.enabled(), listMode ? 'vertical' : 'horizontal-confirm');
    this.imu.confirmCooldownUntil = Math.max(this.imu.confirmCooldownUntil, this.confirmUntil);
    const items = this.items().map((item, index) => ({
      id: item.id, label: (index === this.focus ? '› ' : '') + item.label,
      nodeId: 'menu-' + index, className: index === this.focus ? 'menu-action selected' : 'menu-action'
    }));
    const layout = horizontalLayout(this.buttons.length, this.width);
    const maxScroll = Math.max(0, layout.buttonRowWidth - this.width);
    if (!listMode) this.menuScrollLeft = Math.min(maxScroll, Math.floor(this.focus / 3) * 3 * (layout.buttonWidth + 10));
    else this.menuScrollLeft = Math.min(maxScroll, this.menuScrollLeft);
    this.emit({ ...layout, menuScrollLeft: this.menuScrollLeft,
      menuButtons: items.slice(0, this.buttons.length), menuRecords: items.slice(this.buttons.length),
      menuFocusId: !listMode ? 'menu-' + this.focus : '',
      menuRecordScrollTop: Math.max(0, this.focus - this.buttons.length) * this.recordStep,
      menuHasRecords: this.records.length > 0, menuWidth: this.width, menuPending: this.pending,
      menuHelp: this.blocked || this.pending ? '处理中 · 按屏幕提示操作' : this.imu.phase !== 'running' ? 'IMU 不可用 · 方向键/点击选择 · 确认键执行'
        : listMode ? '上下浏览内容 · 点击/确认键执行' : this.records.length ? '左右选操作 · 点头确认 · 向右进入内容' : '左右摇头选择 · 点头确认'
    });
  }
}
