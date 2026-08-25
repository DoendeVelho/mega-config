// mqtt_client.js
import { MQTT_CONFIG } from './config.js';
import { state, num, clamp, f2 } from './state.js';
import { onTelemetryUpdate } from './app.js'; 

export function connectMqtt(configOverride = null) {
  const cfg = configOverride || MQTT_CONFIG;
  if (state.client) { 
    try { state.client.end(true); } catch(e){} 
    state.client = null; 
  }
  
  const proto = cfg.tls ? "wss" : "ws";
  const url = `${proto}://${cfg.host}:${cfg.port}${cfg.path}`;
  setMqttBadge("err", "MQTT: conectando...");
  
  try {
    state.client = mqtt.connect(url, {
      clientId: cfg.cid,
      clean: true, 
      reconnectPeriod: 1000, 
      keepalive: 10
    });
  } catch (e) {
    setMqttBadge("err", "MQTT: erro ao criar cliente");
    return;
  }

  state.client.on("connect", () => {
    setMqttBadge("ok", "MQTT: conectado");
    state.client.subscribe(cfg.topicTlm, {qos:0});
  });

  state.client.on("reconnect", () => setMqttBadge("warn", "MQTT: reconectando..."));
  state.client.on("close", () => setMqttBadge("err", "MQTT: desconectado"));
  
  state.client.on("message", (topic, payload) => {
    if (topic !== cfg.topicTlm) return;
    try {
      const d = JSON.parse(payload.toString());
      updateStateFromTelemetry(d);
      onTelemetryUpdate(d); 
    } catch (e) {
      console.error("Erro ao fazer parse da telemetria:", e);
    }
  });
}

function updateStateFromTelemetry(d) {
  state.lastVolts = num(d.volts, NaN);
  const l = state.live;
  
  if (Number.isFinite(num(d.min,NaN))) l.min_v = num(d.min);
  if (Number.isFinite(num(d.max,NaN))) l.max_v = num(d.max);
  if (Number.isFinite(num(d.max_pct,NaN))) l.max_pct = num(d.max_pct);
  if (Number.isFinite(num(d.start_min_pct,NaN))) l.start_min_pct = num(d.start_min_pct);
  if (Number.isFinite(num(d.pwm_hz,NaN))) l.pwm_hz = num(d.pwm_hz);
  if (Number.isFinite(num(d.rapid_ms,NaN))) l.rapid_ms = num(d.rapid_ms);
  if (Number.isFinite(num(d.rapid_up,NaN))) l.rapid_up = num(d.rapid_up);
  if (Number.isFinite(num(d.slew_up,NaN))) l.slew_up = num(d.slew_up);
  if (Number.isFinite(num(d.slew_dn,NaN))) l.slew_dn = num(d.slew_dn);
  if (Number.isFinite(num(d.zero_timeout_ms,NaN))) l.zero_timeout_ms = num(d.zero_timeout_ms);
}

export function publishCmd(topic, payload) {
  if (!state.client || !state.client.connected) return false;
  state.client.publish(topic, typeof payload === 'string' ? payload : JSON.stringify(payload));
  return true;
}

function setMqttBadge(status, text) {
  const textEl = document.getElementById("mqttText");
  const dotEl = document.getElementById("mqttDot");
  
  if (textEl) textEl.textContent = text;
  if (dotEl) dotEl.className = "dot " + status;
}
