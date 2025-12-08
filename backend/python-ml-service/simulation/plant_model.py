import numpy as np
from datetime import datetime

class Plant:
    def __init__(self, plant_id, spectral, agro):
        self.plant_id = plant_id
        self.spectral = spectral.astype(float)
        self.agro = agro

        self.ndvi = 0.0
        self.disease_prob = float(np.random.beta(1.5, 20))
        self.health = 1.0 - self.disease_prob
        self.yield_prediction = None
        self.disease_status = "healthy"  # healthy, at_risk, diseased

    def compute_ndvi(self, red_idx, nir_idx):
        red = float(self.spectral[red_idx])
        nir = float(self.spectral[nir_idx])
        self.ndvi = float((nir - red) / (nir + red + 1e-6))
        return self.ndvi

    def perturb(self):
        for k, v in list(self.agro.items()):
            if isinstance(v, (int, float)):
                self.agro[k] = float(max(0.0, v + np.random.normal(0, abs(v) * 0.005 + 0.1)))

        noise = np.random.normal(0, 0.002, size=self.spectral.shape)
        self.spectral = (self.spectral + noise).astype(float)

        self.disease_prob = float(min(1.0, max(0.0, self.disease_prob + np.random.normal(0, 0.01))))
        self.health = 1.0 - self.disease_prob
        
        # Update disease status based on probability
        if self.disease_prob < 0.3:
            self.disease_status = "healthy"
        elif self.disease_prob < 0.6:
            self.disease_status = "at_risk"
        else:
            self.disease_status = "diseased"

    def to_dict(self):
        return {
            "plant_id": int(self.plant_id),
            "ndvi": float(self.ndvi),
            "health": float(self.health),
            "disease_prob": float(self.disease_prob),
            "disease_status": self.disease_status,
            "yield": None if self.yield_prediction is None else float(self.yield_prediction),
            "agro": self.agro
        }


class Field:
    def __init__(self, field_id, crop_type, plants):
        self.field_id = int(field_id)
        self.crop_type = crop_type
        self.plants = plants

        self.avg_ndvi = 0.0
        self.avg_health = 0.0
        self.avg_yield = 0.0
        self.disease_risk = 0.0
        self.last_updated = datetime.utcnow()
        
        # New fields for crop recommendation
        self.recommended_crop = crop_type  # Default to current crop
        self.crop_confidence = 0.0

    def compute_aggregates(self):
        ndvis = [p.ndvi for p in self.plants]
        healths = [p.health for p in self.plants]
        yields = [p.yield_prediction for p in self.plants if p.yield_prediction is not None]
        disease_probs = [p.disease_prob for p in self.plants]

import numpy as np
from datetime import datetime

