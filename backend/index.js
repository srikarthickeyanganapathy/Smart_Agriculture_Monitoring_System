// simple proxy + convenience API
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// config (change in .env)
const INGESTION_BASE = process.env.INGESTION_BASE || 'http://localhost:5001';
const ORCH_BASE = process.env.ORCH_BASE || 'http://localhost:5002';
const RECOMM_BASE = process.env.RECOMM_BASE || 'http://localhost:5003';
const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY || '';

// upload middleware (forward file to ingestion service)
const upload = multer({ dest: path.join(__dirname, '../tmp') });

// health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// weather proxy (optional): gets current weather using OpenWeatherMap
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon || !OPENWEATHER_KEY) {
    return res.status(400).json({ error: 'lat, lon and OPENWEATHER_KEY needed' });
  }
  try {
    // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=12.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`;

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    res.status(502).json({ error: err.message, details: err.response?.data });
  }
});

// upload file: forwards file to the IngestionService
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const fieldId = req.body.fieldId || '';
    const filePath = req.file.path;
    // forward multipart to ingestion service
    const form = new (require('form-data'))();
    form.append('file', fs.createReadStream(filePath), req.file.originalname);
    form.append('fieldId', fieldId);

    const r = await axios.post(`${INGESTION_BASE}/api/ingestion/upload`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // delete temp file
    fs.unlinkSync(filePath);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

// forward predict request to orchestrator
app.post('/api/predict/crop', async (req, res) => {
  try {
    const r = await axios.post(`${ORCH_BASE}/api/orchestrator/predict/crop`, req.body);
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
});

// ingest soil reading -> forward to ingestion service
app.post('/api/soil', async (req, res) => {
  try {
    const r = await axios.post(`${INGESTION_BASE}/api/ingestion/ingest-soil`, req.body);
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
});

// get predictions (proxy)
app.get('/api/predictions', async (req, res) => {
  try {
    // const r = await axios.get(`${ORCH_BASE}/api/orchestrator/predictions`);
    const r={"data":["123"]};
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// recommend (forward to RecommendationsService or call OpenWeather)
app.get('/api/recommendations', async (req, res) => {
  try {
    const { lat, lon, crop } = req.query;
    const r = await axios.get(`${RECOMM_BASE}/api/recommendations?lat=${lat}&lon=${lon}&crop=${crop}`);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
