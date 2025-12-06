// src/pages/CropRecommendation.jsx
import React, { useState, useEffect } from "react";
import CropRecommendationForm from "../components/CropRecommendationForm";
import { fetchFieldSimulation } from "../api/analyticsAPI";
import { fetchCropHistory } from "../api/cropAPI";

const CropRecommendation = () => {
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [autoFilledData, setAutoFilledData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const res = await fetchFieldSimulation();
        if (res.data && res.data.fields) {
          setFields(res.data.fields);
        }
      } catch (e) {
        console.error("Error loading fields", e);
      } finally {
        setLoading(false);
      }
    };
    loadFields();
  }, []);

  const loadHistory = () => {
    fetchCropHistory()
      .then(data => setHistory(data || []))
      .catch(err => console.error("Failed to load history", err));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFieldChange = (e) => {
    const fid = e.target.value;
    setSelectedFieldId(fid);

    if (fid) {
      const field = fields.find(f => String(f.fieldId || f.field_id) === fid);
      if (field) {
        const calcAvg = (key) => {
           if (!field.plants || !field.plants.length) return 0;
           const sum = field.plants.reduce((acc, p) => acc + (Number(p.agro?.[key]) || 0), 0);
           return sum / field.plants.length;
        };

        setAutoFilledData({
          nitrogen: field.nitrogen || field.soil_n || calcAvg('Soil_N'),
          phosphorus: field.phosphorus || field.soil_p || calcAvg('Soil_P'),
          potassium: field.potassium || field.soil_k || calcAvg('Soil_K'),
          ph: field.ph || field.soil_ph || calcAvg('Soil_pH') || 6.5,
          rainfall: field.rainfall || 200,
          temperature: field.temperature || 25,
          moisture: field.moisture || 50
        });
      }
    } else {
      setAutoFilledData(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Crop Recommendation</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Select a field to auto-analyze its soil & weather conditions for the best crop advice.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Field Selector */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Analyze Active Field
            </label>
            <div className="flex gap-4">
              <select
                value={selectedFieldId}
                onChange={handleFieldChange}
                className="flex-1 w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={loading}
              >
                <option value="">-- Select a Field --</option>
                {fields.map((f, idx) => {
                  const id = f.fieldId || f.field_id || idx;
                  const health = f.avgHealth || f.avg_health || 0;
                  return (
                    <option key={id} value={id}>
                      Field {id} (Health: {(health * 100).toFixed(0)}%)
                    </option>
                  );
                })}
              </select>
              {selectedFieldId && (
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium animate-fade-in">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Data Loaded
                </div>
              )}
            </div>
          </div>

          {/* The Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
             <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
               <h2 className="text-lg font-bold text-white flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                 Recommendation Engine
               </h2>
             </div>
             <div className="p-6">
               <CropRecommendationForm autoFilledData={autoFilledData} fieldId={selectedFieldId} onSuccess={loadHistory} />
             </div>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-1">
           <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Recent
                </h3>
                <a href="/recommendations/crop/history" className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 hover:underline">
                  View All
                </a>
              </div>
              
              <div className="space-y-4">
                {history.length > 0 ? (
                   history.slice(0, 5).map((item, i) => {
                     const name = item.cropName || item.recommendedCrop || item.crop || "Unknown";
                     const time = item.predictionDate || item.predictionTime || Date.now();
                     
                     return (
                       <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 transition-colors group">
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                            {name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                              {name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                               <span className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                  Field {item.fieldId}
                               </span>
                               <span>
                                  {new Date(time).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'numeric', minute:'numeric'})}
                               </span>
                            </div>
                          </div>
                       </div>
                     );
                   })
                ) : (
                   <div className="text-center py-8 text-gray-400">
                      No recommendation history available.
                   </div>
                )}
              </div>
              
              {history.length > 5 && (
                <div className="mt-6 text-center">
                  <a href="/recommendations/crop/history" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium">
                     + {history.length - 5} older records
                  </a>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;
