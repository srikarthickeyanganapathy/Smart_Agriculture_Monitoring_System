import http from "./httpClient";

/**
 * Get crop recommendation from .NET ML Service via Spring Boot proxy
 * @param {Object} payload - { nitrogen, phosphorus, potassium, ph, rainfall, temperature, moisture }
 * @returns {Promise<Array>} - Array of crops with confidence scores
 */
export async function recommendCrop(payload) {
  const res = await http.post("/recommend/crop", payload);
  return res.data;
}

/**
 * Get crop recommendation history.
 * If fieldId is provided, returns specific field history.
 * If fieldId is null/undefined, returns all history (global).
 * @param {string|number} [fieldId]
 * @returns {Promise<Array>}
 */
export async function fetchCropHistory(fieldId) {
  // If fieldId exists, stick to specific path
  if (fieldId) {
    const res = await http.get(`/recommend/crop/history/${fieldId}`);
    return res.data;
  }
  // Else, use a global endpoint - assuming standard REST convention or what user set up
  // Given user request "my history should be for all... checks i have done", likely /recommend/crop/history root
  const res = await http.get(`/recommend/crop/history`);
  return res.data;
}
