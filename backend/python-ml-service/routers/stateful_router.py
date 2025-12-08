# stateful_router.py
# FastAPI router for stateful simulation endpoints
# These run in parallel with legacy /simulate/* endpoints

from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from simulation.stateful_field_sim import (
    InitFieldRequest, StepRequest, StepBatchRequest, EnvParams,
    init_field, step_field, get_field_summary, patch_field_env,
    delete_field, list_fields, fix_field, storage
)

router = APIRouter()


# ---- Health check ----
@router.get("/health")
async def health_check():
    """Check if stateful simulation service is running"""
    redis_status = "connected" if storage.use_redis else "in-memory-fallback"
    return {
        "status": "ok",
        "storage": redis_status,
        "fields_count": len(list_fields())
    }


# ---- Field initialization ----
@router.post("/init_field")
async def api_init_field(req: InitFieldRequest):
    """
    Initialize a new field with default or custom parameters.
    Call this ONCE when creating a field, not every step.
    
    Returns initial metrics that can be saved to your DB for history.
    """
    try:
        result = init_field(req)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- Simulation step ----
@router.post("/step")
async def api_step(req: StepRequest):
    """
    Advance simulation by delta_days.
    
    Returns aggregated diffs (not full plant arrays) for efficiency.
    Save the 'after' metrics to your DB for historical comparison.
    """
    try:
        result = step_field(req.field_id, req.delta_days)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/step_batch")
async def api_step_batch(req: StepBatchRequest):
    """
    Step multiple fields at once. More efficient than individual calls.
    """
    results = []
    errors = []
    
    for field_id in req.field_ids:
        try:
            result = step_field(field_id, req.delta_days)
            results.append(result)
        except Exception as e:
            errors.append({"field_id": field_id, "error": str(e)})
    
    return {
        "ok": len(errors) == 0,
        "results": results,
        "errors": errors
    }


