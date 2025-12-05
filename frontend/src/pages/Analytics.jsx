import React, { useEffect, useState } from "react";
import { startSimulation, fetchFieldSimulation } from "../api/analyticsAPI";
import Heatmap5Fields from "../components/analytics/Heatmap5Fields";
import LiveAlerts from "../components/analytics/LiveAlerts";

const Analytics = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSimulation();

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
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate aggregate metrics
  const totalFields = fields.length;
  const avgNDVI = fields.length > 0 
    ? (fields.reduce((sum, f) => sum + f.avg_ndvi, 0) / fields.length).toFixed(3)
    : "0.000";
  const avgHealth = fields.length > 0
    ? (fields.reduce((sum, f) => sum + f.avg_health, 0) / fields.length * 100).toFixed(1)
    : "0.0";
  const avgYield = fields.length > 0
    ? (fields.reduce((sum, f) => sum + f.avg_yield, 0) / fields.length).toFixed(2)
    : "0.00";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
        <div className="mt-6 text-lg text-gray-600 font-medium">Initializing Digital Twin</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section with Metrics */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Field Analytics
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Real-time monitoring and insights for your agricultural operations
          </p>
        </div>

        {/* Metrics Cards - Apple Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {/* Metric Card 1 */}
          <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Active Fields
              </h3>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {totalFields}
              </div>
              <p className="text-sm text-green-600 font-medium">
                All monitored
              </p>
            </div>
          </div>

          {/* Metric Card 2 */}
          <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Average NDVI
              </h3>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {avgNDVI}
              </div>
              <p className="text-sm text-green-600 font-medium">
                +0.042 from last week
              </p>
            </div>
          </div>

          {/* Metric Card 3 */}
          <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Crop Health
              </h3>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {avgHealth}%
              </div>
              <p className="text-sm text-green-600 font-medium">
                Optimal condition
              </p>
            </div>
          </div>

          {/* Metric Card 4 */}
          <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Average Yield
              </h3>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {avgYield}
              </div>
              <p className="text-sm text-green-600 font-medium">
                +2.3% increase
              </p>
            </div>
          </div>
        </div>

        {/* Field Map Section - Full Width Apple Style */}
        <div className="mb-16">
          <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 shadow-lg">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Digital Twin Field Map
                  </h2>
                  <p className="text-sm text-gray-500">
                    Live visualization of all monitored fields
                  </p>
                </div>
                <button className="bg-green-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm">
                  Refresh Scan
                </button>
              </div>
            </div>
            <div className="p-8 min-h-[500px] bg-white">
              <Heatmap5Fields fields={fields} />
            </div>
          </div>
        </div>

        {/* Two Column Layout - Alerts & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Alerts Panel */}
          <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 shadow-lg">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Real-time Alerts
                  </h2>
                  <p className="text-sm text-gray-500">
                    Instant notifications from your fields
                  </p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                  Live
                </span>
              </div>
            </div>
            <div className="p-6 max-h-[500px] overflow-y-auto bg-white">
              {fields.length > 0 ? (
                <div className="space-y-3">
                  {fields.map(field => (
                    <LiveAlerts key={field.field_id} fieldId={field.field_id} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <svg className="w-20 h-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-lg font-semibold text-gray-600 mb-2">All Clear</div>
                  <div className="text-sm text-gray-500">No alerts at this time</div>
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-3xl overflow-hidden border border-gray-200 shadow-lg">
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    AI Recommendations
                  </h2>
                  <p className="text-sm text-gray-500">
                    Smart insights powered by machine learning
                  </p>
                </div>
                <button className="text-green-600 hover:text-green-700 font-semibold text-sm transition-colors duration-200 flex items-center gap-1">
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="bg-white rounded-2xl border-l-4 border-green-500 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Smart Insight</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Weather forecast shows optimal conditions for irrigation in the next 48 hours. Consider scheduling irrigation for Fields 2 and 4 to maximize crop yield efficiency.
                    </p>
                    <button 
                      onClick={() => window.location.href = '/recommendations/crop'}
                      className="mt-4 text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                    >
                      Learn more
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
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