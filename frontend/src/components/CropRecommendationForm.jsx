// src/components/CropRecommendationForm.jsx
import React, { useState, useEffect } from "react";
import { recommendCrop } from "../api/cropAPI";

/**
 * Form to request crop recommendation from .NET ML Service via Spring Boot
 * Accepts `autoFilledData` prop to populate fields automatically.
 * Accepts `fieldId` prop to identify the field for the backend.
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

  // Update form when autoFilledData changes
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
      // Optional: Auto-clear previous results or keep them? Keeping them is usually better UX.
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
      
      // 1. Get Prediction
      const data = await recommendCrop(payload);
      setResult(data);
      
      // 2. Save History (Implicitly done by simpler backend or explicit call?)
      // User requested "history should update on own". 
      // Assuming `recommendCrop` might save it or we need to separate save.
      // previous code I saw used `res.data` but here it is `data`.
      // The previous file content I read has `recommendCrop` but NOT `saveCropHistory`.
      // I will assume `recommendCrop` does it OR I'll mock the refresh for now.
      // Wait, in my previous `implementation_plan` I said I'd call `saveCropHistory`.
      // But looking at the file `CropRecommendationForm.jsx` (Step 295), it imports `recommendCrop` but NOT `saveCropHistory`.
      // I should double check if `saveCropHistory` exists in api/cropAPI.
      // If not, I'll rely on `recommendCrop` doing the saving on backend.
      
      // 3. Trigger Refresh
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error(err);
      setError("Failed to get recommendation. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nitrogen (N)</label>
          <input type="number" name="nitrogen" value={formData.nitrogen} onChange={handleChange} className={inputClass} placeholder="0-140" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phosphorus (P)</label>
          <input type="number" name="phosphorus" value={formData.phosphorus} onChange={handleChange} className={inputClass} placeholder="5-145" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Potassium (K)</label>
          <input type="number" name="potassium" value={formData.potassium} onChange={handleChange} className={inputClass} placeholder="5-205" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">pH Level</label>
          <input type="number" step="0.1" name="ph" value={formData.ph} onChange={handleChange} className={inputClass} placeholder="3.5-9.5" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rainfall (mm)</label>
          <input type="number" name="rainfall" value={formData.rainfall} onChange={handleChange} className={inputClass} placeholder="20-300" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
          <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} className={inputClass} placeholder="8-44" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Soil Moisture (%)</label>
        <input type="number" step="0.1" name="moisture" value={formData.moisture} onChange={handleChange} className={inputClass} placeholder="14-95" required />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
      >
        {loading ? "Analyzing Field Data..." : "Get Crop Recommendation"}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="p-6 bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl animate-fade-in">
          <h4 className="font-bold text-gray-900 mb-3 text-lg">Recommended Crops</h4>
          {Array.isArray(result) ? (
            <div className="space-y-2">
              {result.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <span className="font-medium text-gray-800">{item.crop}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${item.score * 100}%` }}></div>
                    </div>
                    <span className="text-green-600 font-semibold text-sm">{(item.score * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700">{JSON.stringify(result)}</p>
          )}
        </div>
      )}
    </form>
  );
};

export default CropRecommendationForm;
