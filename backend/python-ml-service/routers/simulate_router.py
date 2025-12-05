from fastapi import APIRouter, Body, HTTPException
from simulation.field_sim import FieldProcessor
from utils.model_loader import load_yield_model
import numpy as np

router = APIRouter()

# Stateless Processor (Helper)
processor = FieldProcessor()

# Load Yield Model
model, scaler = load_yield_model()

def yield_predict_batch(spec_batch, agro_batch):
    """Batch prediction wrapper for yield model"""
    agro_scaled = scaler.transform(agro_batch)
    preds = model.predict({
        "spectral_input": spec_batch,
        "agro_input": agro_scaled
    }, verbose=0)
    return preds.reshape(-1)

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
        next_state, alerts = processor.process_step(current_state, yield_predict_batch)
        
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