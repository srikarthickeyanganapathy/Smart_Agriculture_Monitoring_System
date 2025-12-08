import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { getNdviColor } from "../utils/color.js";

const Heatmap5Fields = memo(({ fields }) => {
  const navigate = useNavigate();
  
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  if (!fields || fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 font-medium">Loading field data...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we fetch your fields</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {fields.map((field, idx) => {
        const plantsPreview = field.plants ? field.plants.slice(0, 100) : [];
        const avgNdvi = safeNum(field.avgNdvi || field.avg_ndvi);
        const avgHealth = safeNum(field.avgHealth || field.avg_health);
        
        const healthColor = avgHealth >= 0.8 ? 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700' 
          : avgHealth >= 0.5 ? 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700'
          : 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700';
        
        return (
          <div 
            key={field.fieldId || field.field_id || idx} 
            className={`group bg-white dark:bg-gray-900 border-2 ${healthColor} rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-gray-950/50 card-hover`}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold uppercase tracking-wider rounded-lg mb-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    {field.crop || field.cropType || field.crop_type || "Crop"}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Field {field.fieldId || field.field_id}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {field.plants ? field.plants.length : 0} plants monitored
                  </p>
                </div>
                <NotificationBell fieldId={field.fieldId || field.field_id} />
              </div>

              <button 
                onClick={() => navigate(`/field/${field.fieldId || field.field_id}`)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 text-sm"
              >
                <span>View Details</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>

            {/* Pixel Grid */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-950/50">
              <div className="grid grid-cols-10 gap-1 bg-white dark:bg-gray-900 p-3 rounded-xl shadow-inner border border-gray-100 dark:border-gray-800">
                {plantsPreview.map((p, idx) => {
                  const ndvi = p.ndvi ?? 0;
                  const color = getNdviColor(ndvi);
                  return (
                    <div 
                      key={idx} 
                      className="aspect-square rounded-sm cursor-pointer transition-all duration-200 hover:scale-150 hover:z-10 hover:shadow-lg hover:rounded"
                      style={{ backgroundColor: color }}
                      title={`NDVI: ${ndvi.toFixed(3)}`}
                    />
                  );
                })}
              </div>
              
              {/* Mini Legend */}
              <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2ecc71' }}></div>
                  <span>Healthy</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f1c40f' }}></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e74c3c' }}></div>
                  <span>Critical</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-0 border-t border-gray-100 dark:border-gray-800">
              <div className="text-center p-4 border-r border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">NDVI</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{avgNdvi.toFixed(3)}</div>
              </div>
              <div className="text-center p-4 border-r border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Health</div>
                <div className={`text-lg font-bold ${avgHealth >= 0.8 ? 'text-green-600' : avgHealth >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {(avgHealth * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Yield</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{safeNum(field.avgYield || field.avg_yield).toFixed(1)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

Heatmap5Fields.displayName = 'Heatmap5Fields';

export default Heatmap5Fields;