class Plant:
    def __init__(self, plant_id, spectral, agro):
        self.plant_id = plant_id
        self.spectral = spectral.astype(float)
        self.agro = agro

        self.ndvi = 0.0
        
        # VARIANCE UPDATE: "Develop bad plants"
        # 80% chance of being healthy (Beta 1.5, 20 -> Mean 0.07)
        # 20% chance of being unhealthy (Beta 5, 5 -> Mean 0.5)
        if np.random.random() < 0.8:
             self.disease_prob = float(np.random.beta(1.5, 20))
        else:
             self.disease_prob = float(np.random.uniform(0.3, 0.7)) # Start "Bad"

        self.health = 1.0 - self.disease_prob
        self.yield_prediction = None
        
        # Init status
        if self.disease_prob < 0.3:
            self.disease_status = "healthy"
        elif self.disease_prob < 0.6:
            self.disease_status = "at_risk"
        else:
            self.disease_status = "diseased"

    def compute_ndvi(self, red_idx, nir_idx):
        red = float(self.spectral[red_idx])
        nir = float(self.spectral[nir_idx])
        self.ndvi = float((nir - red) / (nir + red + 1e-6))
        return self.ndvi

    def perturb(self):
        # 1. Random fluctuation of environmental conditions (Nature)
        # But also tend to revert to mean if extreme? No, random walk is fine for short term.
        for k, v in list(self.agro.items()):
            if isinstance(v, (int, float)):
                # Small random drift
                drift = np.random.normal(0, abs(v) * 0.005 + 0.1)
                self.agro[k] = float(max(0.0, v + drift))

        # 2. Calculate "Growth Potential" based on conditions (Biological Logic)
        # Optimal Ranges: N(50-100), P(40-80), K(40-80), M(30-70), T(20-35)
        n = self.agro.get("Soil_N", 0)
        p = self.agro.get("Soil_P", 0)
        k = self.agro.get("Soil_K", 0)
        m = self.agro.get("SoilMoisture", 0)
        t = self.agro.get("Temperature", 0)
        irr = self.agro.get("Irrigation", 0) # Irrigation boosts growth
        
        growth = 0.0
        # Nitrogen Factor
        if n > 40: growth += 0.002
        if n > 120: growth -= 0.001 # Toxicity
        
        # Hydration Factor (Moisture + Irrigation)
        effective_water = m + (irr * 0.5)
        if 40 <= effective_water <= 80:
            growth += 0.003
        elif effective_water < 20:
            growth -= 0.005 # Drought stress
            
        # Temperature Factor
        if 20 <= t <= 32:
            growth += 0.001
        elif t > 40 or t < 5:
            growth -= 0.002 # Thermal stress
            
        # Disease Penalty
        if self.disease_prob > 0.4:
            growth -= (self.disease_prob * 0.01) # Disease eats growth
            
        # 3. Apply Growth to Spectral Signature (Photosynthesis)
        # Healthy plants absorb more Red, reflect more NIR.
        # We find Red/NIR indices from the main loop, but here we just add noise/trend to whole spectrum?
        # Ideally we need red_idx/nir_idx here. But we don't store them in self.
        # Workaround: We add 'growth' to ALL bands? No.
        # We can assume typical bands. Or pass indices to perturb?
        # For now, let's just add small positive drift to "High" bands and negative to "Low" bands as a proxy, 
        # OR relying on the fact that `compute_ndvi` recalculates self.ndvi.
        # Actually, let's just MODIFY self.ndvi directly here for logic, BUT `compute_ndvi` overwrites it.
        # So we MUST modify spectral.
        
        # Simplified: Just add random noise, but bias the mean based on 'growth'.
        # If growth > 0, we want overall 'reflectance' in NIR to go up?
        # Since we don't know which index is NIR here, we will just add noise.
        # WAIT! Yield Model uses `spectral` AND `agro`.
        # If we improve `agro`, Yield Model (CNN) should predict higher yield! 
        # So step 1 (Agro update) is consistent.
        # But we also want NDVI to go up.
        # Let's forcefully "Drift" the spectral signal in a way that *usually* implies health if we can.
        # Without band indices, we can't do specific Red/NIR drift.
        # However, `FieldProcessor` CALLS `compute_ndvi(red, nir)` right after `perturb()`.
        # So if we want NDVI to go up, we can cheat slightly:
        # We can't cheat spectral easily without indices.
        
        # REVISION: Just stick to Agro drift + Random Spectral noise.
        # BUT verify that yield model actually *cares* about Agro. 
        # If Yield Model is dominated by Spectral, and Spectral is just random noise, Yield won't improve.
        # Solution: Let's assume the CNN learned that High N = High Yield.
        # So fixing N should fix Yield.
        
        noise = np.random.normal(0, 0.002, size=self.spectral.shape)
        self.spectral = (self.spectral + noise).astype(float)

        # 4. Disease Dynamics
        # Disease grows if moisture is high (>80) and temp is moderate (20-30).
        # Disease dies if temp > 35 or very dry.
        disease_pressure = 0.0
        if m > 80 and 20 < t < 30:
            disease_pressure = 0.02
        elif t > 35 or m < 20:
            disease_pressure = -0.05 # Disease dies
            
        self.disease_prob = float(min(1.0, max(0.0, self.disease_prob + disease_pressure + np.random.normal(0, 0.01))))
        self.health = 1.0 - self.disease_prob
        
        # Update disease status
        if self.disease_prob < 0.3:
            self.disease_status = "healthy"
        elif self.disease_prob < 0.6:
            self.disease_status = "at_risk"
        else:
            self.disease_status = "diseased"

    def to_dict(self):
        return {
            "plant_id": int(self.plant_id),
            "ndvi": float(self.ndvi),
            "health": float(self.health),
            "disease_prob": float(self.disease_prob),
            "disease_status": self.disease_status,
            "yield": None if self.yield_prediction is None else float(self.yield_prediction),
            "agro": self.agro
        }


