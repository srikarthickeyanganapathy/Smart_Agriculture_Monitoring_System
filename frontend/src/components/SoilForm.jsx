import React,{useState} from 'react';
import { postSoil } from '../api';

export default function SoilForm(){
  const [fieldId,setFieldId]=useState('');
  const [sensorId,setSensorId]=useState('');
  const [ph,setPh]=useState(6.5);
  const [moist,setMoist]=useState(25);
  const [status,setStatus]=useState('');

  async function send(){
    setStatus('Sending...');
    try{
      const reading = { fieldId, sensorId, ph: parseFloat(ph), moisture: parseFloat(moist) };
      const r = await postSoil(reading);
      setStatus('Saved: '+(r.id || JSON.stringify(r)));
    } catch(err){ setStatus('Error: '+err.message); }
  }

  return (
    <div className="card">
      <div className="small">Soil Sensor</div>
      <div className="form-row">
        <input placeholder="fieldId" value={fieldId} onChange={e=>setFieldId(e.target.value)} />
        <input placeholder="sensorId" value={sensorId} onChange={e=>setSensorId(e.target.value)} />
      </div>
      <div className="form-row">
        <input placeholder="pH" value={ph} onChange={e=>setPh(e.target.value)} />
        <input placeholder="moisture" value={moist} onChange={e=>setMoist(e.target.value)} />
        <button className="button" onClick={send}>Send</button>
      </div>
      <div className="status">{status}</div>
    </div>
  );
}
