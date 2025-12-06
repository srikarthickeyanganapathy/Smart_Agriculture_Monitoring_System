// src/components/DiseasePredictionForm.jsx
import React, { useState, useEffect } from "react";
import { detectDisease } from "../api/diseaseAPI";

/**
 * Form to predict disease probability from Python ML Engine via Spring Boot
 * Accepts `autoFilledData` prop to populate based on selected field.
 * Accepts `fieldId` prop to identify the field for the backend.
 * Accepts `plantId` prop (optional) to identify specific plant.
 */
const DiseasePredictionForm = ({ autoFilledData, fieldId, plantId, onSuccess }) => {
  const [formData, setFormData] = useState({
    ndvi: "",
    temperature: "",
    moisture: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    irrigation: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (autoFilledData) {
      setFormData({
        ndvi: autoFilledData.ndvi || "",
        temperature: autoFilledData.temperature || "",
        moisture: autoFilledData.moisture || "",
        nitrogen: autoFilledData.nitrogen || "",
        phosphorus: autoFilledData.phosphorus || "",
        potassium: autoFilledData.potassium || "",
        irrigation: autoFilledData.irrigation || ""
      });
    }
  }, [autoFilledData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    if (!fieldId) {
      setError("Please select a field first.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        fieldId: parseInt(fieldId),
        plantId: plantId ? parseInt(plantId) : null,
        ndvi: parseFloat(formData.ndvi),
        temperature: parseFloat(formData.temperature),
        moisture: parseFloat(formData.moisture),
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
        irrigation: parseFloat(formData.irrigation)
      };
      const data = await detectDisease(payload);
      setResult(data);
      
      // Trigger refresh callback
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error(err);
      setError("Failed to predict disease. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all";

  const getRiskColor = (prob) => {
    if (prob >= 0.7) return "text-red-600 bg-red-50 border-red-200";
    if (prob >= 0.4) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NDVI</label>
          <input type="number" step="0.01" name="ndvi" value={formData.ndvi} onChange={handleChange} className={inputClass} placeholder="0.0-1.0" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
          <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} className={inputClass} placeholder="10-45" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Soil Moisture (%)</label>
          <input type="number" step="0.1" name="moisture" value={formData.moisture} onChange={handleChange} className={inputClass} placeholder="20-80" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nitrogen</label>
          <input type="number" name="nitrogen" value={formData.nitrogen} onChange={handleChange} className={inputClass} placeholder="0-140" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phosphorus</label>
          <input type="number" name="phosphorus" value={formData.phosphorus} onChange={handleChange} className={inputClass} placeholder="5-145" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Potassium</label>
          <input type="number" name="potassium" value={formData.potassium} onChange={handleChange} className={inputClass} placeholder="5-205" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Irrigation Level</label>
        <input type="number" step="0.1" name="irrigation" value={formData.irrigation} onChange={handleChange} className={inputClass} placeholder="0-100" required />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
      >
        {loading ? "Analyzing Condition..." : "Predict Disease Risk"}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className={`p-6 rounded-xl border animate-fade-in ${getRiskColor(result.probability || 0)}`}>
          <h4 className="font-bold text-gray-900 mb-3 text-lg">Disease Analysis</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Predicted Disease:</span>
              <span className="font-semibold text-lg">{result.disease || "Unknown"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Probable Risk:</span>
              <span className="font-bold text-2xl">{((result.probability || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-black/5">
              <span className="text-gray-600">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-white ${getRiskColor(result.probability || 0).replace('bg-', 'text-')}`}>
                {result.class || (result.probability >= 0.7 ? "Critical" : result.probability >= 0.4 ? "Moderate" : "Low Risk")}
              </span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default DiseasePredictionForm;
