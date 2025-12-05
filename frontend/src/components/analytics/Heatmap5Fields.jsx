import React from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { rainbowColor } from "../utils/color.js";

export default function Heatmap5Fields({ fields }) {
  const navigate = useNavigate();
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  if (!fields || fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-6"></div>
        <p className="text-lg text-gray-600 font-medium">Loading field data...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we fetch your fields</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 py-8">
      {fields.map((field, idx) => {
        const plantsPreview = field.plants ? field.plants.slice(0, 100) : [];
        
        return (
          <div 
            key={field.fieldId || field.field_id || idx} 
            className="bg-white border border-gray-200 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group"
          >
            {/* Header Section */}
            <div className="p-6 pb-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider rounded-full mb-3">
                    {field.cropType || field.crop_type || "Crop"}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    Field {field.fieldId || field.field_id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {field.plants ? field.plants.length : 0} plants monitored
                  </p>
                </div>

                <NotificationBell fieldId={field.fieldId || field.field_id} />
              </div>

              <button 
                onClick={() => navigate(`/field/${field.fieldId || field.field_id}`)}
                className="w-full bg-green-600 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:bg-green-700 hover:scale-105 flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg"
              >
                <span>View Details</span>
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>

            {/* Pixel Preview Grid */}
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-10 gap-1 bg-white p-4 rounded-2xl shadow-inner border border-gray-200">
                {plantsPreview.map((p, idx) => {
                  const ndvi = p.ndvi ?? 0;
                  const color = rainbowColor(ndvi, -1, 1);
                  return (
                    <div 
                      key={idx} 
                      className="aspect-square rounded-md cursor-pointer transition-all duration-200 hover:scale-125 hover:z-10 hover:shadow-lg hover:rounded-lg"
                      style={{ backgroundColor: color }}
                      title={`NDVI: ${ndvi.toFixed(3)}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Field Stats */}
            <div className="grid grid-cols-3 gap-0 border-t border-gray-200">
              <div className="text-center p-5 border-r border-gray-200 transition-all duration-200 hover:bg-gray-50">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  NDVI
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {safeNum(field.avgNdvi || field.avg_ndvi).toFixed(3)}
                </div>
              </div>
              <div className="text-center p-5 border-r border-gray-200 transition-all duration-200 hover:bg-gray-50">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Health
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {(safeNum(field.avgHealth || field.avg_health) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center p-5 transition-all duration-200 hover:bg-gray-50">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Yield
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {safeNum(field.avgYield || field.avg_yield).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}