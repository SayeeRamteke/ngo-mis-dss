from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .core.database import get_db, engine, Base
from .models import models
from .schemas import schemas
from .engine import dss_engine, simulator
from .api.v1 import routes_resources, routes_finance, routes_volunteers, routes_dss, routes_reports, routes_upload, routes_programs, routes_beneficiaries

# We already ran migrations, but this ensures tables exist if using sqlite directly
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NGO MIS + DSS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to NGO MIS + DSS API"}

# --- DSS ---
@app.get("/api/v1/dss/recommendations", response_model=List[schemas.DSSRecommendationResponse])
def get_dss_recommendations(status: str = "active", limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.DSSRecommendation).filter(models.DSSRecommendation.status == status).order_by(models.DSSRecommendation.generated_at.desc()).limit(limit).all()

# --- Simulator ---
@app.post("/api/v1/simulator/run")
def run_simulation(params: dict, db: Session = Depends(get_db)):
    # Mock programs data for simulator
    programs = db.query(models.Program).all()
    prog_data = [{"id": p.program_id, "name": p.program_name, "budget": p.total_budget, "cost_per_beneficiary": 500.0} for p in programs]
    
    result = simulator.run_whatif_simulation(
        current_budget=params.get("current_budget", 100000.0),
        budget_change_percent=params.get("budget_change_percent", 0.0),
        donation_drop_percent=params.get("donation_drop_percent", 0.0),
        programs=prog_data
    )
    return result

# --- Include New API Routers ---
app.include_router(routes_beneficiaries.router)
app.include_router(routes_resources.router)
app.include_router(routes_finance.router)
app.include_router(routes_volunteers.router)
app.include_router(routes_dss.router)
app.include_router(routes_reports.router)
app.include_router(routes_upload.router)
app.include_router(routes_programs.router)
