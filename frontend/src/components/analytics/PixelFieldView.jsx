import React, { useState } from "react";
import NotificationBell from "./NotificationBell";
import FieldAlerts from "./FieldAlerts";
import PlantDetailPopup from "./PlantDetailPopup";
import { getNdviColor } from "../utils/color";
import { adjustField } from "../../api/analyticsAPI";
import { useAlerts } from "../../context/AlertsContext";

export default function PixelFieldView({ field, onAdjust, onClose }) {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { alertsMap } = useAlerts();
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  if (!field) {
    return (
      <div className="text-gray-500 text-center py-20 text-sm">
        No field selected
      </div>
    );
  }

  const fieldAlerts = alertsMap[String(field?.fieldId || field?.field_id)] || {};
  const alertCount = Object.keys(fieldAlerts).length;

  const onPixelClick = (plant) => setSelectedPlant(plant);

  const handleFix = async () => {
    const id = field.fieldId || field.field_id;
    if (onAdjust) await onAdjust(id);
    else await adjustField(id);
    setAlertsOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm">
      {/* Field Header - Apple Style */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200/60 px-8 py-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Field {field.fieldId || field.field_id}
              </h2>
              <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-white rounded-full border border-gray-200">
                {field.crop || field.cropType || field.crop_type || "Crop"}
              </span>
            </div>
            
            {/* Stats Row - Clean Apple Style */}
            <div className="flex gap-6 mt-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 mb-1">Average NDVI</span>
                <span className="text-lg font-semibold text-green-600">{safeNum(field.avgNdvi || field.avg_ndvi).toFixed(3)}</span>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 mb-1">Health Score</span>
                <span className="text-lg font-semibold text-green-600">{(safeNum(field.avgHealth || field.avg_health) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 mb-1">Avg Yield</span>
                <span className="text-lg font-semibold text-green-600">{safeNum(field.avgYield || field.avg_yield).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationBell 
              fieldId={field.fieldId || field.field_id} 
              onClick={() => setAlertsOpen(!alertsOpen)} 
            />
            <button 
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 py-8">
        {/* Pixel Grid - Apple Minimalist Style */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 tracking-tight">Field Visualization</h3>
          <div className="inline-block bg-gray-50 rounded-xl p-6 border border-gray-200/60">
            <div className="grid grid-cols-10 gap-1.5 w-[500px] h-[500px]">
              {(field.plants || []).map((p, i) => {
                const ndvi = p.ndvi ?? 0;
                const color = getNdviColor(ndvi);
                return (
                  <div
                    key={i}
                    className="w-full h-full rounded-md cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 hover:shadow-lg hover:ring-2 hover:ring-gray-300"
                    style={{ backgroundColor: color }}
                    onClick={() => onPixelClick(p)}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Legend - Updated with new colors */}
          <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
            <span className="font-medium">Health Indicator:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2ecc71' }}></div>
              <span>Healthy {'>'} 0.7</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f1c40f' }}></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e67e22' }}></div>
              <span>Unhealthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e74c3c' }}></div>
              <span>Critical {'<'} 0.2</span>
            </div>
          </div>
        </div>

        {/* Alerts Section - Clean Apple Card */}
        {alertsOpen && alertCount > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Active Alerts</h3>
              <span className="text-xs font-medium text-green-600 px-2.5 py-1 bg-white rounded-full border border-green-200">
                {alertCount} Alert{alertCount !== 1 ? 's' : ''}
              </span>
            </div>
            <FieldAlerts field={field} />
            <button
              onClick={handleFix}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all"
            >
              Apply Recommendations
            </button>
          </div>
        )}

        {alertsOpen && alertCount === 0 && (
          <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200/60">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">All Clear</p>
            <p className="text-xs text-gray-500">No alerts for this field</p>
          </div>
        )}
      </div>

      {/* Plant Detail Popup */}
      {selectedPlant && (
        <PlantDetailPopup 
          plant={selectedPlant} 
          onClose={() => setSelectedPlant(null)} 
        />
      )}
    </div>
  );
}