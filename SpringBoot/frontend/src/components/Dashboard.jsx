import React, { useState, useEffect } from 'react';
import { getAllReadings, downloadYieldReport } from '../services/apiService.jsx';
import GaugeChart from './GaugeChart.jsx';
import { MapContainer, TileLayer } from 'react-leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';

// --- Threshold for irrigation alert ---
const SOIL_MOISTURE_THRESHOLD = 30;

function Dashboard() {
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);

  // --- Fetch sensor readings periodically ---
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Update heatmap whenever new readings arrive ---
  useEffect(() => {
    if (readings.length > 0) {
      const formattedData = readings.map(r => [
        r.lat,          // latitude (must exist in backend data)
        r.long,         // longitude (must exist in backend data)
        r.predictedYield // intensity (used for heat visualization)
      ]);
      setHeatmapData(formattedData);
    }
  }, [readings]);

  // --- Process incoming data and check for irrigation alert ---
  const processData = (data) => {
    setReadings(data);
    if (data.length > 0) {
      const latestReading = data[data.length - 1];
      if (latestReading.soilMoisture < SOIL_MOISTURE_THRESHOLD) {
        setAlert(
          `🚨 IRRIGATION ALERT: Soil moisture is critically low (${latestReading.soilMoisture.toFixed(1)}%)!`
        );
      } else {
        setAlert(null);
      }
    }
  };

  // --- Fetch from backend ---
  const fetchData = () => {
    getAllReadings()
      .then(response => {
        processData(response.data);
        setError(null);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setError("Could not fetch data. Please ensure all backend services are running.");
      });
  };

  // --- Download PDF report ---
  const handleDownloadReport = () => {
    downloadYieldReport()
      .then(response => {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'Yield_Report.pdf';
        link.click();
      })
      .catch(err => {
        console.error("Error downloading report:", err);
        // --- FIX THIS LINE ---
        window.alert("Failed to download report. Please check backend connection.");
      });
  };

  // --- Handle loading or error states ---
  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  // --- Latest reading for gauges ---
  const latestReading =
    readings.length > 0
      ? readings[readings.length - 1]
      : { soilMoisture: 0, temperature: 0, predictedYield: 0 };

  // --- Default map center ---
  const mapCenter = heatmapData.length > 0
    ? [heatmapData[0][0], heatmapData[0][1]] // Use first data point
    : [40.7128, -74.0060]; // Default (New York City)

  return (
    <div style={{ padding: '20px' }}>
      <h1>🌾 Smart Agriculture Dashboard</h1>

      {/* --- ALERT BOX --- */}
      {alert && (
        <div
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '15px',
            borderRadius: '5px',
            margin: '20px 0',
            fontSize: '18px',
            textAlign: 'center',
          }}
        >
          {alert}
        </div>
      )}

      {/* --- GAUGES --- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '50px',
          margin: '20px',
        }}
      >
        <GaugeChart
          value={latestReading.soilMoisture}
          label="Soil Moisture"
          unit="%"
          max={100}
        />
        <GaugeChart
          value={latestReading.temperature}
          label="Temperature"
          unit="°C"
          max={50}
        />
      </div>

      {/* --- PDF REPORT DOWNLOAD --- */}
      <button
        onClick={handleDownloadReport}
        style={{
          display: 'block',
          margin: '20px auto',
          padding: '10px 20px',
          fontSize: '16px',
          borderRadius: '5px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        📄 Download PDF Report
      </button>

      {/* --- HEATMAP SECTION --- */}
      <div style={{ height: '400px', width: '80%', margin: '20px auto' }}>
        <h3 style={{ textAlign: 'center' }}>Yield Prediction Heatmap</h3>
        <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <HeatmapLayer
            fitBoundsOnLoad
            fitBoundsOnUpdate
            points={heatmapData}
            longitudeExtractor={(m) => m[1]}
            latitudeExtractor={(m) => m[0]}
            intensityExtractor={(m) => m[2]}
            radius={20}
            blur={15}
          />
        </MapContainer>
      </div>

      {/* --- DATA LOG TABLE --- */}
      <h3 style={{ textAlign: 'center' }}>Recent Data Log</h3>
      <table
        border="1"
        cellPadding="10"
        cellSpacing="0"
        style={{ width: '80%', margin: 'auto', borderCollapse: 'collapse' }}
      >
        <thead style={{ backgroundColor: '#f2f2f2' }}>
          <tr>
            <th>ID (from CSV)</th>
            <th>Predicted Yield (t/ha)</th>
            <th>Soil Moisture (%)</th>
            <th>Temperature (°C)</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {readings.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                No data yet. Waiting for simulator...
              </td>
            </tr>
          ) : (
            readings
              .slice(-5)
              .reverse()
              .map((reading) => (
                <tr key={reading.id}>
                  <td>{reading.uniqueDataId}</td>
                  <td>{reading.predictedYield?.toFixed(2)}</td>
                  <td>{reading.soilMoisture?.toFixed(2)}</td>
                  <td>{reading.temperature?.toFixed(2)}</td>
                  <td>{new Date(reading.timestamp).toLocaleString()}</td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
