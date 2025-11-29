import http from "./httpClient";

export const startSimulation = () =>
  http.get("/analytics/start");

export const fetchFieldSimulation = () =>
  http.get("/analytics/fields");

export const ALERTS_SSE_URL = "http://localhost:8080/api/v1/analytics/alerts/sse";

export const getAllFields = () => http.get("/analytics/fields").then(r => r.data);
export const getFieldById = (id) => http.get(`/analytics/fields/${id}`).then(r => r.data);
export const adjustField = (fieldId) => http.post("/analytics/adjust", { fieldId }).then(r => r.data);
export const clearAlerts = (fieldId) => http.post("/analytics/alerts/clear", { fieldId }).then(r => r.data);
