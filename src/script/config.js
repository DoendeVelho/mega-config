// config.js
const isHttps = window.location.protocol === 'https:';

export const MQTT_CONFIG = {
  host: "broker.emqx.io",
  port: isHttps ? 8084 : 8083, // Usa 8084 para WSS e 8083 para WS
  tls: isHttps,
  path: "/mqtt",
  cid: "EWolfCfg-" + Math.floor(Math.random() * 10000), // ID único para não conflitar com o dashboard
  topicTlm: "pb/telemetry/json",
  topicCfg: "pb/cmd/config",
  topicThr: "pb/cmd/motor", 
  topicStatus: "pb/status"
};
