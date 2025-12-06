from fastapi import APIRouter
import numpy as np
from utils.model_loader import load_yield_model

router = APIRouter()

model, scaler = load_yield_model()

@router.post("/yield")
async def predict(payload: dict):
    try:
        spectral = np.array(payload["spectral"]).reshape(1, -1, 1)
        agro = np.array(payload["agro"]).reshape(1, -1)
        agro_scaled = scaler.transform(agro)

        pred = model.predict({
            "spectral_input": spectral,
            "agro_input": agro_scaled
        }, verbose=0)[0][0]

        return {"yield": float(pred)}

    except Exception as e:
        return {"error": str(e)}
