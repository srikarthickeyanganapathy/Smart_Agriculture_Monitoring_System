from fastapi import APIRouter, Body, HTTPException
from simulation.field_sim import FieldProcessor
from utils.model_loader import load_yield_model, load_disease_model
import numpy as np
import pandas as pd

router = APIRouter()

# Stateless Processor (Helper)
processor = FieldProcessor()

# Load Models
yield_model, yield_scaler = load_yield_model()
disease_model, disease_features, disease_classes = load_disease_model()

def yield_predict_batch(spec_batch, agro_batch):
    """Batch prediction wrapper for yield model"""
    agro_scaled = yield_scaler.transform(agro_batch)
    preds = yield_model.predict({
        "spectral_input": spec_batch,
        "agro_input": agro_scaled
    }, verbose=0)
    return preds.reshape(-1)

def disease_predict_batch(features_df):
    """Batch prediction for disease model"""
    # Ensure columns match model expectation
    # features_df has columns like Soil_N, NDVI, etc.
    try:
        # Align columns
        X = features_df[disease_features]
        probs = disease_model.predict_proba(X)
        # Assuming binary classification or we take max prob. 
        # But wait, classes might be ['healthy', 'rust', 'blight'].
        # We want probability of "disease" (aggregated) OR strict class.
        
        # Returns list of (status, probability) tuples
        top_indices = np.argmax(probs, axis=1)
        top_proces = np.max(probs, axis=1)
        
        results = []
        for i, idx in enumerate(top_indices):
            status = disease_classes[idx]
            prob = float(top_proces[i])
            results.append((status, prob))
        return results
    except Exception as e:
        print(f"Disease Batch Error: {e}")
        return [("unknown", 0.0)] * len(features_df)

@router.get("/init")
async def init_simulation(n_fields: int = 5):
    """
    Generate INITIAL random state (Day 0).
    Spring Boot calls this when creating a new user/simulation.
    """
    try:
        fields = processor.generate_initial_state(n_fields=n_fields)
        return {"status": "ok", "fields": fields}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/step")
async def step_simulation(payload: dict = Body(...)):
    """
    Process ONE simulation step (Stateless).
    Input: {"fields": [...]} (Current State)
    Output: {"fields": [...]} (Next State with perturbations and predictions)
    """
    try:
        current_state = payload.get("fields", [])
        if not current_state:
            return {"status": "error", "message": "No fields data provided"}
            
        # Process step (Perturb -> Predict -> Aggregate)
        # Pass BOTH models
        next_state, alerts = processor.process_step(
            current_state, 
            yield_model_func=yield_predict_batch,
            disease_model_func=disease_predict_batch
        )
        
        return {
            "status": "ok", 
            "fields": next_state,
            "alerts": alerts,
            "message": "Simulation step processed"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))