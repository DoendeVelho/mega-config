import { state, clamp } from './state.js';

export function drawCurve(readFormFn) {
  const cv = document.getElementById("curveCv");
  if(!cv) return;
  const ctx = cv.getContext("2d");
  const w = cv.width = cv.clientWidth;
  const h = cv.height = cv.clientHeight;
  
  // Lê os valores mesclando (Inputs do Usuário) ou (Valor Live do ESP)
  const p = readFormFn(); 
  const min = p.min_v, max = Math.max(min + 0.05, p.max_v);
  const maxPct = clamp(p.max_pct, 0, 100);
  const startMin = clamp(p.start_min_pct, 0, 40);
  const padL = 44, padB = 24, padT = 10, padR = 10;

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#091022"; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = "#20304d";
  
  for(let i=0; i<=4; i++){
    const y = padT + (h-padT-padB)*(i/4);
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke();
  }
  ctx.strokeStyle = "#2d3b58";
  ctx.strokeRect(padL,padT,w-padL-padR,h-padT-padB);

  ctx.fillStyle="#9da8c2"; ctx.font="11px Segoe UI";
  ctx.fillText("0%", 8, h-padB+4); ctx.fillText("100%", 4, padT+4);
  ctx.fillText(`${min.toFixed(3)}V`, padL, h-6); ctx.fillText(`${max.toFixed(3)}V`, w-60, h-6);

  function yFromPct(pct){ return padT + (h-padT-padB)*(1 - clamp(pct,0,100)/100); }
  function xFromV(v){ return padL + (w-padL-padR) * ((v-min)/(max-min)); }

  // Desenha curva principal
  ctx.strokeStyle = "#4ea1ff"; ctx.lineWidth = 2; ctx.beginPath();
  for(let i=0; i<=140; i++){
    const v = min + (max-min)*(i/140);
    let pct = ((v-min)/(max-min))*100;
    pct = pct * (maxPct/100);
    if (pct > 0 && pct < startMin) pct = startMin;
    const x = xFromV(v), y = yFromPct(pct);
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();

  // Desenha posição atual do pedal
  if (Number.isFinite(state.lastVolts)){
    let pp = ((state.lastVolts-min)/(max-min))*100;
    pp = clamp(pp, 0, 100) * (maxPct/100);
    if (pp > 0 && pp < startMin) pp = startMin;
    ctx.fillStyle="#54d2b6";
    const x = xFromV(clamp(state.lastVolts,min,max));
    const y = yFromPct(pp);
    ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
  }
}