from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, date

class BeneficiaryBase(BaseModel):
    full_name: str
    age: int
    gender: str
    location_id: int
    household_size: int = 1
    monthly_income: float = 0.0
    occupation: Optional[str] = None
    vulnerability_index: float = 0.0

class BeneficiaryCreate(BeneficiaryBase):
    pass

class BeneficiaryResponse(BeneficiaryBase):
    beneficiary_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)

class ProgramBase(BaseModel):
    program_name: str
    program_type: str
    region_id: int
    start_date: date
    end_date: Optional[date] = None
    total_budget: float = 0.0
    target_beneficiaries: int = 0
    description: Optional[str] = None

class ProgramCreate(ProgramBase):
    pass

class ProgramResponse(ProgramBase):
    program_id: int
    status: str
    budget_spent: float
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)

class ResourceInventoryBase(BaseModel):
    resource_id: int
    region_id: int
    quantity_available: float
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    condition: str = "good"

class ResourceInventoryCreate(ResourceInventoryBase):
    pass

class ResourceInventoryResponse(ResourceInventoryBase):
    inventory_id: int
    quantity_committed: float
    quantity_reserved: float
    last_restocked_date: datetime
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

class DSSRecommendationResponse(BaseModel):
    recommendation_id: int
    recommendation_type: str
    severity: str
    title: str
    description: str
    evidence_json: Dict[str, Any]
    suggested_action: str
    status: str
    generated_at: datetime
    actioned_by: Optional[int] = None
    actioned_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
