import React from "react";
import { useAlerts } from "../../context/AlertsContext";
import { adjustField, clearAlerts } from "../../api/analyticsAPI";

export default function LiveAlerts({ fieldId }) {
  const { alertsMap, clearFieldAlertsLocal } = useAlerts();
  // Using 'entries' as defined in the second block
  const entries = alertsMap[String(fieldId)] ? Object.entries(alertsMap[String(fieldId)]) : [];

  const handleFix = async () => {
    try {
      await adjustField(fieldId);
      await clearAlerts(fieldId);
      clearFieldAlertsLocal(fieldId);
    } catch (err) {
      console.error("Fix failed", err);
    }
  };

  if (!entries.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
      {/* Header Section */}
      <div className="mb-6">
        <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider rounded-full mb-3">
          Active Alerts
        </div>
        <h3 className="text-2xl font-bold text-gray-900">
          Field {fieldId}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {entries.length} {entries.length === 1 ? 'issue' : 'issues'} requiring attention
        </p>
      </div>
      
      {/* Alerts List */}
      <div className="space-y-3 mb-6">
        {entries.map(([type, data]) => {
          // Conditional Styling Logic
          const bgColor = data.level === 'critical' 
            ? 'bg-gradient-to-br from-red-50 to-white' 
            : data.level === 'warning' 
            ? 'bg-gradient-to-br from-yellow-50 to-white' 
            : 'bg-gradient-to-br from-blue-50 to-white';
          
          const borderColor = data.level === 'critical' 
            ? 'border-red-200 hover:border-red-400' 
            : data.level === 'warning' 
            ? 'border-yellow-200 hover:border-yellow-400' 
            : 'border-blue-200 hover:border-blue-400';
          
          const dotColor = data.level === 'critical' 
            ? 'bg-red-500' 
            : data.level === 'warning' 
            ? 'bg-yellow-500' 
            : 'bg-blue-500';
          
          const textColor = data.level === 'critical' 
            ? 'text-red-700' 
            : data.level === 'warning' 
            ? 'text-yellow-700' 
            : 'text-blue-700';
          
          return (
            <div 
              key={type} 
              className={`${bgColor} border ${borderColor} p-5 rounded-2xl transition-all duration-300 hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                {/* Status Indicator */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-3 h-3 ${dotColor} rounded-full`}></div>
                </div>
                
                {/* Alert Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-base font-semibold ${textColor}`}>
                      {type}
                    </span>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {data.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {data.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Action Button */}
      <button 
        onClick={handleFix}
        className="w-full bg-green-600 text-white font-semibold py-4 px-6 rounded-full transition-all duration-300 hover:bg-green-700 hover:scale-105 hover:shadow-xl text-base"
      >
        Apply Automated Fix
      </button>
    </div>
  );
}