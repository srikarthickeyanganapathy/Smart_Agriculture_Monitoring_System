# stateful_field_sim.py
# Stateful Redis-backed (or in-memory fallback) field simulation
# This replaces the stateless field_sim.py approach with persistent state

import os
import time
import base64
import numpy as np
import msgpack
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

# Attempt Redis import, fallback to in-memory if unavailable
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("WARNING: redis package not installed. Using in-memory storage.")

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
BANDS = 131
PLANTS_PER_FIELD = 100
FIELD_KEY_PREFIX = "field_state:"

# ---- Crop-Specific Parameters ----
CROP_PROFILES = {
    "corn": {
        "growth_rate": 1.2,        # Relative growth speed (1.0 = baseline)
        "temp_optimal": 27.0,      # Optimal temperature (°C)
        "temp_min": 10.0,          # Minimum viable temperature
        "temp_max": 40.0,          # Maximum viable temperature
        "water_need": 0.8,         # Water requirement (0-1 scale)
        "maturity_days": 120,      # Days to full maturity
        "stages": {                # Growth stages (day ranges)
            "seedling": (0, 20),
            "vegetative": (20, 55),
            "flowering": (55, 80),
            "maturation": (80, 120)
        },
        "yield_potential": 9.5     # Max yield (tons/hectare)
    },
    "rice": {
        "growth_rate": 1.0,
        "temp_optimal": 30.0,
        "temp_min": 15.0,
        "temp_max": 38.0,
        "water_need": 1.0,         # Highest water need
        "maturity_days": 150,
        "stages": {
            "seedling": (0, 25),
            "vegetative": (25, 60),
            "flowering": (60, 100),
            "maturation": (100, 150)
        },
        "yield_potential": 7.0
    },
    "cotton": {
        "growth_rate": 0.9,
        "temp_optimal": 30.0,
        "temp_min": 15.0,
        "temp_max": 42.0,
        "water_need": 0.5,         # Drought tolerant
        "maturity_days": 180,
        "stages": {
            "seedling": (0, 30),
            "vegetative": (30, 70),
            "flowering": (70, 120),
            "maturation": (120, 180)
        },
        "yield_potential": 2.5
    },
    "soybean": {
        "growth_rate": 1.1,
        "temp_optimal": 25.0,
        "temp_min": 10.0,
        "temp_max": 35.0,
        "water_need": 0.7,
        "maturity_days": 100,
        "stages": {
            "seedling": (0, 15),
            "vegetative": (15, 40),
            "flowering": (40, 70),
            "maturation": (70, 100)
        },
        "yield_potential": 3.5
    },
    "winter wheat": {
        "growth_rate": 0.7,        # Slower growing
        "temp_optimal": 18.0,      # Cooler climate
        "temp_min": 0.0,           # Frost tolerant
        "temp_max": 32.0,
        "water_need": 0.6,
        "maturity_days": 240,      # Long season
        "stages": {
            "seedling": (0, 30),
            "vegetative": (30, 120),
            "flowering": (120, 180),
            "maturation": (180, 240)
        },
        "yield_potential": 6.0
    }
}

# Default crop profile for unknown types
DEFAULT_CROP = {
    "growth_rate": 1.0,
    "temp_optimal": 25.0,
    "temp_min": 10.0,
    "temp_max": 38.0,
    "water_need": 0.7,
    "maturity_days": 120,
    "stages": {
        "seedling": (0, 20),
        "vegetative": (20, 50),
        "flowering": (50, 80),
        "maturation": (80, 120)
    },
    "yield_potential": 5.0
}


def get_crop_profile(crop_type: str) -> dict:
    """Get crop-specific parameters, falling back to default"""
    return CROP_PROFILES.get(crop_type.lower(), DEFAULT_CROP)


def get_growth_stage(crop_type: str, day: int) -> str:
    """Determine current growth stage based on crop type and day"""
    profile = get_crop_profile(crop_type)
    stages = profile["stages"]
    
    for stage_name, (start, end) in stages.items():
        if start <= day < end:
            return stage_name
    
    return "harvest_ready" if day >= profile["maturity_days"] else "maturation"


# In-memory fallback storage
_memory_store: Dict[str, bytes] = {}


# ---- Pydantic models ----
class EnvParams(BaseModel):
    temp_c: float = 25.0
    sunlight: float = 0.7  # 0-1
    rainfall_mm: float = 50.0


class InitFieldRequest(BaseModel):
    field_id: str
    plants: Optional[int] = PLANTS_PER_FIELD
    crop_type: Optional[str] = "corn"
    initial_env: Optional[EnvParams] = None


class StepRequest(BaseModel):
    field_id: str
    delta_days: float = 1.0


class StepBatchRequest(BaseModel):
    field_ids: List[str]
    delta_days: float = 1.0


