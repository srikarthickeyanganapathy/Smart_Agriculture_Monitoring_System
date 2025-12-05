import http from "./httpClient";

/**
 * Predict disease probability from Python ML Engine via Spring Boot proxy
 * @param {Object} payload - { ndvi, temperature, moisture, nitrogen, phosphorus, potassium, irrigation }
 * @returns {Promise<Object>} - { disease: string, probability: number, class: string }
 */
export async function detectDisease(payload) {
  const res = await http.post("/predict/disease", payload);
  return res.data;
}

/**
 * Get disease prediction history.
 * If fieldId is provided, returns specific field history.
 * If fieldId is null/undefined, returns all history (global).
 * @param {string|number} [fieldId]
 * @returns {Promise<Array>}
 */
export async function fetchDiseaseHistory(fieldId) {
  if (fieldId) {
    const res = await http.get(`/predict/disease/history/${fieldId}`);
    return res.data;
  }
  const res = await http.get(`/predict/disease/history`);
  return res.data;
}
