export const MQTT_CONFIG = {
  host: "broker.emqx.io",
  port: 8083, // WebSockets port for EMQX
  tls: false,
  path: "/mqtt",
  cid: "EWolfTelemetryS3",
  topicTlm: "pb/telemetry/json",
  topicCfg: "pb/cmd/config",
  topicThr: "pb/cmd/motor", 
  topicStatus: "pb/status"
};