# python-ml-service/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.simulate_router import router as simulate_router, sim as simulation_instance
from routers.yield_router import router as yield_router
from routers.crop_router import router as crop_router
from routers.disease_router import router as disease_router
from routers.health_router import router as health_router
from routers.dashboard_router import router as dashboard_router, set_simulation_ref

app = FastAPI(title="Smart Agriculture ML Service")

origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5001",
    "http://localhost:5002",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set simulation reference for dashboard router
set_simulation_ref(simulation_instance)

# Include all routers
app.include_router(simulate_router, prefix="/simulate")
app.include_router(yield_router, prefix="/predict")
app.include_router(crop_router, prefix="/predict")
app.include_router(disease_router, prefix="/predict")
app.include_router(health_router, prefix="/predict")
app.include_router(dashboard_router, prefix="/dashboard")


@app.get("/")
def root():
    return {"status": "Python ML Service Running", "version": "2.0"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "services": {
            "yield_prediction": "active",
            "disease_prediction": "active",
            "crop_recommendation": "active",
            "simulation": "active",
            "dashboard": "active"
        }
    }
