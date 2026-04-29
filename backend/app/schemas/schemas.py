from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, date

class ResourceCreateNew(BaseModel):
    resource_name: str
    category: str
    resource_type: str
    unit_of_measure: str
    initial_quantity: float
    region_id: int

class VolunteerCreateNew(BaseModel):
    full_name: str
    email: str
    region_id: Optional[int] = None
    skill_name: str

class BeneficiaryBase(BaseModel):
    full_name: str
    location_id: Optional[int] = None
    need_type: str = "general"
    contact_info: Optional[str] = None
    
    beneficiary_type: str = "individual"
    
    # Common/Legacy
    age: Optional[int] = None
    gender: Optional[str] = None
    household_size: int = 1
    monthly_income: float = 0.0
    occupation: Optional[str] = None
    vulnerability_index: float = 0.0
    priority_level: str = "medium"
    is_organization: bool = False
    
    # Individual Fields
    date_of_birth: Optional[date] = None
    earning_members: int = 0
    health_status: str = "healthy"
    vulnerability_type: Optional[str] = None
    
    # Organization Fields
    organization_type: Optional[str] = None
    registration_number: Optional[str] = None
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    population_served: Optional[int] = None
    funding_level: Optional[str] = None
    service_type: Optional[str] = None

class BeneficiaryCreate(BeneficiaryBase):
    pass

class BeneficiaryResponse(BeneficiaryBase):
    beneficiary_id: int
    is_active: bool
    priority_score: float
    priority_last_calculated_at: Optional[datetime] = None
    last_aid_date: Optional[datetime] = None
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

class VolunteerProfileBase(BaseModel):
    user_id: int
    phone: Optional[str] = None
    availability: str = "available"

class VolunteerProfileCreate(VolunteerProfileBase):
    pass

class VolunteerProfileResponse(VolunteerProfileBase):
    profile_id: int
    join_date: datetime
    model_config = ConfigDict(from_attributes=True)

class VolunteerSkillBase(BaseModel):
    skill_name: str
    proficiency: str

class VolunteerSkillCreate(VolunteerSkillBase):
    pass

class VolunteerSkillResponse(VolunteerSkillBase):
    skill_id: int
    volunteer_id: int
    model_config = ConfigDict(from_attributes=True)

class ProgramVolunteerBase(BaseModel):
    program_id: int
    volunteer_id: int
    role: Optional[str] = None
    start_date: datetime
    end_date: datetime
    status: str = "active"

class ProgramVolunteerCreate(ProgramVolunteerBase):
    pass

class ProgramVolunteerResponse(ProgramVolunteerBase):
    assignment_id: int
    model_config = ConfigDict(from_attributes=True)

class DonationBase(BaseModel):
    donor_name: str
    amount: float
    donation_type: str
    program_id: Optional[int] = None
    notes: Optional[str] = None

class DonationCreate(DonationBase):
    pass

class DonationResponse(DonationBase):
    donation_id: int
    date: datetime
    model_config = ConfigDict(from_attributes=True)

class ExpenseBase(BaseModel):
    program_id: Optional[int] = None
    region_id: Optional[int] = None
    category: str
    amount: float
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    expense_id: int
    date: datetime
    approved_by: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ResourceTransactionBase(BaseModel):
    resource_id: int
    from_region_id: Optional[int] = None
    to_region_id: Optional[int] = None
    quantity: float
    transaction_type: str
    program_id: Optional[int] = None
    notes: Optional[str] = None

class ResourceTransactionCreate(ResourceTransactionBase):
    pass

class ResourceTransactionResponse(ResourceTransactionBase):
    transaction_id: int
    date: datetime
    model_config = ConfigDict(from_attributes=True)

class BeneficiaryAidBase(BaseModel):
    beneficiary_id: int
    program_id: Optional[int] = None
    resource_id: int
    quantity_received: float

class BeneficiaryAidCreate(BeneficiaryAidBase):
    date_received: Optional[datetime] = None

class BeneficiaryAidResponse(BeneficiaryAidBase):
    aid_id: int
    date_received: datetime
    program_name: Optional[str] = None
    resource_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class AlertResponse(BaseModel):
    alert_id: int
    alert_type: str
    message: str
    region_id: Optional[int] = None
    program_id: Optional[int] = None
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ForecastDataResponse(BaseModel):
    forecast_id: int
    resource_id: int
    region_id: int
    month: str
    predicted: float
    confidence: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