# ---- Storage adapter (Redis or in-memory) ----
class StateStorage:
    """Unified interface for Redis or in-memory storage"""
    
    def __init__(self):
        self.redis_client = None
        self.use_redis = False
        
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.from_url(REDIS_URL)
                self.redis_client.ping()  # Test connection
                self.use_redis = True
                print(f"✓ Connected to Redis: {REDIS_URL}")
            except Exception as e:
                print(f"⚠ Redis connection failed: {e}. Using in-memory storage.")
                self.use_redis = False
    
    def _key(self, field_id: str) -> str:
        return FIELD_KEY_PREFIX + field_id
    
    def set(self, field_id: str, data: bytes):
        key = self._key(field_id)
        if self.use_redis:
            self.redis_client.set(key, data)
        else:
            _memory_store[key] = data
    
    def get(self, field_id: str) -> Optional[bytes]:
        key = self._key(field_id)
        if self.use_redis:
            return self.redis_client.get(key)
        else:
            return _memory_store.get(key)
    
    def exists(self, field_id: str) -> bool:
        key = self._key(field_id)
        if self.use_redis:
            return self.redis_client.exists(key)
        else:
            return key in _memory_store
    
    def delete(self, field_id: str):
        key = self._key(field_id)
        if self.use_redis:
            self.redis_client.delete(key)
        else:
            _memory_store.pop(key, None)
    
    def keys(self, pattern: str = "*") -> List[str]:
        if self.use_redis:
            return [k.decode() if isinstance(k, bytes) else k 
                    for k in self.redis_client.keys(FIELD_KEY_PREFIX + pattern)]
        else:
            prefix = FIELD_KEY_PREFIX + pattern.replace("*", "")
            return [k for k in _memory_store.keys() if k.startswith(prefix) or pattern == "*"]


# Global storage instance
storage = StateStorage()


# ---- Serialization helpers ----
def serialize_state(state: Dict[str, Any]) -> bytes:
    """Pack state to compact binary format"""
    packed = {
        "meta": {
            "plants": state["spectra"].shape[0],
            "bands": state["spectra"].shape[1],
            "last_ts": state["last_ts"],
            "env": state["env"],
            "crop_type": state.get("crop_type", "corn"),
            "day": state.get("day", 0),
            # Alert consequence tracking
            "unresolved_alerts": state.get("unresolved_alerts", 0),
            "damage_accumulator": state.get("damage_accumulator", 0.0),
            "last_fixed": state.get("last_fixed", 0)
        },
        "spectra_b64": base64.b64encode(state["spectra"].astype(np.float32).tobytes()).decode(),
        "agro_b64": base64.b64encode(np.array(state["agro"], dtype=np.float32).tobytes()).decode()
    }
    return msgpack.packb(packed, use_bin_type=True)


def deserialize_state(blob: bytes) -> Dict[str, Any]:
    """Unpack binary state to dict"""
    unpacked = msgpack.unpackb(blob, raw=False)
    meta = unpacked["meta"]
    
    spectra_bytes = base64.b64decode(unpacked["spectra_b64"])
    spectra = np.frombuffer(spectra_bytes, dtype=np.float32).reshape(meta["plants"], meta["bands"])
    
    agro_bytes = base64.b64decode(unpacked["agro_b64"])
    # Agro: 7 values per plant (N, P, K, pH, Rainfall, Temp, Moisture)
    agro = np.frombuffer(agro_bytes, dtype=np.float32).reshape(meta["plants"], 7)
    
    return {
        "spectra": spectra,
        "agro": agro,
        "last_ts": meta["last_ts"],
        "env": meta["env"],
        "crop_type": meta.get("crop_type", "corn"),
        "day": meta.get("day", 0),
        # Alert consequence tracking
        "unresolved_alerts": meta.get("unresolved_alerts", 0),
        "damage_accumulator": meta.get("damage_accumulator", 0.0),
        "last_fixed": meta.get("last_fixed", 0)
    }


# ---- Spectral band indices (660nm Red, 860nm NIR) ----
# For 131 bands spanning 400-2500nm: step ~16nm
RED_IDX = 16   # ~660nm
NIR_IDX = 29   # ~860nm


def compute_ndvi(spectra: np.ndarray) -> np.ndarray:
    """Compute NDVI for all plants. Shape: (plants,)"""
    red = spectra[:, RED_IDX]
    nir = spectra[:, NIR_IDX]
    return (nir - red) / (np.maximum(nir + red, 1e-6))


