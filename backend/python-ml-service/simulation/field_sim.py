import pandas as pd
import numpy as np
import asyncio
from .plant_model import Plant, Field
from utils.alert_publisher import send_alert

DATASET_PATH = "models/enhanced_agri_dataset.csv"

# Try to load crop model for recommendations
try:
    from utils.model_loader import load_crop_model
    crop_model, crop_label_encoder, crop_feature_cols, crop_types = load_crop_model()
    CROP_MODEL_AVAILABLE = True
except Exception as e:
    print(f"Crop model not available: {e}")
    CROP_MODEL_AVAILABLE = False
    crop_model = None

class FieldSimulation:
    def __init__(self, n_fields=5, plants_per_field=100, update_interval=5):
        self.n_fields = n_fields
        self.plants_per_field = plants_per_field
        self.update_interval = update_interval

        self.df = pd.read_csv(DATASET_PATH)
        self.df_sample = self.df.sample(n=min(200, len(self.df)), random_state=42)

        self.spectral_bands = [c for c in self.df.columns if c.startswith("X")]
        self.n_bands = len(self.spectral_bands)

        # find 660nm and 860nm nearest indices
        nums = np.array([int(b[1:]) for b in self.spectral_bands])
        self.red_idx = int(np.argmin(abs(nums - 660)))
        self.nir_idx = int(np.argmin(abs(nums - 860)))

        self.crop_types = ["corn", "cotton", "rice", "soybean", "winter wheat"]
        self.fields = []
        self._running = False

    def sample_spectral(self):
        row = self.df_sample.sample(n=1).iloc[0]
        return np.array([row[b] for b in self.spectral_bands], dtype=float)

    def sample_agro(self):
        df = self.df_sample
        return {
            "Soil_N": float(max(1.0, np.random.normal(df["Soil_N"].mean(), 5))),
            "Soil_P": float(max(1.0, np.random.normal(df["Soil_P"].mean(), 3))),
            "Soil_K": float(max(1.0, np.random.normal(df["Soil_K"].mean(), 10))),
            "Soil_pH": float(min(8.5, max(4.0, np.random.normal(df["Soil_pH"].mean(), 0.3)))),
            "Rainfall": float(max(0, np.random.normal(df["Rainfall"].mean(), 40))),
            "Temperature": float(np.random.normal(27, 3)),
            "SoilMoisture": float(min(100, max(0, np.random.normal(45, 10)))),
        }

    def compute_crop_recommendation(self, field):
        """Compute recommended crop for a field based on average soil conditions"""
        if not CROP_MODEL_AVAILABLE:
            return
        
        try:
            # Get average agro conditions for the field
            avg_n = float(np.mean([p.agro.get("Soil_N", 50) for p in field.plants]))
            avg_p = float(np.mean([p.agro.get("Soil_P", 30) for p in field.plants]))
            avg_k = float(np.mean([p.agro.get("Soil_K", 40) for p in field.plants]))
            avg_ph = float(np.mean([p.agro.get("Soil_pH", 6.5) for p in field.plants]))
            avg_temp = float(np.mean([p.agro.get("Temperature", 25) for p in field.plants]))
            avg_moisture = float(np.mean([p.agro.get("SoilMoisture", 50) for p in field.plants]))
            avg_rainfall = float(np.mean([p.agro.get("Rainfall", 200) for p in field.plants]))
            
            feature_map = {
                'Soil_N': avg_n,
                'Soil_P': avg_p,
                'Soil_K': avg_k,
                'Soil_pH': avg_ph,
                'Temperature': avg_temp,
                'SoilMoisture': avg_moisture,
                'Rainfall': avg_rainfall
            }
            
            features = [feature_map.get(col, 0.0) for col in crop_feature_cols]
            X = np.array(features).reshape(1, -1)
            
            pred_class = crop_model.predict(X)[0]
            pred_proba = crop_model.predict_proba(X)[0]
            
            field.recommended_crop = crop_label_encoder.inverse_transform([pred_class])[0]
            field.crop_confidence = float(pred_proba[pred_class])
        except Exception as e:
            print(f"Error computing crop recommendation: {e}")

    def create_fields(self):
        self.fields = []
        plant_id = 0

        for i in range(self.n_fields):
            crop = self.crop_types[i % len(self.crop_types)]
            plants = []

            for _ in range(self.plants_per_field):
                spec = self.sample_spectral()
                agro = self.sample_agro()
                p = Plant(plant_id, spec, agro)
                p.compute_ndvi(self.red_idx, self.nir_idx)
                plants.append(p)
                plant_id += 1

            f = Field(i + 1, crop, plants)
            f.compute_aggregates()
            self.compute_crop_recommendation(f)
            self.fields.append(f)

    async def start(self, yield_predict_batch_fn=None):
        if not self.fields:
            self.create_fields()

        self._running = True

        while self._running:
            for f in self.fields:
                for p in f.plants:
                    p.perturb()
                    p.compute_ndvi(self.red_idx, self.nir_idx)
                f.compute_aggregates()

            if yield_predict_batch_fn:
                for f in self.fields:
                    spec_batch = np.stack([p.spectral for p in f.plants], axis=0)
                    spec_batch = spec_batch.reshape(spec_batch.shape[0], self.n_bands, 1)

                    agro_keys = ["Soil_N", "Soil_P", "Soil_K", "Soil_pH", "Rainfall", "Temperature", "SoilMoisture"]
                    agro_batch = np.array([[p.agro[k] for k in agro_keys] for p in f.plants], dtype=float)

                    preds = yield_predict_batch_fn(spec_batch, agro_batch)
                    preds = np.array(preds).reshape(-1)

                    for pi, p in enumerate(f.plants):
                        p.yield_prediction = float(preds[pi])

                for f in self.fields:
                    f.compute_aggregates()
                    # Compute crop recommendation periodically
                    self.compute_crop_recommendation(f)
                    
                    # Alert checks
                    if f.avg_ndvi < 0.3:
                        send_alert(f.field_id, "LowNDVI", "warning", f"Field {f.field_id} avg NDVI {f.avg_ndvi:.3f}")
                    if f.disease_risk > 0.4:
                        send_alert(f.field_id, "HighDisease", "critical", f"High disease risk {f.disease_risk:.2f} in Field {f.field_id}")
                    avg_irrigation = float(sum(p.agro.get("Irrigation",0) for p in f.plants)/len(f.plants))
                    if avg_irrigation < 20:
                        send_alert(f.field_id, "LowIrrigation", "warning", f"Low irrigation avg {avg_irrigation:.1f}")



            await asyncio.sleep(self.update_interval)

    def stop(self):
        self._running = False

