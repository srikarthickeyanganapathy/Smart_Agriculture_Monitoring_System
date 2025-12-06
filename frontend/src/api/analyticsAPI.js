import http from "./httpClient";

// Start the digital twin simulation
export const startSimulation = () => http.get("/analytics/start");

// Helper to parse backend data (handles raw data object)
const processFieldsPayload = (data) => {
    if (data && data.fields) {
        data.fields = data.fields.map(f => ({
            ...f,
            plants: typeof f.plantsJson === 'string' ? JSON.parse(f.plantsJson) : (f.plants || [])
        }));
    }
    return data;
};

// Fetch all fields (returns Axios response for Analytics.jsx)
export const fetchFieldSimulation = () => http.get("/analytics/fields").then(res => {
    res.data = processFieldsPayload(res.data);
    return res;
});

// Get all fields (returns data directly for FieldView.jsx)
export const getAllFields = () => http.get("/analytics/fields").then(r => processFieldsPayload(r.data));

// Get single field by ID (parses plantsJson if single object has it)
export const getFieldById = (id) => http.get(`/analytics/fields/${id}`).then(r => {
    const f = r.data;
    if (f) {
        f.plants = typeof f.plantsJson === 'string' ? JSON.parse(f.plantsJson) : (f.plants || []);
    }
    return f;
});

// Apply automated fix to a field
export const adjustField = (fieldId) => http.post("/analytics/adjust", { fieldId }).then(r => r.data);

// Clear alerts for a field
export const clearAlerts = (fieldId) => http.post("/analytics/alerts/clear", { fieldId }).then(r => r.data);

// SSE URL for real-time alerts (Spring Boot streams these)
export const ALERTS_SSE_URL = "http://localhost:8080/api/v1/analytics/alerts/sse";

// Disease prediction (Python ML via Spring Boot proxy)
export const predictDisease = (payload) => http.post("/predict/disease", payload).then(r => r.data);
