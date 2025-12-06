"""
Disease Prediction Router (Tabular)
Predicts plant disease status from tabular metrics (NDVI, NPK, Temp, Moisture).
Matches frontend payload structure.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import numpy as np
from utils.model_loader import load_disease_model

router = APIRouter()

# Load model at startup
disease_model, feature_cols, disease_classes = load_disease_model()

class DiseaseRequestTabular(BaseModel):
    fieldId: Optional[int] = None
    plantId: Optional[int] = None
    ndvi: float
    temperature: float
    moisture: float
    nitrogen: float
    phosphorus: float
    potassium: float
    irrigation: Optional[float] = None
    ph: Optional[float] = 6.5  # Default if not provided

@router.post("/disease")
async def predict_disease(req: DiseaseRequestTabular):
    """
    Predict disease status for a plant using tabular features.
    
    Input:
    - ndvi, temperature, moisture, nitrogen, phosphorus, potassium, irrigation
    """
    try:
        # Map fields to model feature columns
        # Model features: ['NDVI', 'Temperature', 'SoilMoisture', 'Soil_N', 'Soil_P', 'Soil_K', 'Soil_pH']
        
        feature_map = {
            'NDVI': req.ndvi,
            'Temperature': req.temperature,
            'SoilMoisture': req.moisture,
            'Soil_N': req.nitrogen,
            'Soil_P': req.phosphorus,
            'Soil_K': req.potassium,
            'Soil_pH': req.ph if req.ph is not None else 6.5
        }
        
        features = [feature_map.get(col, 0.0) for col in feature_cols]
        X = np.array(features).reshape(1, -1)
        
        # Predict
        pred_class = disease_model.predict(X)[0]
        pred_proba = disease_model.predict_proba(X)[0]
        
        disease_status = disease_classes[pred_class]
        
        # Health score logic
        health_map = {'healthy': 1.0, 'at_risk': 0.6, 'diseased': 0.2}
        health_score = health_map.get(disease_status, 0.5)
        
        max_prob = float(pred_proba[pred_class])
        
        return {
            "disease_status": disease_status,
            "disease": disease_status,  # Alias for Spring Boot compatibility
            "disease_probability": {
                disease_classes[i]: float(pred_proba[i]) 
                for i in range(len(disease_classes))
            },
            "probability": max_prob,    # Alias for Spring Boot compatibility
            "health_score": health_score,
            "predicted_class": int(pred_class),
            # Echo input for debugging
            "input_processed": feature_map
        }
    
    except Exception as e:
        return {"error": str(e), "status": "error"}