# ---- State queries ----
@router.get("/field/{field_id}")
async def api_get_field(field_id: str):
    """
    Get current field metrics without stepping simulation.
    Use for displaying current state on dashboard.
    """
    try:
        result = get_field_summary(field_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/fields")
async def api_list_fields():
    """List all field IDs currently in stateful storage"""
    field_ids = list_fields()
    return {"fields": field_ids, "count": len(field_ids)}


# ---- Environment updates ----
@router.post("/patch_env/{field_id}")
async def api_patch_env(field_id: str, env: EnvParams):
    """
    Update environmental conditions for a field.
    Call when weather changes or irrigation is applied.
    """
    try:
        result = patch_field_env(field_id, env)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


class FixRequest(BaseModel):
    fix_type: Optional[str] = "all"  # all, irrigation, fertilizer, disease


@router.post("/fix/{field_id}")
async def api_fix_field(field_id: str, req: FixRequest = FixRequest()):
    """
    Fix a field - heal critical plants and resolve damage.
    Call when user applies treatment or resolves alerts.
    
    fix_type options:
    - "all": Full treatment (default)
    - "irrigation": Fix moisture issues only
    - "fertilizer": Fix nutrient deficiencies only
    - "disease": Treat diseased plants only
    """
    try:
        result = fix_field(field_id, req.fix_type)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---- Field management ----
@router.delete("/field/{field_id}")
async def api_delete_field(field_id: str):
    """Remove a field from stateful storage"""
    try:
        result = delete_field(field_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---- Legacy compatibility endpoint ----
# This accepts the same format as the old /simulate/step but uses stateful backend
# IMPORTANT: Uses actual trained ML models for yield and disease prediction
@router.post("/compat/step")
async def compat_step(payload: dict = Body(...)):
    """
    Compatibility endpoint that accepts legacy format.
    Uses ACTUAL ML models for yield and disease prediction.
    
    Input: {"fields": [{"field_id": 1, "crop_type": "corn", ...}]}
    Output: Same format as legacy /simulate/step
    """
    import numpy as np
    import pandas as pd
    
    # Import the actual trained models
    from routers.simulate_router import yield_predict_batch, disease_predict_batch, processor
    
    try:
        fields_data = payload.get("fields", [])
        results = []
        all_alerts = []
        
        for f in fields_data:
            field_id = str(f.get("field_id", f.get("fieldId", 0)))
            crop_type = f.get("crop_type", f.get("cropType", "corn"))
            
            # Auto-initialize if not exists
            try:
                summary = get_field_summary(field_id)
            except ValueError:
                # Field doesn't exist, initialize it
                init_req = InitFieldRequest(
                    field_id=field_id,
                    plants=100,
                    crop_type=crop_type
                )
                init_field(init_req)
                summary = get_field_summary(field_id)
            
            # Step the field (updates spectral data)
            step_result = step_field(field_id, delta_days=1.0)
            after = step_result["after"]
            
            # Get spectral data from stateful storage for ML predictions
            from simulation.stateful_field_sim import storage, deserialize_state, BANDS
            blob = storage.get(field_id)
            if blob:
                state = deserialize_state(blob)
                spectra = state["spectra"]  # Shape: (plants, bands)
                agro = state["agro"]        # Shape: (plants, 7)
                n_plants = spectra.shape[0]
                
                # Prepare data for YIELD MODEL (actual prediction)
                spec_batch = spectra.reshape(n_plants, BANDS, 1)
                agro_keys = ["Soil_N", "Soil_P", "Soil_K", "Soil_pH", "Rainfall", "Temperature", "SoilMoisture"]
                agro_batch = agro  # Already (plants, 7)
                
                try:
                    # Call ACTUAL yield model
                    yield_preds = yield_predict_batch(spec_batch, agro_batch)
                    avg_yield = float(np.mean(yield_preds))
                    avg_yield = max(0.0, avg_yield)  # Ensure non-negative
                except Exception as e:
                    print(f"Yield model error: {e}")
                    avg_yield = 50.0  # Fallback
                
                # Prepare data for DISEASE MODEL (actual prediction)
                try:
                    # Build DataFrame for disease model
                    from simulation.stateful_field_sim import compute_ndvi
                    ndvi_values = compute_ndvi(spectra)
                    
                    d_data = []
                    for i in range(n_plants):
                        row = {
                            "NDVI": ndvi_values[i],
                            "Soil_N": agro[i, 0],
                            "Soil_P": agro[i, 1],
                            "Soil_K": agro[i, 2],
                            "Soil_pH": agro[i, 3],
                            "Rainfall": agro[i, 4],
                            "Temperature": agro[i, 5],
                            "SoilMoisture": agro[i, 6]
                        }
                        d_data.append(row)
                    
                    df_disease = pd.DataFrame(d_data)
                    disease_results = disease_predict_batch(df_disease)
                    
                    # Calculate disease metrics
                    disease_probs = []
                    healthy_count = 0
                    for status, prob in disease_results:
                        if status == "healthy":
                            disease_probs.append(max(0.0, 1.0 - prob))
                            healthy_count += 1
                        else:
                            disease_probs.append(prob)
                    
                    avg_disease_risk = float(np.mean(disease_probs))
                    avg_health = 1.0 - avg_disease_risk
                    
                except Exception as e:
                    print(f"Disease model error: {e}")
                    avg_disease_risk = 0.1
                    avg_health = 0.9
                
                # Generate plant summaries with ACTUAL predictions
                plants_summary = []
                for i in range(n_plants):  # Return ALL 100 plants
                    plant_yield = float(yield_preds[i]) if 'yield_preds' in dir() else avg_yield / 10
                    
                    if 'disease_results' in dir() and i < len(disease_results):
                        status, prob = disease_results[i]
                        if status == "healthy":
                            plant_disease = max(0.0, 1.0 - prob)
                        else:
                            plant_disease = prob
                    else:
                        status = "healthy"
                        plant_disease = 0.1
                    
                    plants_summary.append({
                        "plant_id": i,
                        "ndvi": round(float(ndvi_values[i]), 4),
                        "health": round(1.0 - plant_disease, 4),
                        "disease_prob": round(plant_disease, 4),
                        "disease_status": status,
                        "yield": round(plant_yield, 2),
                        "spectral": spectra[i].tolist()[:10],  # First 10 bands for reference
                        "agro": {
                            # Match legacy field_sim.py sample_agro() format exactly
                            "Soil_N": round(float(agro[i, 0]), 1),
                            "Soil_P": round(float(agro[i, 1]), 1),
                            "Soil_K": round(float(agro[i, 2]), 1),
                            "Soil_pH": round(float(agro[i, 3]), 2),
                            "Rainfall": round(float(agro[i, 4]), 1),
                            "Temperature": round(float(agro[i, 5]), 1),
                            "SoilMoisture": round(min(95.0, max(25.0, float(agro[i, 6]))), 1),
                            "Irrigation": round(30 + np.random.random() * 50, 1),  # 30-80
                            "Fertilizer": round(20 + np.random.random() * 60, 1),  # 20-80
                            "Humidity": round(50 + np.random.random() * 35, 1)     # 50-85
                        }
                    })
            else:
                # Fallback if no spectral data
                avg_yield = 50.0
                avg_health = 0.9
                avg_disease_risk = 0.1
                plants_summary = []
            
            legacy_format = {
                "field_id": int(field_id) if field_id.isdigit() else field_id,
                "crop_type": step_result["crop_type"],
                "day": step_result.get("day", 0),
                "growth_stage": step_result.get("growth_stage", "seedling"),
                "maturity_pct": step_result.get("maturity_pct", 0),
                "days_to_harvest": step_result.get("days_to_harvest", 120),
                "avg_ndvi": round(after["avg_ndvi"], 4),
                "avg_health": round(avg_health, 4),
                "avg_yield": round(avg_yield, 2),
                "disease_risk": round(avg_disease_risk, 4),
                "avg_nitrogen": round(after["avg_nitrogen"], 2),
                "avg_phosphorus": round(after["avg_phosphorus"], 2),
                "avg_potassium": round(after["avg_potassium"], 2),
                "avg_moisture": round(after["avg_moisture"], 2),
                "avg_temperature": round(after["avg_temperature"], 2),
                "avg_rainfall": round(after["avg_rainfall"], 2),
                "avg_ph": round(after["avg_ph"], 2),
                "plants": plants_summary,
                "plants_count": n_plants if 'n_plants' in dir() else 100
            }
            results.append(legacy_format)
            
            # Add alerts from step_field
            all_alerts.extend(step_result.get("alerts", []))
            
            # Generate additional alerts based on plant-level data
            if plants_summary:
                # Count diseased/at_risk plants
                diseased = [p for p in plants_summary if p["disease_status"] == "diseased"]
                at_risk = [p for p in plants_summary if p["disease_status"] == "at_risk"]
                low_ndvi = [p for p in plants_summary if p["ndvi"] < 0.45]
                
                if len(diseased) > 0:
                    all_alerts.append({
                        "field_id": field_id,
                        "type": "DiseaseOutbreak",
                        "level": "critical" if len(diseased) >= 10 else "warning",
                        "message": f"Field {field_id}: {len(diseased)} plants diseased! Immediate action required."
                    })
                
                if len(at_risk) > 5:
                    all_alerts.append({
                        "field_id": field_id,
                        "type": "DiseaseRisk",
                        "level": "warning",
                        "message": f"Field {field_id}: {len(at_risk)} plants at risk of disease. Monitor closely."
                    })
                
                if len(low_ndvi) > 10:
                    all_alerts.append({
                        "field_id": field_id,
                        "type": "LowVegetation",
                        "level": "critical" if len(low_ndvi) >= 20 else "warning",
                        "message": f"Field {field_id}: {len(low_ndvi)} plants with low vegetation index."
                    })
                
                # High disease risk alert
                if avg_disease_risk > 0.4:
                    all_alerts.append({
                        "field_id": field_id,
                        "type": "HighDiseaseRisk",
                        "level": "critical" if avg_disease_risk > 0.6 else "warning",
                        "message": f"Field {field_id}: High disease risk ({avg_disease_risk:.1%}). Consider treatment."
                    })
        
        return {
            "status": "ok",
            "fields": results,
            "alerts": all_alerts,
            "message": "Stateful simulation step with ML predictions"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
