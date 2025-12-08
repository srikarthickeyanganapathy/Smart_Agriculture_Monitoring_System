// src/pages/FieldComparison.jsx
import React, { useState, useEffect, useMemo } from "react";
import { fetchFieldSimulation } from "../api/analyticsAPI";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";

const FieldComparison = () => {
  const [fields, setFields] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState("ndvi");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchFieldSimulation();
        if (res.data && res.data.fields) {
          setFields(res.data.fields);
          
          // Store in history for comparison (simulated time series)
          setHistory(prev => {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const newEntry = {
              time: now,
              ...res.data.fields.reduce((acc, f, idx) => {
                const id = f.fieldId || f.field_id || idx + 1;
                acc[`field${id}_ndvi`] = Number(f.avgNdvi || f.avg_ndvi || 0).toFixed(3);
                acc[`field${id}_health`] = Number((f.avgHealth || f.avg_health || 0) * 100).toFixed(1);
                acc[`field${id}_yield`] = Number(f.avgYield || f.avg_yield || 0).toFixed(2);
                return acc;
              }, {})
            };
            
            const updated = [...prev, newEntry].slice(-50); // Keep last 10 entries
            return updated;
          });
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching fields:", error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 8000); // Update every 8 seconds
    return () => clearInterval(interval);
  }, []);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    return fields.map((f, idx) => {
      const id = f.fieldId || f.field_id || idx + 1;
      const ndvi = Number(f.avgNdvi || f.avg_ndvi || 0);
      const health = Number(f.avgHealth || f.avg_health || 0) * 100;
      const yld = Number(f.avgYield || f.avg_yield || 0);
      
      // Calculate change (mock - comparing to baseline)
      const ndviChange = (Math.random() * 0.1 - 0.05).toFixed(3);
      const healthChange = (Math.random() * 10 - 5).toFixed(1);
      const yieldChange = (Math.random() * 2 - 1).toFixed(2);
      
      return {
        name: `Field ${id}`,
        ndvi: ndvi.toFixed(3),
        health: health.toFixed(1),
        yield: yld.toFixed(2),
        ndviChange: Number(ndviChange),
        healthChange: Number(healthChange),
        yieldChange: Number(yieldChange),
        crop: f.crop || f.cropType || "Mixed"
      };
    });
  }, [fields]);

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
        </div>
        <div className="mt-8 text-lg text-gray-600 dark:text-gray-300 font-medium">Loading Analytics</div>
        <div className="mt-2 text-sm text-gray-400">Fetching field comparison data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-4">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-blue-700 dark:text-blue-400 font-medium">Comparative Analysis</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Field Comparison
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Compare metrics across all fields with real-time trend visualization
        </p>
      </div>

      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { key: 'ndvi', label: 'NDVI Index', color: 'green' },
          { key: 'health', label: 'Health Score', color: 'blue' },
          { key: 'yield', label: 'Yield Estimate', color: 'yellow' }
        ].map(m => (
          <button
            key={m.key}
            onClick={() => setSelectedMetric(m.key)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              selectedMetric === m.key
                ? `bg-${m.color}-500 text-white shadow-lg`
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            style={selectedMetric === m.key ? { backgroundColor: m.color === 'green' ? '#22c55e' : m.color === 'blue' ? '#3b82f6' : '#f59e0b' } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {comparisonData.map((field, idx) => {
          const value = field[selectedMetric];
          const change = field[`${selectedMetric}Change`];
          const isPositive = change >= 0;
          
          return (
            <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{field.crop}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {value}{selectedMetric === 'health' ? '%' : ''}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <svg className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>{isPositive ? '+' : ''}{change}</span>
                <span className="text-gray-400 font-normal">vs last</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart - Field Comparison */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Field Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey={selectedMetric} fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Line Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Real-Time Trends
          </h3>
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={selectedMetric === 'health' ? [0, 100] : ['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Legend />
                {fields.slice(0, 5).map((f, idx) => {
                  const id = f.fieldId || f.field_id || idx + 1;
                  return (
                    <Line 
                      key={idx}
                      type="monotone" 
                      dataKey={`field${id}_${selectedMetric}`} 
                      stroke={COLORS[idx]} 
                      strokeWidth={2}
                      dot={false}
                      name={`Field ${id}`}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p>Collecting data points...</p>
                <p className="text-sm">Trends will appear after a few updates</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Fields Area Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Cumulative Overview
        </h3>
        {history.length > 1 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={history}>
              <defs>
                {fields.slice(0, 5).map((f, idx) => {
                  const id = f.fieldId || f.field_id || idx + 1;
                  return (
                    <linearGradient key={idx} id={`color${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[idx]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[idx]} stopOpacity={0}/>
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }} />
              {fields.slice(0, 5).map((f, idx) => {
                const id = f.fieldId || f.field_id || idx + 1;
                return (
                  <Area 
                    key={idx}
                    type="monotone" 
                    dataKey={`field${id}_${selectedMetric}`} 
                    stroke={COLORS[idx]} 
                    fillOpacity={1}
                    fill={`url(#color${id})`}
                    name={`Field ${id}`}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
            Waiting for more data points...
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Detailed Metrics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Field</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Crop</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">NDVI</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Health</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yield</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {comparisonData.map((field, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white" style={{ backgroundColor: COLORS[idx] }}>
                        {field.name.slice(-1)}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{field.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{field.crop}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-900 dark:text-white">{field.ndvi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-900 dark:text-white">{field.health}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-900 dark:text-white">{field.yield}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      field.ndviChange >= 0 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      <svg className={`w-3 h-3 ${field.ndviChange < 0 && 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      {field.ndviChange >= 0 ? '+' : ''}{field.ndviChange}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FieldComparison;
