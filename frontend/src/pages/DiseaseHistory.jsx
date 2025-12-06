import React, { useState, useEffect } from "react";
import { fetchDiseaseHistory } from "../api/diseaseAPI";
import { useNavigate } from "react-router-dom";

const DiseaseHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiseaseHistory()
      .then(data => {
        setHistory(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load history", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Disease Risk History</h1>
            <p className="text-gray-500">
              Complete log of all AI-driven disease risk assessments.
            </p>
          </div>
          <button 
            onClick={() => navigate("/recommendations/disease")}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Predictions
          </button>
        </div>

        {loading ? (
           <div className="flex justify-center py-20">
             <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.length > 0 ? (
              history.map((item, i) => {
                const name = item.disease || item.diseaseName || "Unknown";
                const time = item.predictionTime || item.predictionDate || Date.now();
                const isHealthy = name.toLowerCase().includes("healthy");
                const colorClass = isHealthy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
                
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-16 h-16 rounded-full ${colorClass} flex items-center justify-center font-bold text-2xl shadow-inner`}>
                        {name.substring(0,2).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                         Field {item.fieldId} {item.plantId ? `(P${item.plantId})` : ''}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
                    <p className={`text-sm font-semibold mb-3 ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                      {isHealthy ? "No Action Needed" : "Attention Required"}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                       {/* Display environmental parameters if available/relevant */}
                         <div className="flex justify-between border-b border-gray-100 pb-1">
                           <span>Temperature:</span> <span className="font-medium">{item.temperature || '-'}°C</span>
                         </div>
                         <div className="flex justify-between border-b border-gray-100 pb-1">
                           <span>Humidity/Moisture:</span> <span className="font-medium">{item.humidity || item.moisture || '-'}%</span>
                         </div>
                    </div>

                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 flex items-center gap-1">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       {new Date(time).toLocaleString()}
                    </div>
                  </div>
                );
              })
            ) : (
               <div className="col-span-full text-center py-20 text-gray-500">
                 No history found.
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseHistory;
