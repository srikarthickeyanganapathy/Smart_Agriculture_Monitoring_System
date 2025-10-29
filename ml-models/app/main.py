from fastapi import FastAPI
from pydantic import BaseModel
from .predict import predict_crop_from_uri, load_npy

app = FastAPI(title="ML Service")

class CropRequest(BaseModel):
    file_uri: str
    fieldId: str | None = None

@app.post("/predict/crop")
async def predict_crop(req: CropRequest):
    return await predict_crop_from_uri(req.file_uri, req.fieldId)
