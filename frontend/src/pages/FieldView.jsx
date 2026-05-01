import React, { useCallback, useEffect, useState } from "react";
import PixelFieldView from "../components/analytics/PixelFieldView";
import { useParams, useNavigate } from "react-router-dom";
import { getAllFields, adjustField } from "../api/analyticsAPI";

/**
 * FieldView route: /field/:id
 * If no field found, redirects back to Analytics
 */
export default function FieldView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFields = useCallback(async () => {
    try {
      const json = await getAllFields();
      const fields = json.fields || [];
      // Robust find: check snake_case and camelCase
      const found = fields.find(f => 
        Number(f.field_id || f.fieldId) === Number(id)
      );
    
      if (!found) {
        // redirect back
        navigate("/analytics");
        return;
      }
      setField(found);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchFields();
    // poll every 3s to keep view updated like heatmap
    const t = setInterval(fetchFields, 3000);
    return () => clearInterval(t);
  }, [fetchFields]);

  const handleAdjust = async (fieldId) => {
    try {
      await adjustField(fieldId);
      // immediately fetch to show updated status
      await fetchFields();
    } catch(e) {
      console.error("Error adjusting field:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <button 
            onClick={() => navigate("/analytics")}
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analytics
          </button>
          
          <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
            Field Details
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Field {id}
          </h1>
          
          <p className="text-xl text-gray-500 font-light">
            Real-time monitoring and plant-level analytics
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-6"></div>
            <p className="text-lg text-gray-600 font-medium">Loading field data...</p>
            <p className="text-sm text-gray-400 mt-2">Please wait while we fetch the latest information</p>
          </div>
        )}
        
        {!loading && field && (
          <div className="animate-fade-in">
            <PixelFieldView 
              field={field} 
              onAdjust={handleAdjust} 
              onClose={() => navigate("/analytics")} 
            />
          </div>
        )}

        {!loading && !field && (
          <div className="text-center py-24">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-6">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Field Not Found</h2>
            <p className="text-gray-500 mb-8">The field you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate("/analytics")}
              className="px-8 py-3.5 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-all hover:scale-105 shadow-lg"
            >
              Return to Analytics
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
