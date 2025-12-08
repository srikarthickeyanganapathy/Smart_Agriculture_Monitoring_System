// src/components/CropRecommendationForm.jsx
import React, { useState, useEffect } from "react";
import { recommendCrop } from "../api/cropAPI";

/**
 * Form to request crop recommendation from .NET ML Service via Spring Boot
 */
const CropRecommendationForm = ({ autoFilledData, fieldId, onSuccess }) => {
  const [formData, setFormData] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
    rainfall: "",
    temperature: "",
    moisture: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (autoFilledData) {
      setFormData({
        nitrogen: autoFilledData.nitrogen || "",
        phosphorus: autoFilledData.phosphorus || "",
        potassium: autoFilledData.potassium || "",
        ph: autoFilledData.ph || "",
        rainfall: autoFilledData.rainfall || "",
        temperature: autoFilledData.temperature || "",
        moisture: autoFilledData.moisture || ""
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
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
        ph: parseFloat(formData.ph),
        rainfall: parseFloat(formData.rainfall),
        temperature: parseFloat(formData.temperature),
        moisture: parseFloat(formData.moisture)
      };
      
      const data = await recommendCrop(payload);
      setResult(data);
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to get recommendation. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Parse result to handle different backend response formats
  const parseResult = (data) => {
    if (!data) return null;
    
    // If it's already an array of crops with scores
    if (Array.isArray(data)) {
      return { type: 'array', crops: data };
    }
    
    // If it's an object with recommendedCrop or crop field (single recommendation)
    if (data.recommendedCrop || data.crop) {
      return {
        type: 'single',
        crop: data.recommendedCrop || data.crop,
        confidence: data.confidence || data.score || 0.95
      };
    }
    
    // If it has predictions or recommendations array
    if (data.predictions || data.recommendations) {
      return { type: 'array', crops: data.predictions || data.recommendations };
    }
    
    // If it's a simple string
    if (typeof data === 'string') {
      return { type: 'single', crop: data, confidence: 1 };
    }
    
    // Fallback - try to extract meaningful info
    return { type: 'object', data };
  };

  const inputClass = "w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400";

  const parsedResult = parseResult(result);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nitrogen (N)</label>
          <input type="number" name="nitrogen" value={formData.nitrogen} onChange={handleChange} className={inputClass} placeholder="0-140" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phosphorus (P)</label>
          <input type="number" name="phosphorus" value={formData.phosphorus} onChange={handleChange} className={inputClass} placeholder="5-145" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Potassium (K)</label>
          <input type="number" name="potassium" value={formData.potassium} onChange={handleChange} className={inputClass} placeholder="5-205" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">pH Level</label>
          <input type="number" step="0.1" name="ph" value={formData.ph} onChange={handleChange} className={inputClass} placeholder="3.5-9.5" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rainfall (mm)</label>
          <input type="number" name="rainfall" value={formData.rainfall} onChange={handleChange} className={inputClass} placeholder="20-300" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperature (°C)</label>
          <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} className={inputClass} placeholder="8-44" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Soil Moisture (%)</label>
        <input type="number" step="0.1" name="moisture" value={formData.moisture} onChange={handleChange} className={inputClass} placeholder="14-95" required />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Analyzing Field Data...
          </span>
        ) : "Get Crop Recommendation"}
      </button>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Result Display - Clean Professional Look */}
      {parsedResult && (
        <div className="p-6 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 border border-green-200 dark:border-green-800 rounded-2xl animate-fade-in">
          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-4 pb-3 border-b border-green-100 dark:border-green-800">
            AI Recommendation
          </h4>
          
          {parsedResult.type === 'single' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Recommended Crop</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{parsedResult.crop}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-green-600">{(parsedResult.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${parsedResult.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {parsedResult.type === 'array' && (
            <div className="space-y-2">
              {parsedResult.crops.map((item, idx) => {
                const cropName = item.crop || item.name || item.recommendedCrop || `Crop ${idx + 1}`;
                const score = item.score || item.confidence || item.probability || 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-green-600 text-white' :
                        idx === 1 ? 'bg-green-500 text-white' :
                        idx === 2 ? 'bg-green-400 text-white' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white capitalize">{cropName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${score * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-green-600 font-bold text-sm w-14 text-right">{(score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {parsedResult.type === 'object' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-48 font-mono">
                {JSON.stringify(parsedResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </form>
  );
};

export default CropRecommendationForm;
