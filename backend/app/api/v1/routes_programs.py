from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models import models
from ...schemas import schemas
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/programs", tags=["programs"])

@router.post("/", response_model=schemas.ProgramResponse)
def create_program(program: schemas.ProgramCreate, db: Session = Depends(get_db)):
    db_program = models.Program(
        program_name=program.program_name,
        program_type=program.program_type,
        region_id=program.region_id,
        start_date=program.start_date,
        end_date=program.end_date,
        total_budget=program.total_budget,
        target_beneficiaries=program.target_beneficiaries,
        description=program.description,
        status="active"
    )
    db.add(db_program)
    db.commit()
    db.refresh(db_program)
    return db_program
