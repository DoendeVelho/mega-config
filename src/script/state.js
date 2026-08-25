export const state = {
  lastVolts: NaN,
  live: {
    min_v: 1.10, max_v: 4.25, max_pct: 100, start_min_pct: 8,
    pwm_hz: 1000, rapid_ms: 250, rapid_up: 150, slew_up: 40, slew_dn: 60, zero_timeout_ms: 600
  },
  client: null
};

// Utils essenciais
export const num = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const f2 = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : "--";