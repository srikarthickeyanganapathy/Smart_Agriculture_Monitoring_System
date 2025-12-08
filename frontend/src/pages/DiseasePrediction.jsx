// src/pages/DiseasePrediction.jsx
import React, { useState, useEffect } from "react";
import DiseasePredictionForm from "../components/DiseasePredictionForm";
import { fetchFieldSimulation } from "../api/analyticsAPI";
import { fetchDiseaseHistory } from "../api/diseaseAPI";

const DiseasePrediction = () => {
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [fieldPlants, setFieldPlants] = useState([]);
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
    fetchDiseaseHistory()
      .then(data => setHistory(data || []))
      .catch(err => console.error("Failed to load history", err));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFieldChange = (e) => {
    const fid = e.target.value;
    setSelectedFieldId(fid);
    setSelectedPlantId("");
    setFieldPlants([]);

    if (fid) {
      const field = fields.find(f => String(f.fieldId || f.field_id) === fid);
      if (field) {
        setFieldPlants(field.plants || []);
        setAutoFilledData({
          ndvi: field.avg_ndvi || 0.65,
          temperature: field.temperature || 0,
          moisture: field.moisture || 0,
          nitrogen: field.nitrogen || 0,
          phosphorus: field.phosphorus || 0,
          potassium: field.potassium || 0,
          irrigation: field.irrigation || 50
        });
      }
    } else {
      setAutoFilledData(null);
    }
  };

  const handlePlantChange = (e) => {
    const pid = e.target.value;
    setSelectedPlantId(pid);
    
    if (pid && fieldPlants.length > 0) {
      const plant = fieldPlants.find(p => String(p.plantId || p.plant_id) === pid);
      if (plant) {
        setAutoFilledData({
          ndvi: plant.ndvi || plant.agro?.ndvi || 0.65,
          temperature: plant.agro?.temperature || autoFilledData?.temperature || 25,
          moisture: plant.agro?.moisture || autoFilledData?.moisture || 50,
          nitrogen: plant.agro?.nitrogen || plant.agro?.Soil_N || 0,
          phosphorus: plant.agro?.phosphorus || plant.agro?.Soil_P || 0,
          potassium: plant.agro?.potassium || plant.agro?.Soil_K || 0,
          irrigation: plant.agro?.irrigation || 50
        });
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Disease Risk Analysis</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Select a field and optionally a plant for precise disease risk prediction using our ML model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Field Selector */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
             <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
               Select Field for Risk Analysis
             </label>
             <div className="flex gap-4">
               <select
                 value={selectedFieldId}
                 onChange={handleFieldChange}
                 className="flex-1 w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                 disabled={loading}
               >
                 <option value="">-- Select a Field --</option>
                 {fields.map((f, idx) => {
                   const id = f.fieldId || f.field_id || idx;
                   const ndvi = f.avgNdvi || f.avg_ndvi || 0;
                   return (
                     <option key={id} value={id}>
                       Field {id} (NDVI: {Number(ndvi).toFixed(3)})
                     </option>
                   );
                 })}
               </select>
               {selectedFieldId && (
                 <div className="flex items-center text-red-600 dark:text-red-400 text-sm font-medium animate-fade-in">
                   <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                   Risks Loaded
                 </div>
               )}
             </div>

             {/* Plant Selector */}
             {selectedFieldId && (
               <div className="mt-4 animate-fade-in">
                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                   Select Specific Plant
                 </label>
                 <select
                   value={selectedPlantId}
                   onChange={handlePlantChange}
                   className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                 >
                   <option value="">-- Analyze Field Average --</option>
                   {fieldPlants.map((p, idx) => {
                      const pid = p.plantId || p.plant_id || idx;
                      const ndvi = p.ndvi || (p.agro ? p.agro.ndvi : 0) || 0;
                      return (
                        <option key={idx} value={pid}>
                          Plant {pid} (NDVI: {Number(ndvi).toFixed(3)})
                        </option>
                      );
                   })}
                 </select>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                   *Selecting a plant improves prediction accuracy by using specific plant metrics.
                 </p>
               </div>
             )}
          </div>

          {/* The Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
             <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  Disease AI Model
                </h2>
             </div>
             <div className="p-6">
               <DiseasePredictionForm 
                  autoFilledData={autoFilledData} 
                  fieldId={selectedFieldId} 
                  plantId={selectedPlantId} 
                  onSuccess={loadHistory}
               />
             </div>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-1">
           <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Recent Risks
                </h3>
                <a href="/recommendations/disease/history" className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 hover:underline">
                  View All
                </a>
              </div>

              <div className="space-y-4">
                {history.length > 0 ? (
                   history.slice(0, 5).map((item, i) => {
                     const name = item.disease || item.diseaseName || "Unknown";
                     const time = item.predictionTime || item.predictionDate || Date.now();
                     
                     const isHealthy = name.toLowerCase().includes("healthy");
                     const colorClass = isHealthy 
                       ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400" 
                       : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400";
                     const borderClass = isHealthy 
                       ? "border-green-100 dark:border-green-800 hover:border-green-200 dark:hover:border-green-700" 
                       : "border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700";

                     return (
                       <div key={i} className={`flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border ${borderClass} transition-colors group`}>
                          <div className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform`}>
                            {name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                              {name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                               <span className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                  Field {item.fieldId} {item.plantId ? `(P${item.plantId})` : ''}
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
                      No risk history available.
                   </div>
                )}
              </div>
              
              {history.length > 5 && (
                <div className="mt-6 text-center">
                  <a href="/recommendations/disease/history" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium">
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

export default DiseasePrediction;
