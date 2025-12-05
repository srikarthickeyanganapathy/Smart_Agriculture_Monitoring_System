
import pandas as pd
import numpy as np
from .plant_model import Plant, Field
from utils.alert_publisher import send_alert # Still can be used if we want Python to push alerts, or better return them.
# The user said "Python does NOT generate alerts. Spring Boot does." 
# So we will remove direct alert publishing from here and let Spring handle it based on values.

DATASET_PATH = "models/enhanced_agri_dataset.csv"

class FieldProcessor:
    """
    Stateless processor for Digital Twin simulation.
    """
    def __init__(self):
        # Load dataset once for sampling
        try:
            self.df = pd.read_csv(DATASET_PATH)
            self.df_sample = self.df.sample(n=min(200, len(self.df)), random_state=42)
            self.spectral_bands = [c for c in self.df.columns if c.startswith("X")]
            
            # find 660nm and 860nm indices
            nums = np.array([int(b[1:]) for b in self.spectral_bands])
            self.red_idx = int(np.argmin(abs(nums - 660)))
            self.nir_idx = int(np.argmin(abs(nums - 860)))
            
            self.crop_types = ["corn", "cotton", "rice", "soybean", "winter wheat"]
            self.n_bands = len(self.spectral_bands)
            
        except Exception as e:
            print(f"Error loading dataset: {e}")
            self.df_sample = None

    def sample_spectral(self):
        if self.df_sample is None:
            return np.random.rand(131) # Fallback
        row = self.df_sample.sample(n=1).iloc[0]
        return np.array([row[b] for b in self.spectral_bands], dtype=float)

    def sample_agro(self):
        df = self.df_sample
        if df is None:
            # Fallback randoms
            return {
                "Soil_N": 60.0,"Soil_P": 40.0, "Soil_K": 40.0, "Soil_pH": 6.5,
                "Rainfall": 100.0, "Temperature": 25.0, "SoilMoisture": 50.0
            }
            
        return {
            "Soil_N": float(max(1.0, np.random.normal(df["Soil_N"].mean(), 5))),
            "Soil_P": float(max(1.0, np.random.normal(df["Soil_P"].mean(), 3))),
            "Soil_K": float(max(1.0, np.random.normal(df["Soil_K"].mean(), 10))),
            "Soil_pH": float(min(8.5, max(4.0, np.random.normal(df["Soil_pH"].mean(), 0.3)))),
            "Rainfall": float(max(0, np.random.normal(df["Rainfall"].mean(), 40))),
            "Temperature": float(np.random.normal(27, 3)),
            "SoilMoisture": float(min(100, max(0, np.random.normal(45, 10)))),
            "Irrigation": 0.0,
            "Fertilizer": 0.0
        }

    def generate_initial_state(self, n_fields=5, plants_per_field=100) -> list:
        """GET /simulate/init uses this"""
        fields = []
        plant_id = 0
        for i in range(n_fields):
            crop = self.crop_types[i % len(self.crop_types)]
            plants = []
            for _ in range(plants_per_field):
                spec = self.sample_spectral()
                agro = self.sample_agro()
                p = Plant(plant_id, spec, agro)
                p.compute_ndvi(self.red_idx, self.nir_idx)
                plants.append(p)
                plant_id += 1
            
            f = Field(i + 1, crop, plants)
            f.compute_aggregates()
            fields.append(f.to_dict())
            
        return fields

    def process_step(self, fields_state: list, yield_model_func) -> list:
        """
        POST /simulate/step uses this.
        Takes current state -> Perturbs -> Predicts -> Returns next state.
        fields_state: list of dicts (from DB)
        """
        fields = []
        global_plant_id = 0
        
        # 1. Hydrate (Reconstruct Objects)
        for f_data in fields_state:
            field_id = f_data.get("field_id", f_data.get("fieldId", 0))
            crop_type = f_data.get("crop_type", f_data.get("cropType", "unknown"))
            plants_data = f_data.get("plants", [])
            
            plants_objs = []
            
            if plants_data:
                for p_data in plants_data:
                    # Agro params
                    agro = p_data.get("agro", {})
                    # Clean/Normalize agro keys if needed
                    
                    # Ensure spectral exists (if not, resample)
                    spec = self.sample_spectral() 
                    
                    p = Plant(p_data.get("plant_id", global_plant_id), spec, agro)
                    p.ndvi = float(p_data.get("ndvi", 0.0))
                    p.health = float(p_data.get("health", 1.0))
                    p.disease_prob = float(p_data.get("disease_prob", 0.0))
                    
                    plants_objs.append(p)
                    global_plant_id += 1
            else:
                 # SELF-HEALING: If plants are missing (e.g. fresh DB record), regenerate them.
                 # Try to use field averages to seed the generation for continuity.
                 reconstructed_count = 100 # Default
                 
                 # Extract averages if available
                 avg_n = float(f_data.get("avg_nitrogen", f_data.get("avgNitrogen", 60.0)))
                 avg_p = float(f_data.get("avg_phosphorus", f_data.get("avgPhosphorus", 40.0)))
                 avg_k = float(f_data.get("avg_potassium", f_data.get("avgPotassium", 40.0)))
                 avg_m = float(f_data.get("avg_moisture", f_data.get("avgMoisture", 50.0)))
                 avg_temp = float(f_data.get("avg_temperature", f_data.get("avgTemperature", 25.0)))
                 avg_rain = float(f_data.get("avg_rainfall", f_data.get("avgRainfall", 100.0)))
                 avg_irr = float(f_data.get("avg_irrigation", f_data.get("avgIrrigation", 0.0)))
                 
                 for _ in range(reconstructed_count):
                     spec = self.sample_spectral()
                     
                     # Generate plants distributed around the average
                     agro = {
                        "Soil_N": max(0, np.random.normal(avg_n, 5)),
                        "Soil_P": max(0, np.random.normal(avg_p, 3)),
                        "Soil_K": max(0, np.random.normal(avg_k, 10)),
                        "Soil_pH": 6.5, # Default
                        "Rainfall": max(0, np.random.normal(avg_rain, 20)),
                        "Temperature": np.random.normal(avg_temp, 2),
                        "SoilMoisture": max(0, min(100, np.random.normal(avg_m, 10))),
                        "Irrigation": avg_irr,
                        "Fertilizer": 0.0
                     }
                     
                     p = Plant(global_plant_id, spec, agro)
                     p.compute_ndvi(self.red_idx, self.nir_idx)
                     plants_objs.append(p)
                     global_plant_id += 1

            f = Field(field_id, crop_type, plants_objs)
            fields.append(f)
            
        # 2. Simulate (Perturb & Compute)
        for f in fields:
            for p in f.plants:
                p.perturb() # Change moisture, NPK, disease
                p.compute_ndvi(self.red_idx, self.nir_idx) # Recalc NDVI
        
        # 3. Predict Yield (Batch)
        # Flatten all plants
        all_plants = [p for f in fields for p in f.plants]
        if all_plants and yield_model_func:
            spec_batch = np.stack([p.spectral for p in all_plants], axis=0)
            spec_batch = spec_batch.reshape(spec_batch.shape[0], self.n_bands, 1)

            agro_keys = ["Soil_N", "Soil_P", "Soil_K", "Soil_pH", "Rainfall", "Temperature", "SoilMoisture"]
            # Helper to get safe float
            def get_val(d, k): return float(d.get(k, 0.0))
            
            agro_batch = np.array([[get_val(p.agro, k) for k in agro_keys] for p in all_plants], dtype=float)
            
            preds = yield_model_func(spec_batch, agro_batch)
            for i, p in enumerate(all_plants):
                 p.yield_prediction = float(preds[i])

        # 4. Final Aggregates
        results = []
        alerts = []
        
        for f in fields:
            f.compute_aggregates()
            results.append(f.to_dict())
            
            # Stateless Alert Checks
            # ROI: Logic remains in Python, Execution in Spring Boot
            if f.avg_ndvi < 0.3:
                alerts.append({
                    "field_id": f.field_id,
                    "type": "LowNDVI",
                    "level": "warning",
                    "message": f"Field {f.field_id} avg NDVI {f.avg_ndvi:.3f}"
                })
            
            if f.disease_risk > 0.4:
                alerts.append({
                    "field_id": f.field_id,
                    "type": "HighDisease",
                    "level": "critical",
                    "message": f"High disease risk {f.disease_risk:.2f} in Field {f.field_id}"
                })
                
            # Irrigation check (avg of plants)
            if f.plants:
                avg_irrigation = float(np.mean([p.agro.get("Irrigation", 0) for p in f.plants]))
                if avg_irrigation < 20:
                    alerts.append({
                        "field_id": f.field_id,
                        "type": "LowIrrigation",
                        "level": "warning",
                        "message": f"Low irrigation avg {avg_irrigation:.1f}"
                    })
            
        return results, alerts

