import { MQTT_CONFIG } from './config.js';
import { state, num, clamp, f2 } from './state.js';
import { connectMqtt, publishCmd } from './mqtt_client.js';
import { drawCurve } from './curve.js';

const $ = id => document.getElementById(id);

// Atualiza a UI quando a telemetria chega
export function onTelemetryUpdate(d) {
  const volts = state.lastVolts;
  const pct = num(d.pct, NaN);
  
  $("voltsNow").textContent = f2(volts,3);
  $("pctNow").textContent = f2(pct,1);
  $("minNow").textContent = f2(state.live.min_v, 3);
  $("maxNow").textContent = f2(state.live.max_v, 3);
  $("lastMsgText").textContent = new Date().toLocaleTimeString();
  
  if (Number.isFinite(pct)) $("barPct").style.width = `${clamp(pct,0,100)}%`;

  // Atualiza os Textos de Valor Atual (Não sobrescreve os Inputs!)
  $("liveMinV").textContent = state.live.min_v.toFixed(3);
  $("liveMaxV").textContent = state.live.max_v.toFixed(3);
  $("liveMaxPct").textContent = state.live.max_pct.toFixed(0);
  $("liveStartMin").textContent = state.live.start_min_pct.toFixed(0);
  $("livePwmHz").textContent = state.live.pwm_hz.toFixed(0);
  $("liveRapidMs").textContent = state.live.rapid_ms.toFixed(0);
  $("liveRapidUp").textContent = state.live.rapid_up.toFixed(0);
  $("liveSlewUp").textContent = state.live.slew_up.toFixed(0);
  $("liveSlewDn").textContent = state.live.slew_dn.toFixed(0);
  $("liveZeroTo").textContent = state.live.zero_timeout_ms.toFixed(0);

  drawCurve(readMergedForm);
  renderWarnings();
}

// Lógica crucial: Se o input estiver preenchido, usa ele, senão usa o Live do ESP
function readMergedForm() {
  const parseVal = (id, liveVal) => {
    const val = $(id).value;
    return val !== "" ? Number(val) : liveVal;
  };
  return {
    min_v: parseVal("minVIn", state.live.min_v),
    max_v: parseVal("maxVIn", state.live.max_v),
    max_pct: parseVal("maxPctIn", state.live.max_pct),
    start_min_pct: parseVal("startMinIn", state.live.start_min_pct),
    pwm_hz: parseVal("pwmHzIn", state.live.pwm_hz),
    rapid_ms: parseVal("rapidMsIn", state.live.rapid_ms),
    rapid_up: parseVal("rapidUpIn", state.live.rapid_up),
    slew_up: parseVal("slewUpIn", state.live.slew_up),
    slew_dn: parseVal("slewDnIn", state.live.slew_dn),
    zero_timeout_ms: parseVal("zeroToIn", state.live.zero_timeout_ms)
  };
}

function renderWarnings() {
  const v = readMergedForm();
  const out = [];
  if (v.max_v <= v.min_v) out.push(`<div class="warn-err">ERRO: max_v > min_v.</div>`);
  if (v.max_v - v.min_v < 0.7) out.push(`<div class="warn-warn">Range baixo (${(v.max_v-v.min_v).toFixed(3)}V). Pode ficar ruidoso.</div>`);
  if (out.length===0) out.push(`<div class="warn-ok">Configuração OK.</div>`);
  $("warnBox").innerHTML = out.join("");
}

// Botões SET MIN / SET MAX NOW
$("btnUseNowMin").onclick = () => {
  if (Number.isFinite(state.lastVolts)) {
    $("minVIn").value = state.lastVolts.toFixed(3);
    drawCurve(readMergedForm);
  }
};
$("btnUseNowMax").onclick = () => {
  if (Number.isFinite(state.lastVolts)) {
    $("maxVIn").value = state.lastVolts.toFixed(3);
    drawCurve(readMergedForm);
  }
};

// Eventos de aplicar
$("btnApplyBase").onclick = () => {
  const form = readMergedForm();
  publishCmd(MQTT_CONFIG.topicCfg, { 
    min_v: form.min_v, max_v: form.max_v, max_pct: form.max_pct, start_min_pct: form.start_min_pct 
  });
};

$("btnApplyDynamics").onclick = () => {
  const form = readMergedForm();
  publishCmd(MQTT_CONFIG.topicCfg, { 
    pwm_hz: form.pwm_hz, rapid_ms: form.rapid_ms, rapid_up: form.rapid_up, 
    slew_up: form.slew_up, slew_dn: form.slew_dn, zero_timeout_ms: form.zero_timeout_ms 
  });
};

$("btnApplyAll").onclick = () => publishCmd(MQTT_CONFIG.topicCfg, readMergedForm());

// Inicializar Conexão
$("btnConnect").onclick = connectMqtt;
$("btnDisconnect").onclick = () => state.client && state.client.end(true);

window.onload = () => {
  // Conecta na carga da página
  connectMqtt();
  
  // Ouve mudanças nos inputs para atualizar o gráfico local em tempo real
  const inputs = ["minVIn", "maxVIn", "maxPctIn", "startMinIn"];
  inputs.forEach(id => {
    $(id).addEventListener("input", () => {
      renderWarnings();
      drawCurve(readMergedForm);
    });
  });
};