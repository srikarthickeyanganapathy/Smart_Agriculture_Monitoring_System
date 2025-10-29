import React from 'react';

export default function WeatherCard({weather}) {
  if(!weather) return (<div className="card"><div className="small">Weather</div><div>--</div></div>);
  return (
    <div className="card">
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <div className="small">TODAY WEATHER</div>
          <div style={{fontSize:22,fontWeight:700}}>{weather.weather?.[0]?.main || 'N/A'}</div>
          <div className="small">{weather.weather?.[0]?.description}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="big-num">{Math.round(weather.main?.temp)}°C</div>
          <div className="small">Feels like {Math.round(weather.main?.feels_like)}°C</div>
        </div>
      </div>
    </div>
  );
}



// import React, { useEffect, useState } from 'react';

// export default function WeatherCard() {
//   const [weather, setWeather] = useState(null);

//   // Function to generate random weather data
//   const generateRandomWeather = () => {
//     const conditions = [
//       { main: "Sunny", description: "clear sky" },
//       { main: "Cloudy", description: "scattered clouds" },
//       { main: "Rain", description: "light rain showers" },
//       { main: "Thunderstorm", description: "heavy thunder" },
//       { main: "Fog", description: "low visibility" },
//       { main: "Windy", description: "strong winds" }
//     ];

//     const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

//     const randomTemp = (Math.random() * 15 + 20).toFixed(1); // 20°C–35°C
//     const feelsLike = (parseFloat(randomTemp) + (Math.random() * 2 - 1)).toFixed(1); // ±1°C difference

//     return {
//       weather: [randomCondition],
//       main: {
//         temp: parseFloat(randomTemp),
//         feels_like: parseFloat(feelsLike)
//       }
//     };
//   };

//   // Update weather every second
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const newWeather = generateRandomWeather();
//       setWeather(newWeather);
//     }, 1000); // update every 1s
//     return () => clearInterval(interval);
//   }, []);

//   if (!weather)
//     return (
//       <div className="card">
//         <div className="small">Weather</div>
//         <div>--</div>
//       </div>
//     );

//   return (
//     <div className="card">
//       <div className="row" style={{ justifyContent: "space-between" }}>
//         <div>
//           <div className="small">TODAY WEATHER</div>
//           <div style={{ fontSize: 22, fontWeight: 700 }}>
//             {weather.weather?.[0]?.main || "N/A"}
//           </div>
//           <div className="small">{weather.weather?.[0]?.description}</div>
//         </div>
//         <div style={{ textAlign: "right" }}>
//           <div className="big-num">{Math.round(weather.main?.temp)}°C</div>
//           <div className="small">
//             Feels like {Math.round(weather.main?.feels_like)}°C
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
