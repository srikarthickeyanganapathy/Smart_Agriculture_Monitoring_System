"""
Crop Recommendation Router
Provides endpoint for recommending optimal crops based on soil and weather conditions.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np
from utils.model_loader import load_crop_model

router = APIRouter()

# Load model at startup
crop_model, label_encoder, feature_cols, crop_types = load_crop_model()

class CropRequest(BaseModel):
    N: Optional[float] = None       # Soil Nitrogen
    P: Optional[float] = None       # Soil Phosphorus
    K: Optional[float] = None       # Soil Potassium
    pH: Optional[float] = None      # Soil pH
    Temperature: Optional[float] = None
    SoilMoisture: Optional[float] = None
    Rainfall: Optional[float] = None
    # Alternative field names
    Soil_N: Optional[float] = None
    Soil_P: Optional[float] = None
    Soil_K: Optional[float] = None
    Soil_pH: Optional[float] = None

class CropBatchRequest(BaseModel):
    fields: List[Dict]

@router.post("/crop")
async def recommend_crop(req: CropRequest):
    """
    Recommend optimal crop for given soil and weather conditions.
    
    Input:
    - N/Soil_N: Nitrogen content
    - P/Soil_P: Phosphorus content
    - K/Soil_K: Potassium content
    - pH/Soil_pH: Soil pH value
    - Temperature: Ambient temperature
    - SoilMoisture: Soil moisture percentage
    - Rainfall: Rainfall in mm
    
    Returns:
    - recommended_crop: Best crop for conditions
    - confidence: Confidence score for recommendation
    - all_crops: Scores for all crop types
    """
    try:
        # Normalize field names
        n = req.N or req.Soil_N or 50.0
        p = req.P or req.Soil_P or 30.0
        k = req.K or req.Soil_K or 40.0
        ph = req.pH or req.Soil_pH or 6.5
        temp = req.Temperature or 25.0
        moisture = req.SoilMoisture or 50.0
        rainfall = req.Rainfall or 200.0
        
        # Build feature vector in expected order
        feature_map = {
            'Soil_N': n,
            'Soil_P': p,
            'Soil_K': k,
            'Soil_pH': ph,
            'Temperature': temp,
            'SoilMoisture': moisture,
            'Rainfall': rainfall
        }
        
        features = [feature_map.get(col, 0.0) for col in feature_cols]
        X = np.array(features).reshape(1, -1)
        
        # Predict
        pred_class = crop_model.predict(X)[0]
        pred_proba = crop_model.predict_proba(X)[0]
        
        recommended_crop = label_encoder.inverse_transform([pred_class])[0]
        confidence = float(pred_proba[pred_class])
        
        # Get all crop scores
        all_crops = {}
        for i, crop in enumerate(crop_types):
            all_crops[crop] = float(pred_proba[i])
        
        # Sort by score
        sorted_crops = sorted(all_crops.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "recommended_crop": recommended_crop,
            "confidence": confidence,
            "all_crops": dict(sorted_crops),
            "input_features": feature_map
        }
    
    except Exception as e:
        return {"error": str(e)}

@router.post("/crop/batch")
async def recommend_crop_batch(req: CropBatchRequest):
    """
    Recommend crops for multiple fields.
    
    Input:
    - fields: List of dicts with soil/weather data
    
    Returns:
    - recommendations: List of crop recommendations
    """
    try:
        recommendations = []
        
        for field in req.fields:
            n = field.get('N') or field.get('Soil_N', 50.0)
            p = field.get('P') or field.get('Soil_P', 30.0)
            k = field.get('K') or field.get('Soil_K', 40.0)
            ph = field.get('pH') or field.get('Soil_pH', 6.5)
            temp = field.get('Temperature', 25.0)
            moisture = field.get('SoilMoisture', 50.0)
            rainfall = field.get('Rainfall', 200.0)
            
            feature_map = {
                'Soil_N': n,
                'Soil_P': p,
                'Soil_K': k,
                'Soil_pH': ph,
                'Temperature': temp,
                'SoilMoisture': moisture,
                'Rainfall': rainfall
            }
            
            features = [feature_map.get(col, 0.0) for col in feature_cols]
            X = np.array(features).reshape(1, -1)
            
            pred_class = crop_model.predict(X)[0]
            pred_proba = crop_model.predict_proba(X)[0]
            
            recommended_crop = label_encoder.inverse_transform([pred_class])[0]
            
            recommendations.append({
                "field_id": field.get('field_id'),
                "recommended_crop": recommended_crop,
                "confidence": float(pred_proba[pred_class])
            })
        
        return {"recommendations": recommendations}
    
    except Exception as e:
        return {"error": str(e)}

@router.get("/crop/types")
async def get_crop_types():
    """Get list of available crop types"""
    return {"crop_types": crop_types}
