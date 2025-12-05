"""
Dashboard Router
Provides aggregated metrics, forecasts, and suggestions for the farmer dashboard.
"""

from fastapi import APIRouter
from typing import Optional
import numpy as np
from datetime import datetime, timedelta

router = APIRouter()

# Reference to simulation (will be set from main.py or simulate_router)
sim_ref = None

def set_simulation_ref(sim):
    global sim_ref
    sim_ref = sim

@router.get("/summary")
async def get_dashboard_summary():
    """
    Get aggregated metrics across all fields.
    
    Returns:
    - total_fields: Number of fields
    - total_plants: Total number of plants
    - avg_ndvi: Average NDVI across all fields
    - avg_yield: Average yield prediction
    - avg_health: Average health score
    - disease_risk_level: Overall disease risk (low/medium/high)
    - fields_needing_attention: List of field IDs that need intervention
    - last_updated: Timestamp
    """
    if sim_ref is None or not sim_ref.fields:
        return {
            "status": "error",
            "message": "Simulation not started. Call /simulate/start first."
        }
    
    fields = sim_ref.fields
    
    # Aggregate metrics
    all_ndvi = []
    all_yields = []
    all_health = []
    all_disease = []
    fields_needing_attention = []
    
    for f in fields:
        all_ndvi.append(f.avg_ndvi)
        all_yields.append(f.avg_yield)
        all_health.append(f.avg_health)
        all_disease.append(f.disease_risk)
        
        # Check if field needs attention
        needs_attention = (
            f.avg_ndvi < 0.3 or
            f.disease_risk > 0.4 or
            f.avg_health < 0.6
        )
        if needs_attention:
            fields_needing_attention.append({
                "field_id": f.field_id,
                "reasons": []
            })
            if f.avg_ndvi < 0.3:
                fields_needing_attention[-1]["reasons"].append("Low NDVI")
            if f.disease_risk > 0.4:
                fields_needing_attention[-1]["reasons"].append("High Disease Risk")
            if f.avg_health < 0.6:
                fields_needing_attention[-1]["reasons"].append("Low Health")
    
    # Determine overall disease risk level
    avg_disease = np.mean(all_disease)
    if avg_disease < 0.2:
        disease_risk_level = "low"
    elif avg_disease < 0.4:
        disease_risk_level = "medium"
    else:
        disease_risk_level = "high"
    
    return {
        "status": "ok",
        "total_fields": len(fields),
        "total_plants": sum(len(f.plants) for f in fields),
        "avg_ndvi": float(np.mean(all_ndvi)),
        "avg_yield": float(np.mean(all_yields)),
        "avg_health": float(np.mean(all_health)),
        "avg_disease_prob": float(avg_disease),
        "disease_risk_level": disease_risk_level,
        "fields_needing_attention": fields_needing_attention,
        "last_updated": datetime.utcnow().isoformat()
    }

@router.get("/field/{field_id}/forecast")
async def get_field_forecast(field_id: int, days: int = 7):
    """
    Get yield forecast for a specific field over the next N days.
    Uses current conditions with simulated environmental changes.
    
    Returns:
    - field_id: Field identifier
    - forecast: List of daily predictions
    """
    if sim_ref is None or not sim_ref.fields:
        return {"status": "error", "message": "Simulation not started"}
    
    # Find field
    field = None
    for f in sim_ref.fields:
        if f.field_id == field_id:
            field = f
            break
    
    if not field:
        return {"status": "error", "message": f"Field {field_id} not found"}
    
    # Generate forecast based on current conditions
    current_yield = field.avg_yield
    current_ndvi = field.avg_ndvi
    current_health = field.avg_health
    
    forecast = []
    for day in range(1, days + 1):
        date = (datetime.utcnow() + timedelta(days=day)).strftime("%Y-%m-%d")
        
        # Simulate gradual changes (with some randomness)
        # If health is good, yield tends to improve slightly
        # If health is poor, yield may decline
        health_factor = current_health - 0.5
        yield_change = np.random.normal(health_factor * 0.5, 0.3)
        
        projected_yield = max(0, current_yield + yield_change * day * 0.1)
        projected_ndvi = np.clip(current_ndvi + np.random.normal(0, 0.02), 0, 1)
        
        forecast.append({
            "date": date,
            "day": day,
            "projected_yield": float(projected_yield),
            "projected_ndvi": float(projected_ndvi),
            "confidence": max(0.5, 1.0 - day * 0.05)  # Confidence decreases with time
        })
    
    return {
        "status": "ok",
        "field_id": field_id,
        "crop_type": field.crop_type,
        "current_yield": float(current_yield),
        "current_ndvi": float(current_ndvi),
        "forecast": forecast
    }

