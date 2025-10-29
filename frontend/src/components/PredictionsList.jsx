// import React, {useEffect, useState} from 'react';
// import { getPredictions } from '../api';

// export default function PredictionsList(){
//   const [preds,setPreds] = useState([]);
//   useEffect(()=>{
//     async function load(){ try{ const p = await getPredictions(); setPreds(p); } catch(e){ console.error(e); } }
//     load();
//   },[]);
//   return (
//     <div className="card">
//       <div className="small">Predictions</div>
//       <ul>
//         {preds.length===0 && <li>No predictions</li>}
//         {preds.map(p=> <li key={p.id || p._id}>{p.task} — {JSON.stringify(p.result)}</li>)}
//       </ul>
//     </div>
//   );
// }


import React, {useEffect, useState} from 'react';
import { getPredictions } from '../api';

export default function PredictionsList(){
  const [preds,setPreds] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    async function load(){
      try{
        const p = await getPredictions();
        // ensure an array
        setPreds(Array.isArray(p) ? p : []);
      } catch(e){
        console.error(e);
        setPreds([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  },[]);

  return (
    <div className="card">
      <div className="small">Predictions</div>
      <ul>
        {loading && <li>Loading…</li>}
        {!loading && preds.length===0 && <li>No predictions</li>}
        {!loading && Array.isArray(preds) && preds.map(p=> (
          <li key={p.id || p._id || JSON.stringify(p).slice(0,20)}>
            {p.task} — {JSON.stringify(p.result)}
          </li>
        ))}
      </ul>
    </div>
  );
}
