from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta

from ...core.database import get_db
from ...models import models
from ...schemas import schemas
from ...engine import dss_engine

router = APIRouter(prefix="/api/v1/beneficiaries", tags=["beneficiaries"])

@router.get("", response_model=List[schemas.BeneficiaryResponse])
def get_beneficiaries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Beneficiary).offset(skip).limit(limit).all()

@router.post("", response_model=schemas.BeneficiaryResponse)
def create_beneficiary(beneficiary: schemas.BeneficiaryCreate, db: Session = Depends(get_db)):
    import difflib
    
    # Advanced Duplicate Detection
    if beneficiary.beneficiary_type == "organization":
        # Organizations: Match by reg_number or fuzzy name + region
        query = db.query(models.Beneficiary).filter(
            models.Beneficiary.beneficiary_type == "organization",
            models.Beneficiary.location_id == beneficiary.location_id
        )
        if beneficiary.registration_number:
            existing_reg = query.filter(models.Beneficiary.registration_number == beneficiary.registration_number).first()
            if existing_reg:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization with this Registration Number already exists in this region.")
        
        # Fuzzy name match fallback
        orgs = query.all()
        for org in orgs:
            sim = difflib.SequenceMatcher(None, org.full_name.lower(), beneficiary.full_name.lower()).ratio()
            if sim > 0.85:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Probable duplicate organization detected: {org.full_name}")

    else:
        # Individuals: Fuzzy Match on Name + DOB
        query = db.query(models.Beneficiary).filter(
            models.Beneficiary.beneficiary_type == "individual",
            models.Beneficiary.location_id == beneficiary.location_id
        )
        individuals = query.all()
        for ind in individuals:
            name_sim = difflib.SequenceMatcher(None, ind.full_name.lower(), beneficiary.full_name.lower()).ratio()
            dob_sim = 1.0 if ind.date_of_birth and beneficiary.date_of_birth and ind.date_of_birth == beneficiary.date_of_birth else 0.0
            
            # Simple weighted score
            dup_score = (name_sim * 0.7) + (dob_sim * 0.3)
            if dup_score > 0.85:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Probable duplicate individual detected: {ind.full_name}")

    # Strict Validation Constraints
    if not beneficiary.is_organization:
        if beneficiary.earning_members > beneficiary.household_size:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Earning members cannot exceed household size.")
        if beneficiary.monthly_income < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Monthly income cannot be negative.")
    else:
        if beneficiary.capacity and beneficiary.current_occupancy and beneficiary.current_occupancy > beneficiary.capacity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current occupancy cannot exceed capacity.")

    db_beneficiary = models.Beneficiary(**beneficiary.model_dump(), created_by=1) # Mock auth user 1
    db.add(db_beneficiary)
    db.commit()
    db.refresh(db_beneficiary)
    
    # Recalculate priority
    dss_engine.calculate_priority_score(db, db_beneficiary)
    db.commit()
    db.refresh(db_beneficiary)
    return db_beneficiary

@router.patch("/{beneficiary_id}/priority", response_model=schemas.BeneficiaryResponse)
def set_critical_priority(beneficiary_id: int, db: Session = Depends(get_db)):
    db_beneficiary = db.query(models.Beneficiary).filter(models.Beneficiary.beneficiary_id == beneficiary_id).first()
    if not db_beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    
    db_beneficiary.priority_level = "high"
    db_beneficiary.priority_score = 100.0
    db_beneficiary.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_beneficiary)
    return db_beneficiary

@router.post("/{beneficiary_id}/aid", response_model=schemas.BeneficiaryAidResponse)
def record_aid(beneficiary_id: int, aid: schemas.BeneficiaryAidCreate, db: Session = Depends(get_db)):
    db_beneficiary = db.query(models.Beneficiary).filter(models.Beneficiary.beneficiary_id == beneficiary_id).first()
    if not db_beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    date_received = aid.date_received.replace(tzinfo=timezone.utc) if aid.date_received else datetime.now(timezone.utc)
    
    # Business Rule: Aid records cannot be backdated more than 30 days
    limit_date = datetime.now(timezone.utc) - timedelta(days=30)
    if date_received < limit_date:
        raise HTTPException(
            status_code=400, 
            detail="Aid records cannot be backdated more than 30 days without admin override."
        )

    # Resolve Direct Aid Program
    final_program_id = aid.program_id
    if not final_program_id:
        direct_prog = db.query(models.Program).filter(models.Program.program_name == "Direct Aid / Emergency Support").first()
        if not direct_prog:
            direct_prog = models.Program(
                program_name="Direct Aid / Emergency Support",
                program_type="basic_needs",
                region_id=db_beneficiary.location_id or 1,
                start_date=datetime.now(timezone.utc).date(),
                status="active"
            )
            db.add(direct_prog)
            db.commit()
            db.refresh(direct_prog)
        final_program_id = direct_prog.program_id

    # Duplicate Check
    from sqlalchemy import func
    duplicate = db.query(models.BeneficiaryAid).filter(
        models.BeneficiaryAid.beneficiary_id == beneficiary_id,
        models.BeneficiaryAid.program_id == final_program_id,
        models.BeneficiaryAid.resource_id == aid.resource_id,
        func.date(models.BeneficiaryAid.date_received) == date_received.date()
    ).first()

    if duplicate:
        raise HTTPException(status_code=400, detail="Duplicate aid entry detected for this beneficiary today.")

    # Atomic Transaction
    try:
        db_aid = models.BeneficiaryAid(
            beneficiary_id=beneficiary_id,
            program_id=final_program_id,
            resource_id=aid.resource_id,
            quantity_received=aid.quantity_received,
            date_received=date_received
        )
        db.add(db_aid)
        
        # Update Beneficiary's last aid date
        db_beneficiary.last_aid_date = date_received
        
        # Recalculate priority dynamically
        dss_engine.calculate_priority_score(db, db_beneficiary)
        
        db.commit()
        db.refresh(db_aid)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record aid: {str(e)}")
    
    # Fetch names for response
    program = db.query(models.Program).filter(models.Program.program_id == db_aid.program_id).first()
    resource = db.query(models.Resource).filter(models.Resource.resource_id == db_aid.resource_id).first()
    
    return schemas.BeneficiaryAidResponse(
        aid_id=db_aid.aid_id,
        beneficiary_id=db_aid.beneficiary_id,
        program_id=db_aid.program_id,
        resource_id=db_aid.resource_id,
        quantity_received=db_aid.quantity_received,
        date_received=db_aid.date_received,
        program_name=program.program_name if program else None,
        resource_name=resource.resource_name if resource else None
    )

@router.get("/{beneficiary_id}/aid", response_model=List[schemas.BeneficiaryAidResponse])
def get_aid_history(beneficiary_id: int, db: Session = Depends(get_db)):
    history = db.query(models.BeneficiaryAid).filter(models.BeneficiaryAid.beneficiary_id == beneficiary_id).order_by(models.BeneficiaryAid.date_received.desc()).all()
    
    res = []
    for h in history:
        program = db.query(models.Program).filter(models.Program.program_id == h.program_id).first()
        resource = db.query(models.Resource).filter(models.Resource.resource_id == h.resource_id).first()
        res.append(schemas.BeneficiaryAidResponse(
            aid_id=h.aid_id,
            beneficiary_id=h.beneficiary_id,
            program_id=h.program_id,
            resource_id=h.resource_id,
            quantity_received=h.quantity_received,
            date_received=h.date_received,
            program_name=program.program_name if program else None,
            resource_name=resource.resource_name if resource else None
        ))
    return res