def compute_metrics(spectra: np.ndarray, agro: np.ndarray) -> Dict[str, float]:
    """Compute aggregate field metrics"""
    ndvi = compute_ndvi(spectra)
    
    return {
        "avg_ndvi": float(np.mean(ndvi)),
        "median_ndvi": float(np.median(ndvi)),
        "min_ndvi": float(np.min(ndvi)),
        "max_ndvi": float(np.max(ndvi)),
        "std_ndvi": float(np.std(ndvi)),
        "stress_score": float(np.mean(np.maximum(0.0, 0.3 - ndvi))),  # Low NDVI = stress
        "avg_nitrogen": float(np.mean(agro[:, 0])),
        "avg_phosphorus": float(np.mean(agro[:, 1])),
        "avg_potassium": float(np.mean(agro[:, 2])),
        "avg_ph": float(np.mean(agro[:, 3])),
        "avg_rainfall": float(np.mean(agro[:, 4])),
        "avg_temperature": float(np.mean(agro[:, 5])),
        "avg_moisture": float(np.mean(agro[:, 6]))
    }


# ---- Simulation dynamics ----
def plant_growth_step(spectra: np.ndarray, agro: np.ndarray, 
                      env: Dict[str, float], delta_days: float,
                      crop_type: str = "corn", day: int = 0,
                      field_id: str = "1") -> tuple:
    """
    Vectorized biological simulation step with CROP-SPECIFIC parameters.
    Updates spectra and agro based on environmental conditions and crop type.
    field_id is used to create unique per-field characteristics.
    
    Returns: (new_spectra, new_agro)
    """
    plants = spectra.shape[0]
    profile = get_crop_profile(crop_type)
    stage = get_growth_stage(crop_type, day)
    
    # Current plant vigor from NDVI
    ndvi = compute_ndvi(spectra)
    vigor = (ndvi + 1.0) / 2.0  # Normalize to 0..1
    
    # ---- CROP-SPECIFIC Environmental multipliers ----
    temp = env.get("temp_c", 25.0)
    temp_opt = profile["temp_optimal"]
    temp_min = profile["temp_min"]
    temp_max = profile["temp_max"]
    
    # Temperature effect: Gaussian with crop-specific optimal
    temp_effect = np.exp(-((temp - temp_opt) ** 2) / (2 * 8.0**2))
    
    # Extreme temperature penalty
    if temp < temp_min:
        temp_effect *= max(0.1, 1.0 - (temp_min - temp) / 10.0)
    elif temp > temp_max:
        temp_effect *= max(0.1, 1.0 - (temp - temp_max) / 10.0)
    
    light_effect = np.clip(env.get("sunlight", 0.7), 0.0, 1.0)
    
    # Water effect based on crop-specific needs
    rain = env.get("rainfall_mm", 50.0)
    water_need = profile["water_need"]
    water_received = rain / 100.0  # Normalize
    water_ratio = water_received / water_need if water_need > 0 else 1.0
    water_effect = np.clip(water_ratio, 0.3, 1.2)  # Under/over-watering
    
    # Combined environmental multiplier
    env_mult = temp_effect * light_effect * water_effect
    
    # ---- GROWTH STAGE multiplier ----
    stage_multipliers = {
        "seedling": 0.5,       # Slow initial growth
        "vegetative": 1.3,    # Peak growth phase
        "flowering": 0.9,     # Moderate growth
        "maturation": 0.4,    # Slowing down
        "harvest_ready": 0.1  # Minimal growth
    }
    stage_mult = stage_multipliers.get(stage, 1.0)
    
    # ---- Growth calculation ----
    base_growth_rate = 0.004 * profile["growth_rate"]  # Crop-specific rate
    
    # Per-plant multiplier based on vigor (higher vigor = faster growth)
    plant_mult = 0.6 + 0.4 * vigor
    
    # Band-specific sensitivity (NIR increases more with growth)
    band_indices = np.arange(BANDS)
    band_sensitivity = 1.0 + 0.3 * np.sin((band_indices / BANDS) * np.pi)
    
    # Compute growth delta
    growth_delta = base_growth_rate * env_mult * stage_mult * delta_days
    delta = spectra * growth_delta * plant_mult.reshape(-1, 1) * band_sensitivity
    
    # Add realistic sensor noise
    noise_scale = 0.003 * (1.0 - vigor.reshape(-1, 1) * 0.3)
    noise = np.random.normal(0, noise_scale, spectra.shape)
    
    # Update spectra
    new_spectra = np.clip(spectra + delta + noise, 0.01, 0.95).astype(np.float32)
    
    # ---- FIELD-SPECIFIC Agro parameter dynamics ----
    # Each field has unique soil/climate characteristics
    field_hash = hash(field_id) % 10
    
    # Comprehensive field profiles for ALL features
    field_profiles = {
        0: {"n_base": 70, "p_base": 45, "k_base": 40, "pH_base": 6.2, "temp_offset": -2, "rain_mult": 1.2, "fert_rate": 1.2},
        1: {"n_base": 50, "p_base": 65, "k_base": 35, "pH_base": 7.0, "temp_offset": 1, "rain_mult": 0.8, "fert_rate": 0.9},
        2: {"n_base": 40, "p_base": 35, "k_base": 80, "pH_base": 5.8, "temp_offset": 3, "rain_mult": 1.1, "fert_rate": 1.0},
        3: {"n_base": 85, "p_base": 50, "k_base": 50, "pH_base": 6.5, "temp_offset": -1, "rain_mult": 1.4, "fert_rate": 1.3},
        4: {"n_base": 35, "p_base": 55, "k_base": 60, "pH_base": 7.4, "temp_offset": 4, "rain_mult": 0.6, "fert_rate": 0.7},
        5: {"n_base": 60, "p_base": 75, "k_base": 45, "pH_base": 6.8, "temp_offset": 0, "rain_mult": 0.9, "fert_rate": 1.1},
        6: {"n_base": 95, "p_base": 55, "k_base": 55, "pH_base": 5.5, "temp_offset": 2, "rain_mult": 1.5, "fert_rate": 1.4},
        7: {"n_base": 45, "p_base": 40, "k_base": 40, "pH_base": 6.3, "temp_offset": -3, "rain_mult": 1.0, "fert_rate": 0.8},
        8: {"n_base": 65, "p_base": 45, "k_base": 70, "pH_base": 5.6, "temp_offset": 3, "rain_mult": 1.3, "fert_rate": 1.1},
        9: {"n_base": 55, "p_base": 85, "k_base": 65, "pH_base": 7.2, "temp_offset": -1, "rain_mult": 0.7, "fert_rate": 0.9},
    }
    
    fp = field_profiles[field_hash]
    new_agro = agro.copy()
    
    # Nitrogen: uptake scales with growth stage, tendency to return to field base
    n_stage_mult = {"seedling": 0.5, "vegetative": 1.3, "flowering": 1.1, "maturation": 0.6, "harvest_ready": 0.3}
    n_uptake = 0.08 * delta_days * vigor * n_stage_mult.get(stage, 1.0)
    n_replenish = 0.05 * delta_days * fp["fert_rate"]
    n_base_pull = 0.01 * (fp["n_base"] - agro[:, 0])  # Tendency to base
    new_agro[:, 0] = np.clip(agro[:, 0] - n_uptake + n_replenish + n_base_pull + np.random.normal(0, 2, plants), 20, 150)
    
    # Phosphorus: field-specific base and fertilization
    p_stage_mult = 1.5 if stage == "flowering" else 1.0
    p_replenish = 0.02 * delta_days * fp["fert_rate"]
    p_base_pull = 0.01 * (fp["p_base"] - agro[:, 1])
    new_agro[:, 1] = np.clip(agro[:, 1] - 0.02 * delta_days * p_stage_mult + p_replenish + p_base_pull + np.random.normal(0, 1.5, plants), 15, 130)
    
    # Potassium: field-specific dynamics
    k_stage_mult = 1.5 if stage == "maturation" else 1.0
    k_replenish = 0.025 * delta_days * fp["fert_rate"]
    k_base_pull = 0.01 * (fp["k_base"] - agro[:, 2])
    new_agro[:, 2] = np.clip(agro[:, 2] - 0.03 * delta_days * k_stage_mult + k_replenish + k_base_pull + np.random.normal(0, 1.5, plants), 20, 150)
    
    # pH: stable with field-specific buffer and base
    pH_drift = np.random.normal(0, 0.02, plants)
    pH_base_pull = 0.02 * (fp["pH_base"] - agro[:, 3])  # Strong tendency to field pH
    new_agro[:, 3] = np.clip(agro[:, 3] + pH_drift + pH_base_pull, 5.0, 8.0)
    
    # Rainfall: field-specific patterns (some fields are drier/wetter)
    field_rain = rain * fp["rain_mult"]
    new_agro[:, 4] = np.clip(field_rain + np.random.normal(0, 12, plants), 10, 400)
    
    # Temperature: field-specific microclimate offset
    field_temp = temp + fp["temp_offset"]
    new_agro[:, 5] = np.clip(field_temp + np.random.normal(0, 2.5, plants), 5, 45)
    
    # Moisture: affected by rainfall, evaporation, drainage (crop-specific)
    # FIELD-SPECIFIC soil characteristics based on field_id
    field_hash = hash(field_id) % 10
    
    # Different soil types per field
    soil_types = {
        0: {"drainage": 0.01, "retention": 0.9, "irrigation": 0.10, "base_moisture": 55},  # Clay - high retention
        1: {"drainage": 0.04, "retention": 0.5, "irrigation": 0.25, "base_moisture": 40},  # Sandy - fast drainage
        2: {"drainage": 0.02, "retention": 0.7, "irrigation": 0.15, "base_moisture": 50},  # Loam - balanced
        3: {"drainage": 0.015, "retention": 0.85, "irrigation": 0.08, "base_moisture": 65}, # Silt - wet
        4: {"drainage": 0.05, "retention": 0.4, "irrigation": 0.30, "base_moisture": 35},  # Sandy loam - dry
        5: {"drainage": 0.025, "retention": 0.65, "irrigation": 0.18, "base_moisture": 48}, # Loamy sand
        6: {"drainage": 0.012, "retention": 0.88, "irrigation": 0.05, "base_moisture": 70}, # Clay loam - very wet
        7: {"drainage": 0.035, "retention": 0.55, "irrigation": 0.22, "base_moisture": 42}, # Silty sand
        8: {"drainage": 0.018, "retention": 0.75, "irrigation": 0.12, "base_moisture": 58}, # Silty clay
        9: {"drainage": 0.045, "retention": 0.45, "irrigation": 0.28, "base_moisture": 38}, # Fine sand - very dry
    }
    
    soil = soil_types[field_hash]
    
    evap_base = 4.0 if temp > 30 else (3.0 if temp > 25 else 2.0)
    evap = evap_base * water_need * delta_days * (1.0 - soil["retention"] * 0.3)
    drainage = soil["drainage"] * agro[:, 6]
    rain_gain = rain * 0.03 * soil["retention"]
    irrigation_boost = 8.0 if np.random.random() < soil["irrigation"] else 0.0
    
    # Tendency to return to field's base moisture
    base_pull = 0.02 * (soil["base_moisture"] - agro[:, 6])
    
    new_agro[:, 6] = np.clip(
        agro[:, 6] + rain_gain - evap - drainage + irrigation_boost + base_pull + np.random.normal(0, 4, plants),
        20, 85
    )
    
    return new_spectra.astype(np.float32), new_agro.astype(np.float32)


