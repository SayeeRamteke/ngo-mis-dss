from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ...core.database import get_db
from ...engine import dss_engine

router = APIRouter(prefix="/api/v1/dss", tags=["dss"])

@router.get("/forecast")
def get_forecast(resource_id: int, region_id: int, db: Session = Depends(get_db)):
    return dss_engine.forecast_demand(db, resource_id, region_id)

@router.get("/anomalies")
def get_anomalies(db: Session = Depends(get_db)):
    res_anomalies = dss_engine.detect_anomalies(db)
    ben_anomalies = dss_engine.detect_beneficiary_anomalies(db)
    return {"resource_anomalies": res_anomalies, "beneficiary_anomalies": ben_anomalies}

class SimulationParams(BaseModel):
    regionId: int
    demandMultiplier: float = 1.0
    budgetChangePercent: float = 0.0
    procurementEfficiency: float = 0.8
    supplyDelayDays: int = 3
    activeVolunteers: int = None

@router.post("/simulate")
def run_simulation(params: SimulationParams, db: Session = Depends(get_db)):
    return dss_engine.what_if_simulation(
        db, 
        params.regionId, 
        params.demandMultiplier, 
        params.budgetChangePercent,
        params.procurementEfficiency,
        params.supplyDelayDays,
        params.activeVolunteers
    )

@router.get("/redistribute")
def get_redistribution(db: Session = Depends(get_db)):
    return dss_engine.redistribution_recommendations(db)

class AllocationRequest(BaseModel):
    region_id: int
    resource_id: int
    total_quantity: float

@router.post("/allocate")
def allocate_resources(req: AllocationRequest, db: Session = Depends(get_db)):
    from ...models import models
    # Fetch all active beneficiaries in the region
    bens = db.query(models.Beneficiary).filter(
        models.Beneficiary.location_id == req.region_id,
        models.Beneficiary.is_active == True
    ).all()
    
    # Sort according to business rule: Priority Score DESC, Last Aid Date ASC
    # Handle None dates by assigning a very old date
    from datetime import datetime, timezone
    very_old = datetime(2000, 1, 1, tzinfo=timezone.utc)
    
    bens.sort(key=lambda x: (-x.priority_score, x.last_aid_date or very_old))
    
    # Splitting logic: 60% Individuals, 40% Organizations
    qty_individuals = req.total_quantity * 0.6
    qty_organizations = req.total_quantity * 0.4
    
    allocated = []
    
    # Distribute to High Priority first
    for b in bens:
        if b.priority_level == "high":
            if b.beneficiary_type == "individual" and qty_individuals > 0:
                alloc = min(qty_individuals, 1) # Standard individual allocation unit = 1
                qty_individuals -= alloc
                allocated.append({"beneficiary_id": b.beneficiary_id, "name": b.full_name, "type": "individual", "allocated": alloc})
            elif b.beneficiary_type == "organization" and qty_organizations > 0:
                cap = b.capacity or 100
                occ = b.current_occupancy or 0
                needed = max(0, cap - occ)
                alloc = min(qty_organizations, needed)
                if alloc > 0:
                    qty_organizations -= alloc
                    allocated.append({"beneficiary_id": b.beneficiary_id, "name": b.full_name, "type": "organization", "allocated": alloc})
                    
    # Distribute remaining to Medium
    for b in bens:
        if b.priority_level == "medium":
            if b.beneficiary_type == "individual" and qty_individuals > 0:
                alloc = min(qty_individuals, 1)
                qty_individuals -= alloc
                allocated.append({"beneficiary_id": b.beneficiary_id, "name": b.full_name, "type": "individual", "allocated": alloc})
            elif b.beneficiary_type == "organization" and qty_organizations > 0:
                cap = b.capacity or 100
                occ = b.current_occupancy or 0
                needed = max(0, cap - occ)
                alloc = min(qty_organizations, needed)
                if alloc > 0:
                    qty_organizations -= alloc
                    allocated.append({"beneficiary_id": b.beneficiary_id, "name": b.full_name, "type": "organization", "allocated": alloc})

    return {
        "status": "success",
        "total_requested": req.total_quantity,
        "remaining_individuals": qty_individuals,
        "remaining_organizations": qty_organizations,
        "allocations": allocated
    }
