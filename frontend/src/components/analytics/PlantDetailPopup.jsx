import React from "react";

export default function PlantDetailPopup({ plant, onClose }) {
  if (!plant) return null;

  const agro = plant.agro || {};
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white text-gray-900 rounded-3xl w-[90%] max-w-[900px] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Header */}
        <div className="relative px-12 pt-16 pb-12 text-center">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
          >
            <span className="text-xl">×</span>
          </button>
          
          <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
            Plant Analysis
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            Plant {plant.plant_id}
          </h1>
          
          <p className="text-xl text-gray-500 font-light">
            Comprehensive health and performance metrics
          </p>
        </div>

        {/* Featured Stats - Large Cards */}
        <div className="px-12 pb-12">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-2">NDVI</div>
              <div className="text-4xl font-semibold text-gray-900">{(plant.ndvi ?? 0).toFixed(3)}</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-2">Yield</div>
              <div className="text-4xl font-semibold text-gray-900">{((plant.yield ?? 0)).toFixed(2)}</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-2">Health</div>
              <div className="text-4xl font-semibold text-green-600">{((plant.health ?? 0)*100).toFixed(1)}%</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-2">Disease Risk</div>
              <div className="text-4xl font-semibold text-gray-900">{((plant.disease_prob ?? 0)).toFixed(3)}</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-12"></div>

        {/* Agronomy Section - Apple Style List */}
        <div className="px-12 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Agronomy Data
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            Detailed soil composition and environmental factors
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-md transition-all">
              <span className="text-base font-medium text-gray-900">Soil Nitrogen</span>
              <span className="text-base font-semibold text-green-600">{agro.Soil_N ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-md transition-all">
              <span className="text-base font-medium text-gray-900">Soil Phosphorus</span>
              <span className="text-base font-semibold text-green-600">{agro.Soil_P ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-md transition-all">
              <span className="text-base font-medium text-gray-900">Soil Potassium</span>
              <span className="text-base font-semibold text-green-600">{agro.Soil_K ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-md transition-all">
              <span className="text-base font-medium text-gray-900">pH Level</span>
              <span className="text-base font-semibold text-green-600">{agro.Soil_pH ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-md transition-all">
              <span className="text-base font-medium text-gray-900">Irrigation Level</span>
              <span className="text-base font-semibold text-green-600">{agro.Irrigation ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-md transition-all">
              <span className="text-base font-medium text-gray-900">Soil Moisture</span>
              <span className="text-base font-semibold text-green-600">{agro.SoilMoisture ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-md transition-all">
              <span className="text-base font-medium text-gray-900">Temperature</span>
              <span className="text-base font-semibold text-green-600">{agro.Temperature ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-md transition-all">
              <span className="text-base font-medium text-gray-900">Fertilizer Type</span>
              <span className="text-base font-semibold text-green-600">{agro.Fertilizer ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Footer with CTA */}
        <div className="px-12 py-8 bg-gray-50 rounded-b-3xl">
          <div className="flex justify-center">
            <button 
              onClick={onClose}
              className="px-8 py-3.5 bg-green-600 text-white text-base font-semibold rounded-full hover:bg-green-700 transition-all hover:scale-105 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}