# ---- Core API functions ----
def init_field(req: InitFieldRequest) -> Dict[str, Any]:
    """Initialize a new field in storage"""
    field_id = str(req.field_id)
    
    if storage.exists(field_id):
        raise ValueError(f"Field {field_id} already exists")
    
    plants = req.plants or PLANTS_PER_FIELD
    
    # Generate baseline spectral signature
    # Realistic reflectance curve: low in blue/red, high in NIR
    base = np.zeros(BANDS, dtype=np.float32)
    for i in range(BANDS):
        wavelength = 400 + i * 16  # 400nm to ~2500nm
        if wavelength < 500:  # Blue
            base[i] = 0.05
        elif wavelength < 600:  # Green
            base[i] = 0.15
        elif wavelength < 700:  # Red
            base[i] = 0.08
        elif wavelength < 1300:  # NIR plateau
            base[i] = 0.5
        else:  # SWIR decline
            base[i] = 0.3 - (wavelength - 1300) / 5000
    
    # Add plant-to-plant variation
    spectra = np.tile(base, (plants, 1))
    spectra += np.random.normal(0, 0.02, spectra.shape)
    
    # CREATE CRITICAL PLANTS (15-20% of field)
    # These have stressed spectral signature (lower NIR, higher Red = low NDVI)
    n_critical = int(plants * np.random.uniform(0.15, 0.20))
    critical_indices = np.random.choice(plants, n_critical, replace=False)
    
    for idx in critical_indices:
        # Stress pattern: reduce NIR (bands 25-40), increase Red (bands 15-20)
        spectra[idx, 15:22] *= 1.3  # Increase red absorption
        spectra[idx, 25:45] *= 0.6  # Decrease NIR reflectance
        # This results in NDVI around 0.2-0.4 (stressed)
    
    spectra = np.clip(spectra, 0.01, 0.95).astype(np.float32)
    
    # FIELD-SPECIFIC SOIL PROFILES for diverse crop recommendations
    # Each field gets different baseline conditions based on field_id
    field_hash = hash(field_id) % 10  # Creates 10 distinct profiles
    
    soil_profiles = {
        0: {"N": 90, "P": 40, "K": 40, "pH": 6.0, "temp": 22, "moisture": 50},   # High N - good for rice
        1: {"N": 40, "P": 60, "K": 30, "pH": 7.0, "temp": 26, "moisture": 40},   # High P - good for maize
        2: {"N": 30, "P": 30, "K": 80, "pH": 5.5, "temp": 28, "moisture": 60},   # High K - good for banana
        3: {"N": 80, "P": 45, "K": 45, "pH": 6.5, "temp": 24, "moisture": 85},   # High N+moisture - rice
        4: {"N": 25, "P": 55, "K": 55, "pH": 7.5, "temp": 30, "moisture": 30},   # Low N, alkaline - cotton
        5: {"N": 50, "P": 70, "K": 40, "pH": 6.8, "temp": 25, "moisture": 45},   # High P - wheat/maize
        6: {"N": 100, "P": 50, "K": 50, "pH": 5.8, "temp": 27, "moisture": 70},  # Very high N - sugarcane
        7: {"N": 35, "P": 35, "K": 35, "pH": 6.2, "temp": 22, "moisture": 55},   # Balanced low - lentil
        8: {"N": 60, "P": 40, "K": 70, "pH": 5.5, "temp": 29, "moisture": 75},   # High K+moisture - coconut
        9: {"N": 45, "P": 80, "K": 60, "pH": 7.2, "temp": 20, "moisture": 35},   # Very high P - chickpea
    }
    
    profile = soil_profiles[field_hash]
    
    # Initialize agro parameters with field-specific baselines: [N, P, K, pH, Rainfall, Temp, Moisture]
    agro = np.zeros((plants, 7), dtype=np.float32)
    agro[:, 0] = np.random.normal(profile["N"], 10, plants)    # N with variation
    agro[:, 1] = np.random.normal(profile["P"], 8, plants)     # P
    agro[:, 2] = np.random.normal(profile["K"], 10, plants)    # K
    agro[:, 3] = np.random.normal(profile["pH"], 0.3, plants)  # pH
    agro[:, 4] = np.random.normal(100, 30, plants)             # Rainfall (common)
    agro[:, 5] = np.random.normal(profile["temp"], 3, plants)  # Temp
    agro[:, 6] = np.random.normal(profile["moisture"], 12, plants)  # Moisture
    
    # Critical plants have nutrient deficiencies
    for idx in critical_indices:
        agro[idx, 0] *= 0.5  # Low nitrogen
        agro[idx, 6] *= 0.6  # Low moisture
    
    agro = np.clip(agro, 1, None).astype(np.float32)
    
    env = req.initial_env.dict() if req.initial_env else {
        "temp_c": profile["temp"], "sunlight": 0.7, "rainfall_mm": 50.0
    }
    
    state = {
        "spectra": spectra,
        "agro": agro,
        "last_ts": time.time(),
        "env": env,
        "crop_type": req.crop_type or "corn",
        "day": 0
    }
    
    storage.set(field_id, serialize_state(state))
    
    metrics = compute_metrics(spectra, agro)
    return {
        "ok": True,
        "field_id": field_id,
        "plants": plants,
        "crop_type": state["crop_type"],
        **metrics
    }


