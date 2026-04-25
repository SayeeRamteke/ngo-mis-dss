from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
from ..models import models

def calculate_priority_score(db: Session, beneficiary: models.Beneficiary) -> float:
    # 0.4*income_norm + 0.3*family_size_norm + 0.2*risk + 0.1*urgency
    
    # 1. Income Norm
    max_income = 20000.0 # arbitrary max for normalization, could be queried
    normalized_income = max(0, 1 - (beneficiary.monthly_income / max_income)) if beneficiary.monthly_income else 1.0
    
    # 2. Family Size Norm
    max_family_size = 10.0
    normalized_family_size = min(1.0, beneficiary.household_size / max_family_size)
    
    # 3. Vulnerability
    normalized_vulnerability = beneficiary.vulnerability_index / 10.0
    
    # 4. Urgency / Decay Bonus
    enrollments = db.query(models.BeneficiaryProgramEnrollment).filter(
        models.BeneficiaryProgramEnrollment.beneficiary_id == beneficiary.beneficiary_id
    ).all()
    
    days_since_aid = 90 # default to max if no aid
    if enrollments:
        last_aids = [e.last_aid_date for e in enrollments if e.last_aid_date]
        if last_aids:
            latest_aid = max(last_aids)
            delta = datetime.now(timezone.utc).replace(tzinfo=None) - latest_aid.replace(tzinfo=None)
            days_since_aid = delta.days

    decay_bonus = min(1.0, days_since_aid / 90.0)
    
    # Calculation
    priority_score = (0.40 * normalized_income) + (0.30 * normalized_family_size) + (0.20 * normalized_vulnerability) + (0.10 * decay_bonus)
    
    if priority_score > 0.80:
        _create_dss_recommendation(
            db=db,
            rec_type=models.RecommendationTypeEnum.beneficiary_priority,
            severity=models.SeverityEnum.critical,
            title=f"High Priority Beneficiary: {beneficiary.full_name}",
            description=f"Priority score {priority_score:.2f} crossed threshold.",
            evidence={"priority_score": priority_score, "days_since_last_aid": days_since_aid},
            action=f"View Profile"
        )
    return priority_score

def check_resource_redistribution(db: Session):
    snapshots = db.query(models.RegionDemandSnapshot).all()
    # Logic to find surplus and shortage regions and recommend transfers
    # ... Simplified for implementation
    surplus_regions = [s for s in snapshots if s.surplus_quantity > 0]
    shortage_regions = [s for s in snapshots if s.shortage_quantity > 0]
    
    for surplus in surplus_regions:
        for shortage in shortage_regions:
            if surplus.resource_category == shortage.resource_category:
                transfer_qty = min(surplus.surplus_quantity, shortage.shortage_quantity)
                _create_dss_recommendation(
                    db=db,
                    rec_type=models.RecommendationTypeEnum.resource_reallocation,
                    severity=models.SeverityEnum.warning,
                    title=f"Resource Reallocation needed for {surplus.resource_category}",
                    description=f"Transfer {transfer_qty} from Region {surplus.region_id} to Region {shortage.region_id}",
                    evidence={"transfer_qty": transfer_qty, "from": surplus.region_id, "to": shortage.region_id},
                    action="Review Transfer"
                )

def _create_dss_recommendation(db: Session, rec_type, severity, title, description, evidence, action):
    rec = models.DSSRecommendation(
        recommendation_type=rec_type,
        severity=severity,
        title=title,
        description=description,
        evidence_json=evidence,
        suggested_action=action
    )
    db.add(rec)
    db.commit()
