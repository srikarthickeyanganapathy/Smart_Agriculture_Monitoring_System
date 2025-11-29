import React, { createContext, useContext, useEffect, useState } from "react";
import { ALERTS_SSE_URL } from "../api/analyticsAPI";

const AlertsContext = createContext();

export function AlertsProvider({ children }) {
  const [alertsMap, setAlertsMap] = useState({});

  useEffect(() => {
    let es;
    let reconnectDelay = 1000;

    const connect = () => {
      const token = localStorage.getItem("token");
      const url = token ? `${ALERTS_SSE_URL}?token=${token}` : ALERTS_SSE_URL;
      es = new EventSource(url);

      es.onopen = () => {
        console.log("SSE open");
        reconnectDelay = 1000;
      };

      es.addEventListener("initial", (e) => {
        try {
          const data = JSON.parse(e.data || "{}");
          const normalized = {};
          Object.keys(data || {}).forEach(k => {
            normalized[String(k)] = data[k];
          });
          setAlertsMap(normalized);
        } catch (err) {
          console.warn("invalid initial snapshot", err);
        }
      });

      es.addEventListener("alert", (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.action === "cleared") {
            setAlertsMap(prev => {
              const copy = { ...prev };
              delete copy[String(payload.fieldId)];
              return copy;
            });
            return;
          }

          if (payload && payload.fieldId && payload.type) {
            const fid = String(payload.fieldId);
            setAlertsMap(prev => {
              const copy = { ...prev };
              if (!copy[fid]) copy[fid] = {};
              copy[fid][payload.type] = {
                message: payload.message,
                level: payload.level,
                timestamp: payload.timestamp
              };
              return copy;
            });
          }
        } catch (err) {
          console.warn("bad alert event", err);
        }
      });

      es.onerror = (err) => {
        console.error("SSE error", err);
        try { es.close(); } catch (_) {}
        setTimeout(() => {
          reconnectDelay = Math.min(60000, reconnectDelay * 2);
          connect();
        }, reconnectDelay);
      };
    };

    connect();
    return () => { try { es.close(); } catch(_) {} };
  }, []);

  const clearFieldAlertsLocal = (fieldId) => {
    setAlertsMap(prev => {
      const copy = { ...prev };
      delete copy[String(fieldId)];
      return copy;
    });
  };

  return (
    <AlertsContext.Provider value={{ alertsMap, clearFieldAlertsLocal }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}