def step_field(field_id: str, delta_days: float = 1.0) -> Dict[str, Any]:
    """Advance simulation by delta_days. Returns diff metrics."""
    blob = storage.get(field_id)
    if not blob:
        raise ValueError(f"Field {field_id} not found")
    
    state = deserialize_state(blob)
    crop_type = state.get("crop_type", "corn")
    current_day = int(state.get("day", 0))
    
    before_ndvi = compute_ndvi(state["spectra"])
    before_metrics = compute_metrics(state["spectra"], state["agro"])
    
    # DYNAMIC WEATHER VARIATION - natural daily fluctuations
    env = state["env"]
    base_temp = env.get("temp_c", 25.0)
    base_rain = env.get("rainfall_mm", 50.0)
    base_sun = env.get("sunlight", 0.7)
    
    # Daily temperature swing (±4°C)
    temp_variation = np.random.uniform(-4, 4)
    env["temp_c"] = np.clip(base_temp + temp_variation, 8, 42)
    
    # Rainfall variation (0-30% of base, with occasional rain events)
    if np.random.random() > 0.7:  # 30% chance of rain event
        env["rainfall_mm"] = base_rain + np.random.uniform(10, 40)
    else:
        env["rainfall_mm"] = max(0, base_rain + np.random.uniform(-10, 5))
    
    # Sunlight variation (cloudy days)
    env["sunlight"] = np.clip(base_sun + np.random.uniform(-0.2, 0.15), 0.3, 0.95)
    
    # Update state with new env
    state["env"] = env
    
    # Run growth simulation with CROP-SPECIFIC and FIELD-SPECIFIC parameters
    new_spectra, new_agro = plant_growth_step(
        state["spectra"], state["agro"], state["env"], delta_days,
        crop_type=crop_type, day=current_day, field_id=field_id
    )
    
    after_ndvi = compute_ndvi(new_spectra)
    after_metrics = compute_metrics(new_spectra, new_agro)
    
    # DAMAGE ACCUMULATION: If alerts are unresolved, plants deteriorate
    damage_acc = state.get("damage_accumulator", 0.0)
    last_fixed = state.get("last_fixed", 0)
    time_since_fix = time.time() - last_fixed if last_fixed > 0 else time.time() - state.get("last_ts", time.time())
    
    # Count current critical plants
    critical_count = int(np.sum(after_ndvi < 0.45))
    
    if critical_count > 5:  # If significant issues exist
        # Accumulate damage over time (more damage if not fixed)
        damage_acc += 0.01 * delta_days * (1 + critical_count / 20)
        
        # Apply damage to already critical plants (they get worse)
        if damage_acc > 0.1:  # After some damage accumulates
            critical_mask = after_ndvi < 0.45
            # Damage: reduce NIR (make plants sicker)
            new_spectra[critical_mask, 25:45] *= 0.98
            # Spread to nearby healthy plants (10% chance per critical plant)
            healthy_indices = np.where(~critical_mask)[0]
            spread_count = min(len(healthy_indices), int(critical_count * 0.05))
            if spread_count > 0 and len(healthy_indices) > 0:
                spread_targets = np.random.choice(healthy_indices, spread_count, replace=False)
                new_spectra[spread_targets, 25:45] *= 0.95  # Mild damage
    else:
        # Slowly recover damage if under control
        damage_acc = max(0, damage_acc - 0.005 * delta_days)
    
    # Update state
    state["spectra"] = new_spectra
    state["agro"] = new_agro
    state["last_ts"] = time.time()
    state["day"] = state.get("day", 0) + delta_days
    state["damage_accumulator"] = damage_acc
    state["unresolved_alerts"] = critical_count
    
    storage.set(field_id, serialize_state(state))
    
    # Compute what changed
    ndvi_change = after_ndvi - before_ndvi
    changed_mask = np.abs(ndvi_change) > 0.001
    
    # Generate alerts based on plant conditions
    alerts = []
    
    # Count critical plants (NDVI < 0.4)
    critical_count = int(np.sum(after_ndvi < 0.4))
    critical_pct = critical_count / len(after_ndvi) * 100
    
    # Low NDVI alert
    if after_metrics["avg_ndvi"] < 0.5:
        alerts.append({
            "field_id": field_id,
            "type": "LowNDVI",
            "level": "critical" if after_metrics["avg_ndvi"] < 0.35 else "warning",
            "message": f"Field {field_id}: Low vegetation index ({after_metrics['avg_ndvi']:.2f}). Check plant health."
        })
    
    # Critical plants percentage alert
    if critical_pct > 10:
        alerts.append({
            "field_id": field_id,
            "type": "CriticalPlants",
            "level": "critical" if critical_pct > 20 else "warning",
            "message": f"Field {field_id}: {critical_count} plants ({critical_pct:.0f}%) in critical condition!"
        })
    
    # Low nitrogen alert
    if after_metrics["avg_nitrogen"] < 35:
        alerts.append({
            "field_id": field_id,
            "type": "LowNitrogen",
            "level": "warning",
            "message": f"Field {field_id}: Nitrogen deficiency detected ({after_metrics['avg_nitrogen']:.1f}). Consider fertilization."
        })
    
    # Low moisture alert
    if after_metrics["avg_moisture"] < 35:
        alerts.append({
            "field_id": field_id,
            "type": "LowMoisture",
            "level": "critical" if after_metrics["avg_moisture"] < 25 else "warning",
            "message": f"Field {field_id}: Soil moisture low ({after_metrics['avg_moisture']:.1f}%). Irrigation needed."
        })
    
    # High stress alert
    if after_metrics["stress_score"] > 0.05:
        alerts.append({
            "field_id": field_id,
            "type": "PlantStress",
            "level": "critical" if after_metrics["stress_score"] > 0.15 else "warning",
            "message": f"Field {field_id}: Plant stress detected (score: {after_metrics['stress_score']:.2f})"
        })
    
    # Temperature extremes
    if after_metrics["avg_temperature"] > 38 or after_metrics["avg_temperature"] < 10:
        level = "critical" if after_metrics["avg_temperature"] > 42 or after_metrics["avg_temperature"] < 5 else "warning"
        alerts.append({
            "field_id": field_id,
            "type": "TemperatureExtreme",
            "level": level,
            "message": f"Field {field_id}: Extreme temperature ({after_metrics['avg_temperature']:.1f}°C)"
        })
    
    # Get growth stage for response
    new_day = int(state["day"])
    growth_stage = get_growth_stage(crop_type, new_day)
    profile = get_crop_profile(crop_type)
    maturity_pct = min(100.0, (new_day / profile["maturity_days"]) * 100)
    
    return {
        "field_id": field_id,
        "day": new_day,
        "crop_type": crop_type,
        "growth_stage": growth_stage,
        "maturity_pct": round(maturity_pct, 1),
        "days_to_harvest": max(0, profile["maturity_days"] - new_day),
        "delta_days": delta_days,
        "before": before_metrics,
        "after": after_metrics,
        "ndvi_change_mean": float(np.mean(ndvi_change)),
        "ndvi_change_std": float(np.std(ndvi_change)),
        "changed_plants": int(np.sum(changed_mask)),
        "alerts": alerts,
        "timestamp": state["last_ts"]
    }


