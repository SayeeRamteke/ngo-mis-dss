from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models import models
from ...schemas import schemas

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])

@router.post("/donations", response_model=schemas.DonationResponse)
def add_donation(donation: schemas.DonationCreate, db: Session = Depends(get_db)):
    db_donation = models.Donation(**donation.model_dump())
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    return db_donation

@router.post("/expenses", response_model=schemas.ExpenseResponse)
def add_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    
    if expense.program_id:
        program = db.query(models.Program).filter(models.Program.program_id == expense.program_id).first()
        if program:
            program.budget_spent += expense.amount
            
            # Check alert condition (>80% spent)
            if program.total_budget > 0 and (program.budget_spent / program.total_budget) >= 0.8:
                alert = models.Alert(
                    alert_type="budget_overspend",
                    message=f"Program {program.program_id} has used >=80% of its budget.",
                    program_id=program.program_id
                )
                db.add(alert)

    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/budget")
def get_budget_summary(db: Session = Depends(get_db)):
    programs = db.query(models.Program).all()
    summary = []
    for p in programs:
        utilization = 0
        if p.total_budget > 0:
            utilization = round((p.budget_spent / p.total_budget) * 100, 1)
        summary.append({
            "program": p.program_name,
            "allocated": p.total_budget,
            "spent": p.budget_spent,
            "remaining": p.total_budget - p.budget_spent,
            "utilizationPercent": utilization
        })
    return summary
