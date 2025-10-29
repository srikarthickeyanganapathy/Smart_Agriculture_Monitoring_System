import React, {useEffect, useState} from 'react';
import WeatherCard from './components/WeatherCard';
import StatCard from './components/StatCard';
import Clock from './components/Clock';
import UploadHyperspectral from './components/UploadHyperspectral';
import SoilForm from './components/SoilForm';
import PredictionsList from './components/PredictionsList';
import { getWeather } from './api';

export default function Dashboard(){
  const [weather,setWeather] = useState(null);
  useEffect(()=> {
    // sample coordinates - change as needed
    async function load(){ try{ const w = await getWeather(7.29, 80.63); setWeather(w); } catch(e) { console.error(e); } }
    load();
  },[]);
  return (
    <div className="content">
      <div className="top">
        <div style={{flex:1}}>
          <div className="header">Dashboard</div>
          <div className="small">Powered by Openweathermap</div>
        </div>
        <div style={{width:260}}><Clock/></div>
      </div>

      <div className="grid">
        <WeatherCard weather={weather}/>
        <div style={{display:'grid', gap:12}}>
          <StatCard title="TEMPERATURE" value={weather ? Math.round(weather.current.temperature_2m)+'°C' : '--'} sub="Current" />
          <StatCard title="HUMIDITY" value={weather ? weather.current.wind_speed_10m + '%' : '--'} sub="Atmospheric" />
        </div>
        <div>
          <div style={{display:'grid', gap:12}}>
            <UploadHyperspectral />
            <SoilForm />
          </div>
        </div>

        <StatCard title="WIND SPEED" value={weather ? weather.current.wind_speed_10m + ' km/h' : '--'} sub="Wind" />
        <PredictionsList />
        <div className="card">
          <div className="small">Yield Heatmap</div>
          <div style={{height:180, background:'#f0f4f8', marginTop:8, display:'flex',alignItems:'center',justifyContent:'center', color:'#666'}}>Map/Heatmap placeholder</div>
        </div>
      </div>
    </div>
  );
}
