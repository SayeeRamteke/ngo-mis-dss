from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .core.database import get_db, engine, Base
from .models import models
from .schemas import schemas
from .engine import dss_engine, simulator

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

# --- Beneficiaries ---
@app.get("/api/v1/beneficiaries", response_model=List[schemas.BeneficiaryResponse])
def get_beneficiaries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Beneficiary).offset(skip).limit(limit).all()

@app.post("/api/v1/beneficiaries", response_model=schemas.BeneficiaryResponse)
def create_beneficiary(beneficiary: schemas.BeneficiaryCreate, db: Session = Depends(get_db)):
    db_beneficiary = models.Beneficiary(**beneficiary.model_dump(), created_by=1) # Mock auth user 1
    db.add(db_beneficiary)
    db.commit()
    db.refresh(db_beneficiary)
    # Recalculate priority
    dss_engine.calculate_priority_score(db, db_beneficiary)
    return db_beneficiary

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
