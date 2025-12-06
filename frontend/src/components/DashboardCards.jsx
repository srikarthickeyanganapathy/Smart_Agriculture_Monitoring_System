import React, { memo } from "react";

/**
 * DashboardCards – displays aggregated metrics for the farm
 * with animated counters and premium styling
 */
const DashboardCards = memo(({ fields, loading }) => {
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const totalFields = fields?.length || 0;
  const avgNDVI = totalFields > 0 
    ? (fields.reduce((sum, f) => sum + safeNum(f.avgNdvi || f.avg_ndvi || 0), 0) / totalFields).toFixed(3)
    : "0.000";
  const avgHealth = totalFields > 0
    ? (fields.reduce((sum, f) => sum + safeNum(f.avgHealth || f.avg_health || 0), 0) / totalFields * 100).toFixed(1)
    : "0.0";
  const avgYield = totalFields > 0
    ? (fields.reduce((sum, f) => sum + safeNum(f.avgYield || f.avg_yield || 0), 0) / totalFields).toFixed(2)
    : "0.00";

  const cards = [
    {
      label: "Active Fields",
      value: totalFields,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      label: "Average NDVI",
      value: avgNDVI,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    },
    {
      label: "Crop Health",
      value: `${avgHealth}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-green-400 to-emerald-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      label: "Average Yield",
      value: avgYield,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 skeleton mb-4"></div>
              <div className="w-20 h-3 bg-gray-100 skeleton rounded mb-3"></div>
              <div className="w-16 h-8 bg-gray-100 skeleton rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300 card-hover overflow-hidden"
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/0 to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-2xl ${card.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${card.textColor}`}>
              {card.icon}
            </div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {card.label}
            </h3>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

DashboardCards.displayName = 'DashboardCards';

export default DashboardCards;
