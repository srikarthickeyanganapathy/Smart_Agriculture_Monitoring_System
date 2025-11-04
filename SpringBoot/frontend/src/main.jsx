import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import 'leaflet/dist/leaflet.css';
import App from './App.jsx'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// Register them
ChartJS.register(ArcElement, Tooltip, Legend);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
