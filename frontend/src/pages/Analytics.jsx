import React, { useEffect, useState, useMemo, memo } from "react";
import { startSimulation, fetchFieldSimulation } from "../api/analyticsAPI";
import Heatmap5Fields from "../components/analytics/Heatmap5Fields";
import LiveAlerts from "../components/analytics/LiveAlerts";

// Memoized stat card for performance
const StatCard = memo(({ icon, label, value, trend, trendUp }) => (
  <div className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-xl hover:shadow-green-500/5 hover:border-green-200/50 dark:hover:border-green-800/50 transition-all duration-300 card-hover overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 to-green-50/50 dark:from-green-900/0 dark:to-green-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 text-green-600 dark:text-green-400">
        {icon}
      </div>
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </h3>
      <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
        {value}
      </div>
      {trend && (
        <p className={`text-xs font-medium flex items-center gap-1 ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
          {trendUp && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          {trend}
        </p>
      )}
    </div>
  </div>
));

const Analytics = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchFieldSimulation();
        if (res.data && res.data.fields) {
          setFields(res.data.fields);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching fields:", error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const { totalFields, avgNDVI, avgHealth, avgYield } = useMemo(() => {
    const safeNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const total = fields.length;
    const ndvi = total > 0 
      ? (fields.reduce((sum, f) => sum + safeNum(f.avgNdvi || f.avg_ndvi), 0) / total).toFixed(3)
      : "0.000";
    const health = total > 0
      ? (fields.reduce((sum, f) => sum + safeNum(f.avgHealth || f.avg_health), 0) / total * 100).toFixed(1)
      : "0.0";
    const yld = total > 0
      ? (fields.reduce((sum, f) => sum + safeNum(f.avgYield || f.avg_yield), 0) / total).toFixed(2)
      : "0.00";

    return { totalFields: total, avgNDVI: ndvi, avgHealth: health, avgYield: yld };
  }, [fields]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
        </div>
        <div className="mt-8 text-lg text-gray-600 dark:text-gray-300 font-medium">Initializing Digital Twin</div>
        <div className="mt-2 text-sm text-gray-400">Connecting to field sensors...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-green-700 dark:text-green-400 font-medium">Live Monitoring Active</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          Field Analytics
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Real-time monitoring and AI-powered insights for your agricultural operations
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
        <StatCard
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          label="Active Fields"
          value={totalFields}
          trend="All monitored"
          trendUp={true}
        />
        <StatCard
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
          label="Average NDVI"
          value={avgNDVI}
          trend="+0.042 vs last week"
          trendUp={true}
        />
        <StatCard
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Crop Health"
          value={`${avgHealth}%`}
          trend="Optimal condition"
          trendUp={true}
        />
        <StatCard
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          label="Average Yield"
          value={avgYield}
          trend="+2.3% increase"
          trendUp={true}
        />
      </div>

      {/* Field Map Section */}
      <div className="mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 sm:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Digital Twin Field Map
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Live visualization • Updated every 5 seconds
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Real-time
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-[400px]">
            <Heatmap5Fields fields={fields} />
          </div>
        </div>
      </div>

      {/* Field Simulation Status */}
      <div className="mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 sm:px-8 py-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Field Simulation Status
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Crop growth stages and harvest predictions
                </p>
              </div>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Simulation
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {fields.map((field, idx) => {
                const growthStage = field.growth_stage || field.growthStage || 'seedling';
                const maturity = field.maturity_pct || field.maturityPct || 0;
                const daysToHarvest = field.days_to_harvest || field.daysToHarvest || 120;
                const cropType = field.crop_type || field.cropType || 'corn';
                const day = field.day || 0;
                
                const stageColors = {
                  seedling: 'from-yellow-400 to-yellow-500',
                  vegetative: 'from-green-400 to-green-500',
                  flowering: 'from-pink-400 to-pink-500',
                  maturation: 'from-orange-400 to-orange-500',
                  harvest_ready: 'from-amber-400 to-amber-500'
                };
                
                const stageIcons = {
                  seedling: '🌱',
                  vegetative: '🌿',
                  flowering: '🌸',
                  maturation: '🌾',
                  harvest_ready: '✂️'
                };

                return (
                  <div 
                    key={field.fieldId || field.field_id || idx}
                    className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Field Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stageColors[growthStage] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-lg`}>
                          {stageIcons[growthStage] || '🌱'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            Field {field.fieldId || field.field_id || idx + 1}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {cropType}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                        Day {day}
                      </span>
                    </div>

                    {/* Growth Stage */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {growthStage.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {maturity.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${stageColors[growthStage] || 'from-gray-400 to-gray-500'} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, maturity)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Days to Harvest</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{daysToHarvest}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NDVI</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {(field.avgNdvi || field.avg_ndvi || 0).toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {fields.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No field data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Alerts Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Real-time Alerts
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Instant notifications from sensors
                </p>
              </div>
              <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                Live
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-6 max-h-[400px] overflow-y-auto no-scrollbar">
            {fields.length > 0 ? (
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <LiveAlerts key={field.fieldId || field.field_id || idx} fieldId={field.fieldId || field.field_id} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">All Clear</div>
                <div className="text-sm text-gray-500">No alerts at this time</div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-green-50 via-white to-white dark:from-green-900/20 dark:via-gray-900 dark:to-gray-900 rounded-3xl border border-green-100/50 dark:border-green-800/50 shadow-lg shadow-green-200/20 dark:shadow-none overflow-hidden">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-green-100/50 dark:border-green-800/50 px-6 py-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  AI Recommendations
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Smart insights powered by ML
                </p>
              </div>
              <a 
                href="/recommendations/crop"
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold text-sm transition-colors flex items-center gap-1"
              >
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-green-500 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Smart Insight</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Weather forecast shows optimal conditions for irrigation in the next 48 hours. Consider scheduling irrigation for Fields 2 and 4 to maximize crop yield efficiency.
                  </p>
                  <a 
                    href="/recommendations/crop"
                    className="mt-4 inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-700 font-semibold text-sm transition-colors"
                  >
                    Get detailed recommendations
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;