def get_field_summary(field_id: str) -> Dict[str, Any]:
    """Get current field state summary without stepping"""
    blob = storage.get(field_id)
    if not blob:
        raise ValueError(f"Field {field_id} not found")
    
    state = deserialize_state(blob)
    metrics = compute_metrics(state["spectra"], state["agro"])
    
    return {
        "field_id": field_id,
        "plants": state["spectra"].shape[0],
        "bands": state["spectra"].shape[1],
        "day": state.get("day", 0),
        "crop_type": state.get("crop_type", "corn"),
        "env": state["env"],
        "last_updated": state["last_ts"],
        **metrics
    }


def patch_field_env(field_id: str, env: EnvParams) -> Dict[str, Any]:
    """Update environmental conditions for a field"""
    blob = storage.get(field_id)
    if not blob:
        raise ValueError(f"Field {field_id} not found")
    
    state = deserialize_state(blob)
    state["env"] = env.dict()
    state["last_ts"] = time.time()
    storage.set(field_id, serialize_state(state))
    
    return {"ok": True, "field_id": field_id, "env": state["env"]}


def delete_field(field_id: str) -> Dict[str, Any]:
    """Remove a field from storage"""
    if not storage.exists(field_id):
        raise ValueError(f"Field {field_id} not found")
    storage.delete(field_id)
    return {"ok": True, "field_id": field_id, "deleted": True}


