from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from ..core.database import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"
    program_manager = "program_manager"
    data_entry = "data_entry"
    volunteer = "volunteer"
    donor = "donor"

class ProgramTypeEnum(str, enum.Enum):
    basic_needs = "basic_needs"
    health = "health"
    education = "education"

class ProgramStatusEnum(str, enum.Enum):
    active = "active"
    flagged = "flagged"
    paused = "paused"
    closed = "closed"

class ResourceTypeEnum(str, enum.Enum):
    consumable = "consumable"
    reusable = "reusable"
    financial = "financial"
    human = "human"

class RecommendationTypeEnum(str, enum.Enum):
    beneficiary_priority = "beneficiary_priority"
    resource_reallocation = "resource_reallocation"
    program_flag = "program_flag"
    program_scale = "program_scale"
    donor_retention = "donor_retention"
    volunteer_gap = "volunteer_gap"

class SeverityEnum(str, enum.Enum):
    critical = "critical"
    warning = "warning"
    info = "info"

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.data_entry)
    region_id = Column(Integer, ForeignKey("regions.region_id"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Region(Base):
    __tablename__ = "regions"
    region_id = Column(Integer, primary_key=True, index=True)
    region_name = Column(String, index=True)
    state = Column(String)
    district = Column(String)
    population_served = Column(Integer, default=0)
    coordinates_lat = Column(Float, nullable=True)
    coordinates_lng = Column(Float, nullable=True)
    transport_cost_zone = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    beneficiary_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    age = Column(Integer, nullable=True) # Keeping for legacy, prefer date_of_birth
    gender = Column(String, nullable=True)
    location_id = Column(Integer, ForeignKey("regions.region_id"))
    household_size = Column(Integer, default=1)
    monthly_income = Column(Float, default=0.0)
    occupation = Column(String, nullable=True)
    vulnerability_index = Column(Float, default=0.0)
    need_type = Column(String, default="general")
    priority_level = Column(String, default="medium")
    contact_info = Column(String, nullable=True)
    is_organization = Column(Boolean, default=False) # Legacy
    
    # --- New DSS & Type Fields ---
    beneficiary_type = Column(String, default="individual") # "individual" or "organization"
    priority_score = Column(Float, default=0.0)
    priority_last_calculated_at = Column(DateTime, nullable=True)
    last_aid_date = Column(DateTime, nullable=True)
    
    # Individual Fields
    date_of_birth = Column(Date, nullable=True)
    earning_members = Column(Integer, default=0)
    health_status = Column(String, default="healthy")
    vulnerability_type = Column(String, nullable=True)
    
    # Organization Fields
    organization_type = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)
    capacity = Column(Integer, nullable=True)
    current_occupancy = Column(Integer, nullable=True)
    population_served = Column(Integer, nullable=True)
    funding_level = Column(String, nullable=True)
    service_type = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_by = Column(Integer, ForeignKey("users.user_id"))

class VulnerabilityAssessment(Base):
    __tablename__ = "vulnerability_assessments"
    assessment_id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.beneficiary_id"))
    assessed_by = Column(Integer, ForeignKey("users.user_id"))
    assessment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    income_score = Column(Float)
    health_score = Column(Float)
    shelter_score = Column(Float)
    food_security_score = Column(Float)
    education_score = Column(Float)
    composite_vulnerability_index = Column(Float)
    notes = Column(Text, nullable=True)

class Program(Base):
    __tablename__ = "programs"
    program_id = Column(Integer, primary_key=True, index=True)
    program_name = Column(String, index=True)
    program_type = Column(SQLEnum(ProgramTypeEnum))
    region_id = Column(Integer, ForeignKey("regions.region_id"))
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)
    status = Column(SQLEnum(ProgramStatusEnum), default=ProgramStatusEnum.active)
    total_budget = Column(Float, default=0.0)
    budget_spent = Column(Float, default=0.0)
    target_beneficiaries = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.user_id"))

class BeneficiaryProgramEnrollment(Base):
    __tablename__ = "beneficiary_program_enrollments"
    enrollment_id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.beneficiary_id"))
    program_id = Column(Integer, ForeignKey("programs.program_id"))
    enrolled_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="active") # active, completed, dropped
    dropout_reason = Column(String, nullable=True)
    last_aid_date = Column(DateTime, nullable=True)