@router.get("/field/{field_id}/suggestions")
async def get_field_suggestions(field_id: int):
    """
    Get actionable suggestions for a specific field.
    
    Returns:
    - suggestions: List of recommended actions
    - priority: Overall priority level (low/medium/high/critical)
    """
    if sim_ref is None or not sim_ref.fields:
        return {"status": "error", "message": "Simulation not started"}
    
    # Find field
    field = None
    for f in sim_ref.fields:
        if f.field_id == field_id:
            field = f
            break
    
    if not field:
        return {"status": "error", "message": f"Field {field_id} not found"}
    
    suggestions = []
    priority_level = "low"
    
    # Calculate field averages
    avg_irrigation = float(np.mean([p.agro.get("Irrigation", 0) for p in field.plants]))
    avg_moisture = float(np.mean([p.agro.get("SoilMoisture", 0) for p in field.plants]))
    avg_temp = float(np.mean([p.agro.get("Temperature", 0) for p in field.plants]))
    avg_n = float(np.mean([p.agro.get("Soil_N", 0) for p in field.plants]))
    avg_p = float(np.mean([p.agro.get("Soil_P", 0) for p in field.plants]))
    avg_k = float(np.mean([p.agro.get("Soil_K", 0) for p in field.plants]))
    
    # Check conditions and generate suggestions
    if avg_irrigation < 20:
        suggestions.append({
            "type": "irrigation",
            "action": "Increase irrigation",
            "current_value": avg_irrigation,
            "recommended_value": 40,
            "urgency": "high",
            "reason": "Irrigation level is critically low"
        })
        priority_level = "high"
    
    if avg_moisture < 30:
        suggestions.append({
            "type": "irrigation",
            "action": "Improve soil moisture",
            "current_value": avg_moisture,
            "recommended_value": 50,
            "urgency": "high",
            "reason": "Soil moisture below optimal threshold"
        })
        priority_level = "high"
    
    if avg_temp > 35:
        suggestions.append({
            "type": "cooling",
            "action": "Apply cooling measures",
            "current_value": avg_temp,
            "recommended_value": 28,
            "urgency": "medium",
            "reason": "Temperature stress detected"
        })
        if priority_level == "low":
            priority_level = "medium"
    
    if avg_n < 20:
        suggestions.append({
            "type": "fertilizer",
            "action": "Apply nitrogen fertilizer",
            "current_value": avg_n,
            "recommended_value": 50,
            "urgency": "medium",
            "reason": "Nitrogen deficiency detected"
        })
    
    if avg_p < 15:
        suggestions.append({
            "type": "fertilizer",
            "action": "Apply phosphorus fertilizer",
            "current_value": avg_p,
            "recommended_value": 30,
            "urgency": "low",
            "reason": "Phosphorus level is low"
        })
    
    if avg_k < 20:
        suggestions.append({
            "type": "fertilizer",
            "action": "Apply potassium fertilizer",
            "current_value": avg_k,
            "recommended_value": 40,
            "urgency": "low",
            "reason": "Potassium level is low"
        })
    
    if field.disease_risk > 0.4:
        suggestions.append({
            "type": "treatment",
            "action": "Apply pesticide treatment",
            "current_value": field.disease_risk,
            "recommended_value": 0.2,
            "urgency": "critical",
            "reason": "High disease risk detected"
        })
        priority_level = "critical"
    
    if field.avg_ndvi < 0.3:
        suggestions.append({
            "type": "intervention",
            "action": "Investigate plant stress",
            "current_value": field.avg_ndvi,
            "recommended_value": 0.6,
            "urgency": "high",
            "reason": "Very low NDVI indicates severe plant stress"
        })
        if priority_level not in ["critical", "high"]:
            priority_level = "high"
    
    # If no issues found
    if not suggestions:
        suggestions.append({
            "type": "monitoring",
            "action": "Continue regular monitoring",
            "urgency": "low",
            "reason": "All parameters within acceptable range"
        })
    
    return {
        "status": "ok",
        "field_id": field_id,
        "crop_type": field.crop_type,
        "priority": priority_level,
        "suggestions": suggestions,
        "current_metrics": {
            "avg_ndvi": float(field.avg_ndvi),
            "avg_yield": float(field.avg_yield),
            "avg_health": float(field.avg_health),
            "disease_risk": float(field.disease_risk),
            "avg_irrigation": avg_irrigation,
            "avg_moisture": avg_moisture,
            "avg_temperature": avg_temp,
            "avg_nitrogen": avg_n
        }
    }

@router.get("/alerts/history")
async def get_alerts_history(limit: int = 20):
    """
    Get recent alerts history.
    Note: This is a placeholder - actual history requires database storage.
    """
    # For now, generate mock recent alerts from current field states
    if sim_ref is None or not sim_ref.fields:
        return {"status": "error", "message": "Simulation not started"}
    
    alerts = []
    for f in sim_ref.fields:
        if f.avg_ndvi < 0.3:
            alerts.append({
                "field_id": f.field_id,
                "type": "LowNDVI",
                "level": "warning",
                "message": f"Field {f.field_id} avg NDVI {f.avg_ndvi:.3f}",
                "timestamp": f.last_updated.isoformat()
            })
        if f.disease_risk > 0.4:
            alerts.append({
                "field_id": f.field_id,
                "type": "HighDisease",
                "level": "critical",
                "message": f"High disease risk {f.disease_risk:.2f} in Field {f.field_id}",
                "timestamp": f.last_updated.isoformat()
            })
    
    return {
        "status": "ok",
        "alerts": alerts[:limit],
        "total": len(alerts)
    }
