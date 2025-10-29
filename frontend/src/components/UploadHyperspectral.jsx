// import React, {useState} from 'react';
// import { uploadHyperspectral, triggerCropPredict } from '../api';

// export default function UploadHyperspectral(){
//   const [file,setFile] = useState(null);
//   const [fieldId,setFieldId] = useState("");
//   const [status,setStatus] = useState("");

//   async function onUpload(e){
//     e.preventDefault();
//     if(!file) return alert("choose file");
//     setStatus("Uploading...");
//     try{
//       const res = await uploadHyperspectral(file, fieldId);
//       setStatus("Uploaded, triggering prediction...");
//       const pred = await triggerCropPredict(res.id);
//       setStatus(JSON.stringify(pred));
//     }catch(err){
//       setStatus("Error: "+err.message);
//     }
//   }

//   return (
//     <div>
//       <h3>Upload Hyperspectral</h3>
//       <input type="file" accept=".npy,.npz,.tif,.tiff" onChange={e=>setFile(e.target.files[0])} />
//       <input value={fieldId} onChange={e=>setFieldId(e.target.value)} placeholder="fieldId" />
//       <button onClick={onUpload}>Upload & Predict</button>
//       <div>{status}</div>
//     </div>
//   );
// }

import React, {useState} from 'react';
import { uploadFile, triggerPredict } from '../api';

export default function UploadHyperspectral(){
  const [file,setFile] = useState(null);
  const [fieldId,setFieldId] = useState('');
  const [status,setStatus] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    if(!file) return alert('choose file');
    setStatus('Uploading...');
    try{
      const up = await uploadFile(file, fieldId);
      setStatus('Uploaded. Triggering prediction...');
      const pred = await triggerPredict(up.id);
      setStatus(JSON.stringify(pred));
    } catch(err){
      setStatus('Error: '+err.message);
    }
  }

  return (
    <div className="card">
      <div className="small">Upload Hyperspectral</div>
      <div className="form-row">
        <input type="file" accept=".npy,.npz,.tif,.tiff" onChange={e=>setFile(e.target.files[0])} />
        <input placeholder="fieldId" value={fieldId} onChange={e=>setFieldId(e.target.value)} />
        <button className="button" onClick={onSubmit}>Upload & Predict</button>
      </div>
      <div className="status">{status}</div>
    </div>
  );
}
