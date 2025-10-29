// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

//2
// import React from 'react';
// import UploadHyperspectral from './components/UploadHyperspectral';

// export default function App(){
//   return (
//     <div style={{ padding: 16 }}>
//       <h1>AgriApp Dashboard</h1>
//       <UploadHyperspectral />
//     </div>
//   );
// }


import React from 'react';
import Sidebar from './components/SideBar';
import Dashboard from './Dashboard';

export default function App(){
  return (
    <div className="app">
      <Sidebar />
      <Dashboard />
    </div>
  );
}
