// const INGESTION_BASE = process.env.REACT_APP_INGESTION || "http://localhost:5001";
// const ORCH_BASE = process.env.REACT_APP_ORCH || "http://localhost:5002";
// const RECOMM_BASE = process.env.REACT_APP_RECOMM || "http://localhost:5003";

//2
// const INGESTION_BASE = import.meta.env.VITE_INGESTION || "http://localhost:5001";
// const ORCH_BASE = import.meta.env.VITE_ORCH || "http://localhost:5002";
// const RECOMM_BASE = import.meta.env.VITE_RECOMM || "http://localhost:5003";


// export async function uploadHyperspectral(file, fieldId) {
//   const form = new FormData();
//   form.append("file", file);
//   form.append("fieldId", fieldId);
//   const res = await fetch(`${INGESTION_BASE}/api/ingestion/upload`, {
//     method: "POST",
//     body: form
//   });
//   return res.json();
// }

// export async function triggerCropPredict(imageId) {
//   const res = await fetch(`${ORCH_BASE}/api/orchestrator/predict/crop`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ imageId })
//   });
//   return res.json();
// }

// export async function ingestSoil(reading) {
//   const res = await fetch(`${INGESTION_BASE}/api/ingestion/ingest-soil`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(reading)
//   });
//   return res.json();
// }

// export async function getPredictions() {
//   const res = await fetch(`${ORCH_BASE}/api/orchestrator/predictions`);
//   return res.json();
// }

// export async function getRecommendations(lat, lon, crop) {
//   const res = await fetch(`${RECOMM_BASE}/api/recommendations?lat=${lat}&lon=${lon}&crop=${crop}`);
//   return res.json();
// }

// export { INGESTION_BASE, ORCH_BASE, RECOMM_BASE };

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export async function uploadFile(file, fieldId) {
  const form = new FormData();
  form.append('file', file);
  form.append('fieldId', fieldId);
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: form });
  return res.json();
}

export async function triggerPredict(imageId) {
  const res = await fetch(`${BASE}/api/predict/crop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId })
  });
  return res.json();
}

export async function postSoil(reading) {
  const res = await fetch(`${BASE}/api/soil`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reading)
  });
  return res.json();
}

export async function getWeather(lat, lon) {
  const res = await fetch(`${BASE}/api/weather?lat=${lat}&lon=${lon}`);
  return res.json();
}

export async function getPredictions() {
  const res = await fetch(`${BASE}/api/predictions`);
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    // If backend returns { predictions: [...] } or similar, normalize it
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.predictions)) return data.predictions;
    // if server returned an object that looks like an error, log and return []
    console.warn('getPredictions: unexpected response shape', data);
    return [];
  } catch (err) {
    console.error('getPredictions: failed to parse JSON', text, err);
    return [];
  }
}


// export async function getPredictions() {
//   const res = await fetch(`${BASE}/api/predictions`);
//   return res.json();
// }

export async function getRecommendations(lat, lon, crop) {
  const res = await fetch(`${BASE}/api/recommendations?lat=${lat}&lon=${lon}&crop=${crop}`);
  return res.json();
}
