// Matches the requested gyro-y integration. Flip to -1 if the device axes
// make the desired up/down gesture select in the opposite direction.
export const IMU_DIRECTION = 1;
// Pitch selection uses x, independently reversible from yaw selection.
export const IMU_PITCH_DIRECTION = 1;
const FRAME_SECONDS = 1 / 15;

export class MenuIMU {
  constructor(Sensor, move, changed, now = () => Date.now(), confirm = () => {}) {
    this.Sensor = Sensor; this.move = move; this.changed = changed; this.now = now;
    this.confirm = confirm; this.mode = 'horizontal'; this.confirmCooldownUntil = 0;
    this.phase = 'idle'; this.sensor = null; this.reset();
  }
  reset() {
    this.shakeYaw = 0; this.cooldown = 0; this.lastTime = null;
    this.nodAngle = 0; this.nodStroke = 0; this.nodDeadline = 0; this.nodReadyAt = null;
  }
  sync(enabled, mode = 'horizontal') {
    if (mode !== this.mode) { this.reset(); this.mode = mode; this.cooldown = 2; }
    if (!enabled) { this.stop(); return; }
    if (this.phase !== 'idle') return;
    if (!this.Sensor) { this.phase = 'unavailable'; return; }
    this.phase = 'running'; this.reset();
    try {
      const sensor = new this.Sensor({ frequency: 15 }); this.sensor = sensor;
      this.reading = () => {
        if (this.sensor !== sensor || this.phase !== 'running') return;
        const delta = this.sample(sensor.y, sensor.x);
        if (delta) this.move(delta);
      };
      this.error = () => {
        if (this.sensor !== sensor) return;
        this.stop(); this.phase = 'failed'; this.changed();
      };
      sensor.addEventListener('reading', this.reading);
      sensor.addEventListener('error', this.error);
      sensor.start();
    } catch (_) { this.stop(); this.phase = 'failed'; }
  }
  sample(y, x = 0) {
    const time = this.now();
    const dt = this.lastTime === null ? FRAME_SECONDS : (time - this.lastTime) / 1000;
    this.lastTime = time;
    const velocity = this.mode === 'vertical' ? x : y;
    // Use callback arrival time in milliseconds, avoiding host timestamp units.
    // A long pause is not evidence that the last angular velocity persisted.
    if (!Number.isFinite(time) || !Number.isFinite(velocity) || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) {
      this.reset(); return 0;
    }
    if (this.mode === 'horizontal-confirm' && this.sampleNod(x, y, time, dt)) return 0;
    if (this.cooldown > 0) { this.cooldown--; this.shakeYaw = 0; return 0; }
    if (Math.abs(velocity) > 0.05) this.shakeYaw -= velocity * dt * 180 / Math.PI;
    this.shakeYaw *= Math.pow(0.60, dt);
    if (Math.abs(this.shakeYaw) <= 5) return 0;
    const delta = (this.shakeYaw > 0 ? 1 : -1) * (this.mode === 'vertical' ? IMU_PITCH_DIRECTION : IMU_DIRECTION);
    this.shakeYaw = 0; this.cooldown = 2;
    this.nodAngle = 0; this.nodStroke = 0; this.nodReadyAt = Math.max(this.confirmCooldownUntil, time + 300);
    return delta;
  }
  sampleNod(x, y, time, dt) {
    if (this.nodReadyAt === null) this.nodReadyAt = time + 300;
    if (!Number.isFinite(x) || time < Math.max(this.nodReadyAt, this.confirmCooldownUntil) || Math.abs(y) > 0.25) {
      this.nodAngle = 0; this.nodStroke = 0; return false;
    }
    if (this.nodStroke && time > this.nodDeadline) {
      this.nodAngle = 0; this.nodStroke = 0; this.nodReadyAt = time + 800; return true;
    }
    if (Math.abs(x) > 0.05) this.nodAngle -= x * dt * 180 / Math.PI;
    this.nodAngle *= Math.pow(0.60, dt);
    if (!this.nodStroke && Math.abs(this.nodAngle) > 8) {
      this.nodStroke = this.nodAngle > 0 ? 1 : -1;
      this.nodDeadline = time + 1200;
    }
    // Confirm a complete stroke and active return, never passive decay or
    // holding a tilted head. Either pitch sign works with host axis conventions.
    if (this.nodStroke && x * this.nodStroke > 0.2 && this.nodAngle * this.nodStroke < 3) {
      this.nodAngle = 0; this.nodStroke = 0; this.shakeYaw = 0;
      this.confirmCooldownUntil = time + 1000;
      this.nodReadyAt = this.confirmCooldownUntil; this.cooldown = 2;
      this.confirm(); return true;
    }
    return this.nodStroke !== 0 || Math.abs(x) > 0.25 && Math.abs(x) > Math.abs(y);
  }
  stop() {
    this.confirmCooldownUntil = 0;
    const sensor = this.sensor; this.sensor = null; this.phase = 'idle'; this.reset();
    if (!sensor) return;
    try { sensor.removeEventListener('reading', this.reading); } catch (_) {}
    try { sensor.removeEventListener('error', this.error); } catch (_) {}
    try { sensor.stop(); } catch (_) {}
    this.reading = null; this.error = null;
  }
}
