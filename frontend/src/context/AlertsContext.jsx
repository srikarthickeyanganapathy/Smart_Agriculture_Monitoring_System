import React, { createContext, useContext, useEffect, useState } from "react";
import { ALERTS_SSE_URL } from "../api/analyticsAPI";

const AlertsContext = createContext();

export function AlertsProvider({ children }) {
  const [alertsMap, setAlertsMap] = useState({});
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (!token) return; // Don't connect if not logged in

    let es;
    let reconnectDelay = 1000;

    const connect = () => {
      // Token is already verified present by the early return, but we use the state value
      const url = `${ALERTS_SSE_URL}?token=${token}`;
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
          if (payload && (payload.action === "cleared" || payload.cleared === true)) {
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

              // Normalize severity: Backend (HIGH, MEDIUM, LOW) -> Frontend (critical, warning, info)
              let severity = payload.severity || payload.level || "info";
              const s = severity.toUpperCase();
              if (s === "HIGH" || s === "CRITICAL") severity = "critical";
              else if (s === "MEDIUM" || s === "WARNING") severity = "warning";
              else if (s === "LOW" || s === "INFO") severity = "info";

              copy[fid][payload.type] = {
                message: payload.message,
                level: severity,
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
          // Only reconnect if we still have a token (user didn't logout in the meantime)
          if (token) connect(); 
        }, reconnectDelay);
      };
    };

    connect();
    return () => { try { es.close(); } catch(_) {} };
  }, [token]);

  const clearFieldAlertsLocal = (fieldId) => {
    setAlertsMap(prev => {
      const copy = { ...prev };
      delete copy[String(fieldId)];
      return copy;
    });
  };

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setAlertsMap({}); // Clear alerts on logout
  };

  return (
    <AlertsContext.Provider value={{ alertsMap, clearFieldAlertsLocal, login, logout }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}