class Resource(Base):
    __tablename__ = "resources"
    resource_id = Column(Integer, primary_key=True, index=True)
    resource_name = Column(String, index=True)
    resource_type = Column(SQLEnum(ResourceTypeEnum))
    category = Column(String) # food, medicine, equipment, funds, staff
    unit_of_measure = Column(String)
    unit_cost = Column(Float, default=0.0)
    minimum_threshold = Column(Float, default=0.0)
    description = Column(Text, nullable=True)

class ResourceInventory(Base):
    __tablename__ = "resource_inventory"
    inventory_id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.resource_id"))
    region_id = Column(Integer, ForeignKey("regions.region_id"))
    quantity_available = Column(Float, default=0.0)
    quantity_committed = Column(Float, default=0.0)
    quantity_reserved = Column(Float, default=0.0)
    batch_number = Column(String, nullable=True)
    expiry_date = Column(Date, nullable=True)
    condition = Column(String, default="good")
    last_restocked_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class RegionDemandSnapshot(Base):
    __tablename__ = "region_demand_snapshots"
    snapshot_id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.region_id"))
    resource_category = Column(String)
    demand_quantity = Column(Float)
    supply_quantity = Column(Float)
    shortage_quantity = Column(Float)
    surplus_quantity = Column(Float)
    snapshot_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DSSRecommendation(Base):
    __tablename__ = "dss_recommendations"
    recommendation_id = Column(Integer, primary_key=True, index=True)
    recommendation_type = Column(SQLEnum(RecommendationTypeEnum))
    severity = Column(SQLEnum(SeverityEnum))
    title = Column(String)
    description = Column(Text)
    evidence_json = Column(JSON)
    suggested_action = Column(String)
    status = Column(String, default="active") # active, actioned, dismissed
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    actioned_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    actioned_at = Column(DateTime, nullable=True)
    override_reason = Column(Text, nullable=True)

class WhatIfSimulation(Base):
    __tablename__ = "whatif_simulations"
    simulation_id = Column(Integer, primary_key=True, index=True)
    run_by = Column(Integer, ForeignKey("users.user_id"))
    run_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    input_parameters_json = Column(JSON)
    output_results_json = Column(JSON)
    scenario_name = Column(String)
    notes = Column(Text, nullable=True)

class VolunteerProfile(Base):
    __tablename__ = "volunteer_profiles"
    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    phone = Column(String, nullable=True)
    availability = Column(String, default="available") # available, assigned, inactive
    join_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class VolunteerSkill(Base):
    __tablename__ = "volunteer_skills"
    skill_id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteer_profiles.profile_id"))
    skill_name = Column(String)
    proficiency = Column(String) # basic, intermediate, expert

class ProgramVolunteer(Base):
    __tablename__ = "program_volunteers"
    assignment_id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.program_id"))
    volunteer_id = Column(Integer, ForeignKey("volunteer_profiles.profile_id"))
    role = Column(String, nullable=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    status = Column(String, default="active")

class Donation(Base):
    __tablename__ = "donations"
    donation_id = Column(Integer, primary_key=True, index=True)
    donor_name = Column(String)
    amount = Column(Float)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    donation_type = Column(String) # cash, in_kind
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=True)
    notes = Column(Text, nullable=True)

class Expense(Base):
    __tablename__ = "expenses"
    expense_id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=True)
    region_id = Column(Integer, ForeignKey("regions.region_id"), nullable=True)
    category = Column(String)
    amount = Column(Float)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    description = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)

class ResourceTransaction(Base):
    __tablename__ = "resource_transactions"
    transaction_id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.resource_id"))
    from_region_id = Column(Integer, ForeignKey("regions.region_id"), nullable=True)
    to_region_id = Column(Integer, ForeignKey("regions.region_id"), nullable=True)
    quantity = Column(Float)
    transaction_type = Column(String) # inflow, outflow, transfer
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=True)
    notes = Column(Text, nullable=True)

class BeneficiaryAid(Base):
    __tablename__ = "beneficiary_aid"
    aid_id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.beneficiary_id"))
    program_id = Column(Integer, ForeignKey("programs.program_id"))
    resource_id = Column(Integer, ForeignKey("resources.resource_id"))
    quantity_received = Column(Float)
    date_received = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Alert(Base):
    __tablename__ = "alerts"
    alert_id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String)
    message = Column(String)
    region_id = Column(Integer, ForeignKey("regions.region_id"), nullable=True)
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=True)
    status = Column(String, default="unread")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ForecastData(Base):
    __tablename__ = "forecast_data"
    forecast_id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.resource_id"))
    region_id = Column(Integer, ForeignKey("regions.region_id"))
    month = Column(String)
    predicted = Column(Float)
    confidence = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