def fix_field(field_id: str, fix_type: str = "all") -> Dict[str, Any]:
    """
    Fix a field - heal critical plants and reset damage accumulator.
    This is called when user resolves alerts.
    
    fix_type options:
    - "all": Full treatment (heal all critical plants)
    - "irrigation": Fix moisture issues
    - "fertilizer": Fix nutrient deficiencies
    - "disease": Treat diseased plants
    """
    blob = storage.get(field_id)
    if not blob:
        raise ValueError(f"Field {field_id} not found")
    
    state = deserialize_state(blob)
    spectra = state["spectra"].copy()
    agro = state["agro"].copy()
    plants = spectra.shape[0]
    
    # Identify critical plants (low NDVI)
    ndvi = compute_ndvi(spectra)
    critical_mask = ndvi < 0.45
    n_critical = int(np.sum(critical_mask))
    
    healed = 0
    
    if fix_type in ["all", "disease"]:
        # Heal critical plants by setting healthy NIR/Red values
        for i in np.where(critical_mask)[0]:
            # Set healthy spectral profile: high NIR (0.5-0.7), low Red (0.05-0.1)
            spectra[i, 25:45] = np.random.uniform(0.50, 0.70, 20)  # Strong NIR
            spectra[i, 15:22] = np.random.uniform(0.03, 0.08, 7)   # Low red absorption
            # Also boost nearby bands for continuity
            spectra[i, 10:15] = np.random.uniform(0.08, 0.12, 5)
            spectra[i, 45:50] = np.random.uniform(0.45, 0.60, 5)
            healed += 1
    
    if fix_type in ["all", "irrigation"]:
        # Fix moisture for all plants
        agro[:, 6] = np.clip(agro[:, 6] + 20, 40, 80)  # Boost moisture
    
    if fix_type in ["all", "fertilizer"]:
        # Fix nutrient deficiencies
        low_n_mask = agro[:, 0] < 40
        agro[low_n_mask, 0] = np.clip(agro[low_n_mask, 0] + 30, 50, 100)  # Nitrogen
        low_p_mask = agro[:, 1] < 30
        agro[low_p_mask, 1] = np.clip(agro[low_p_mask, 1] + 20, 40, 80)  # Phosphorus
        low_k_mask = agro[:, 2] < 35
        agro[low_k_mask, 2] = np.clip(agro[low_k_mask, 2] + 25, 45, 90)  # Potassium
    
    # Update state
    state["spectra"] = spectra.astype(np.float32)
    state["agro"] = agro.astype(np.float32)
    state["last_ts"] = time.time()
    state["last_fixed"] = time.time()
    state["unresolved_alerts"] = 0
    state["damage_accumulator"] = 0.0
    
    storage.set(field_id, serialize_state(state))
    
    # Calculate new metrics
    new_ndvi = compute_ndvi(spectra)
    still_critical = int(np.sum(new_ndvi < 0.45))
    
    return {
        "ok": True,
        "field_id": field_id,
        "fix_type": fix_type,
        "critical_before": n_critical,
        "healed": healed,
        "critical_after": still_critical,
        "avg_ndvi_after": float(np.mean(new_ndvi)),
        "message": f"Fixed {healed} critical plants. {still_critical} still need attention."
    }


def list_fields() -> List[str]:
    """List all field IDs in storage"""
    keys = storage.keys("*")
    return [k.replace(FIELD_KEY_PREFIX, "") for k in keys]
