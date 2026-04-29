from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models import models
from ...schemas import schemas

router = APIRouter(prefix="/api/v1/resources", tags=["resources"])

@router.get("/stocks", response_model=List[schemas.ResourceInventoryResponse])
def get_stocks(region_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.ResourceInventory)
    if region_id:
        query = query.filter(models.ResourceInventory.region_id == region_id)
    return query.all()

@router.post("/")
def create_resource(data: schemas.ResourceCreateNew, db: Session = Depends(get_db)):
    db_resource = models.Resource(
        resource_name=data.resource_name,
        category=data.category,
        resource_type=data.resource_type,
        unit_of_measure=data.unit_of_measure
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    
    db_inventory = models.ResourceInventory(
        resource_id=db_resource.resource_id,
        region_id=data.region_id,
        quantity_available=data.initial_quantity
    )
    db.add(db_inventory)
    db.commit()
    return {"message": "Resource created successfully"}

@router.post("/transfer")
def transfer_resource(transfer: schemas.ResourceTransactionCreate, db: Session = Depends(get_db)):
    if transfer.transaction_type != "transfer":
        raise HTTPException(status_code=400, detail="Must be a transfer transaction type")
    
    source = db.query(models.ResourceInventory).filter(
        models.ResourceInventory.resource_id == transfer.resource_id,
        models.ResourceInventory.region_id == transfer.from_region_id
    ).first()
    
    if not source or source.quantity_available < transfer.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
        
    source.quantity_available -= transfer.quantity
    
    dest = db.query(models.ResourceInventory).filter(
        models.ResourceInventory.resource_id == transfer.resource_id,
        models.ResourceInventory.region_id == transfer.to_region_id
    ).first()
    
    if dest:
        dest.quantity_available += transfer.quantity
    else:
        dest = models.ResourceInventory(
            resource_id=transfer.resource_id,
            region_id=transfer.to_region_id,
            quantity_available=transfer.quantity
        )
        db.add(dest)
        
    db_tx = models.ResourceTransaction(**transfer.model_dump())
    db.add(db_tx)
    db.commit()
    
    return {"message": "Transfer successful"}
