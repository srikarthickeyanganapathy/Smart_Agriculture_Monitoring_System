// src/components/DashboardCards.jsx
import React from "react";

/**
 * DashboardCards – displays aggregated metrics for the farm.
 * Props:
 *   fields: array of field objects from the backend
 *   loading: boolean indicating data fetch status.
 */
const DashboardCards = ({ fields = [], loading = false }) => {
  const totalFields = fields.length;
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const avgNDVI = totalFields
    ? (fields.reduce((sum, f) => sum + safeNum(f.avgNdvi || f.avg_ndvi), 0) / totalFields)
    : 0;
  const avgHealth = totalFields
    ? (fields.reduce((sum, f) => sum + safeNum(f.avgHealth || f.avg_health), 0) / totalFields)
    : 0;
  const avgYield = totalFields
    ? (fields.reduce((sum, f) => sum + safeNum(f.avgYield || f.avg_yield), 0) / totalFields)
    : 0;

  const formatNumber = (num, decimals = 2) => safeNum(num).toFixed(decimals);

  const cards = [
    {
      title: "Active Fields",
      value: totalFields,
      sub: "Monitored",
      color: "green",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: "Average NDVI",
      value: formatNumber(avgNDVI, 3),
      sub: "Vegetation index",
      color: "blue",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      title: "Crop Health",
      value: `${formatNumber(avgHealth * 100, 1)}%`,
      sub: avgHealth >= 0.8 ? "Optimal" : avgHealth >= 0.5 ? "Moderate" : "Needs attention",
      color: avgHealth >= 0.8 ? "green" : avgHealth >= 0.5 ? "yellow" : "red",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Average Yield",
      value: formatNumber(avgYield, 2),
      sub: "kg/plant predicted",
      color: "purple",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ];

  const colorClasses = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600"
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
          <div className="flex flex-col">
            <div className={`w-12 h-12 rounded-xl ${colorClasses[card.color]} flex items-center justify-center mb-4`}>
              {card.icon}
            </div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {card.title}
            </h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {card.value}
            </div>
            <p className={`text-sm font-medium ${colorClasses[card.color].split(' ')[1]}`}>
              {card.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
