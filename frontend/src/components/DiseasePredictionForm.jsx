// src/components/DiseasePredictionForm.jsx
import React, { useState, useEffect } from "react";
import { detectDisease } from "../api/diseaseAPI";

/**
 * Form to predict disease probability from Python ML Engine via Spring Boot
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
      
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error(err);
      setError("Failed to predict disease. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400";

  const getRiskColor = (prob) => {
    if (prob >= 0.7) return "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
    if (prob >= 0.4) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
    return "text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NDVI</label>
          <input type="number" step="0.01" name="ndvi" value={formData.ndvi} onChange={handleChange} className={inputClass} placeholder="0.0-1.0" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperature (°C)</label>
          <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} className={inputClass} placeholder="10-45" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Soil Moisture (%)</label>
          <input type="number" step="0.1" name="moisture" value={formData.moisture} onChange={handleChange} className={inputClass} placeholder="20-80" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nitrogen</label>
          <input type="number" name="nitrogen" value={formData.nitrogen} onChange={handleChange} className={inputClass} placeholder="0-140" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phosphorus</label>
          <input type="number" name="phosphorus" value={formData.phosphorus} onChange={handleChange} className={inputClass} placeholder="5-145" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Potassium</label>
          <input type="number" name="potassium" value={formData.potassium} onChange={handleChange} className={inputClass} placeholder="5-205" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Irrigation Level</label>
        <input type="number" step="0.1" name="irrigation" value={formData.irrigation} onChange={handleChange} className={inputClass} placeholder="0-100" required />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Analyzing Condition...
          </span>
        ) : "Predict Disease Risk"}
      </button>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className={`p-6 rounded-2xl border animate-fade-in ${getRiskColor(result.probability || 0)}`}>
          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-4 pb-3 border-b border-black/5 dark:border-white/10">Disease Analysis</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Predicted Disease:</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">{result.disease || "Unknown"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Probable Risk:</span>
              <span className="font-bold text-2xl">{((result.probability || 0) * 100).toFixed(1)}%</span>
            </div>
            
            {/* Risk Bar */}
            <div className="pt-2">
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    result.probability >= 0.7 ? 'bg-red-500' :
                    result.probability >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(result.probability || 0) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/10">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                result.probability >= 0.7 ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' :
                result.probability >= 0.4 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' :
                'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
              }`}>
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
