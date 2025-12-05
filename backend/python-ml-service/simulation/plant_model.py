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
        

    def compute_aggregates(self):
        ndvis = [p.ndvi for p in self.plants]
        healths = [p.health for p in self.plants]
        yields = [p.yield_prediction for p in self.plants if p.yield_prediction is not None]
        disease_probs = [p.disease_prob for p in self.plants]

        self.avg_ndvi = float(np.mean(ndvis)) if ndvis else 0.0
        self.avg_health = float(np.mean(healths)) if healths else 0.0
        self.avg_yield = float(np.mean(yields)) if yields else 0.0
        self.disease_risk = float(np.mean(disease_probs)) if disease_probs else 0.0
        self.last_updated = datetime.utcnow()

    def to_dict(self, include_plants=True):
        base = {
            "field_id": self.field_id,
            "crop_type": self.crop_type,
            "avg_ndvi": self.avg_ndvi,
            "avg_health": self.avg_health,
            "avg_yield": self.avg_yield,
            "disease_risk": self.disease_risk,
            "last_updated": self.last_updated.isoformat(),
            "plants_count": len(self.plants)
        }
        if include_plants:
            base["plants"] = [p.to_dict() for p in self.plants]
        return base