class Field:
    def __init__(self, field_id, crop_type, plants):
        self.field_id = int(field_id)
        self.crop_type = crop_type
        self.plants = plants

        self.avg_ndvi = 0.0
        self.avg_health = 0.0
        self.avg_yield = 0.0
        self.disease_risk = 0.0
        
        # Soil/Environmental Aggregates (NEW)
        self.avg_nitrogen = 0.0
        self.avg_phosphorus = 0.0
        self.avg_potassium = 0.0
        self.avg_moisture = 0.0
        self.avg_temperature = 0.0
        self.avg_rainfall = 0.0
        self.avg_ph = 6.5
        
        self.last_updated = datetime.utcnow()
        

    def compute_aggregates(self):
        ndvis = [p.ndvi for p in self.plants]
        healths = [p.health for p in self.plants]
        yields = [p.yield_prediction for p in self.plants if p.yield_prediction is not None]
        disease_probs = [p.disease_prob for p in self.plants]

        self.avg_ndvi = float(np.mean(ndvis)) if ndvis else 0.0
        self.avg_health = float(np.mean(healths)) if healths else 0.0
        self.avg_yield = float(np.mean(yields)) if yields else 0.0
        self.disease_risk = float(np.mean(disease_probs)) if disease_probs else 0.0
        
        # Soil/Environmental Aggregates (NEW)
        if self.plants:
            self.avg_nitrogen = float(np.mean([p.agro.get("Soil_N", 0) for p in self.plants]))
            self.avg_phosphorus = float(np.mean([p.agro.get("Soil_P", 0) for p in self.plants]))
            self.avg_potassium = float(np.mean([p.agro.get("Soil_K", 0) for p in self.plants]))
            self.avg_moisture = float(np.mean([p.agro.get("SoilMoisture", 0) for p in self.plants]))
            self.avg_temperature = float(np.mean([p.agro.get("Temperature", 0) for p in self.plants]))
            self.avg_rainfall = float(np.mean([p.agro.get("Rainfall", 0) for p in self.plants]))
            self.avg_ph = float(np.mean([p.agro.get("Soil_pH", 6.5) for p in self.plants]))
        
        self.last_updated = datetime.utcnow()

    def to_dict(self, include_plants=True):
        base = {
            "field_id": self.field_id,
            "crop_type": self.crop_type,
            "avg_ndvi": self.avg_ndvi,
            "avg_health": self.avg_health,
            "avg_yield": self.avg_yield,
            "disease_risk": self.disease_risk,
            # Soil/Environmental Aggregates (NEW)
            "avg_nitrogen": self.avg_nitrogen,
            "avg_phosphorus": self.avg_phosphorus,
            "avg_potassium": self.avg_potassium,
            "avg_moisture": self.avg_moisture,
            "avg_temperature": self.avg_temperature,
            "avg_rainfall": self.avg_rainfall,
            "avg_ph": self.avg_ph,
            # Metadata
            "last_updated": self.last_updated.isoformat(),
            "plants_count": len(self.plants)
        }
        if include_plants:
            base["plants"] = [p.to_dict() for p in self.plants]
        return base

