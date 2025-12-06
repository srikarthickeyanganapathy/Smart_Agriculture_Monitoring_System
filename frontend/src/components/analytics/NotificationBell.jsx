import React from "react";
import { useAlerts } from "../../context/AlertsContext";

export default function NotificationBell({ fieldId, onClick }) {
  const { alertsMap } = useAlerts();
  const count = alertsMap[String(fieldId)] ? Object.keys(alertsMap[String(fieldId)]).length : 0;

  return (
    <div 
      onClick={onClick}
      className="relative inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full cursor-pointer transition-all duration-300 hover:bg-gray-200 hover:scale-110 group"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        className="transition-colors duration-300 text-gray-600 group-hover:text-green-600"
      >
        <path 
          d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg border-2 border-white animate-bounce">
          {count}
        </span>
      )}
    </div>
  );
}