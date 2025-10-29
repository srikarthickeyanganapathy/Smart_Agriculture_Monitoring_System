import React, { useState } from "react";
import axios from "axios";

export default function CropUpload() {
  const [file, setFile] = useState(null);
  const [fieldId, setFieldId] = useState("");
  const [result, setResult] = useState("");

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fieldId", fieldId);

    const res = await axios.post("https://localhost:7040/api/ingestion/upload", formData);
    setResult(JSON.stringify(res.data));
  };

  return (
    <div>
      <input type="text" placeholder="Field ID" value={fieldId} onChange={e => setFieldId(e.target.value)} />
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      {result && <div>{result}</div>}
    </div>
  );
}
