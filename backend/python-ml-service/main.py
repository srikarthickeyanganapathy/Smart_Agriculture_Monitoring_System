from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import simulate_router, disease_router, yield_router, health_router

app = FastAPI(title="Smart Agriculture ML Service")

# CORS
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(simulate_router.router, prefix="/simulate", tags=["Simulation"])
app.include_router(disease_router.router, prefix="/predict", tags=["Disease"])
app.include_router(yield_router.router, prefix="/predict", tags=["Yield"])
app.include_router(health_router.router, prefix="/health", tags=["Health"])

@app.get("/")
def root():
    return {"status": "Stateless ML Service Running", "version": "3.0"}
