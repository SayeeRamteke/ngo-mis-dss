from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
from ..models import models

def calculate_priority_score(db: Session, beneficiary: models.Beneficiary) -> float:
    # Gap Score Calculation (Shared logic for days since last aid)
    days_since_aid = 90
    if beneficiary.last_aid_date:
        delta = datetime.now(timezone.utc).replace(tzinfo=None) - beneficiary.last_aid_date.replace(tzinfo=None)
        days_since_aid = delta.days
    
    if days_since_aid > 60:
        gap_score = 100
    elif days_since_aid >= 30:
        gap_score = 70
    else:
        gap_score = 30

    priority_score = 0.0

    if beneficiary.beneficiary_type == "organization":
        # Organization Logic
        # 1. Population Served Score (30%)
        pop = beneficiary.population_served or 0
        if pop > 500:
            pop_score = 100
        elif pop >= 200:
            pop_score = 80
        elif pop >= 50:
            pop_score = 60
        else:
            pop_score = 30
            
        # 2. Capacity Gap Score (25%)
        cap = beneficiary.capacity or 1
        occ = beneficiary.current_occupancy or 0
        gap_percent = (occ / cap) * 100 if cap > 0 else 0
        if gap_percent >= 90:
            cap_gap_score = 100
        elif gap_percent >= 70:
            cap_gap_score = 80
        elif gap_percent >= 50:
            cap_gap_score = 60
        else:
            cap_gap_score = 30
            
        # 3. Vulnerability Group Score (20%)
        v_type = beneficiary.vulnerability_type or ""
        v_type = v_type.lower()
        if "orphan" in v_type or "disaster" in v_type:
            vuln_score = 100
        elif "disable" in v_type or "elderly" in v_type:
            vuln_score = 85
        elif "low-income" in v_type or "low income" in v_type:
            vuln_score = 70
        else:
            vuln_score = 50
            
        # 4. Funding Deficit Score (15%)
        fund = beneficiary.funding_level or "medium"
        fund = fund.lower()
        if fund == "low":
            fund_score = 100
        elif fund == "medium":
            fund_score = 60
        else:
            fund_score = 30
            
        priority_score = (pop_score * 0.30) + (cap_gap_score * 0.25) + (vuln_score * 0.20) + (fund_score * 0.15) + (gap_score * 0.10)

    else:
        # Individual Logic
        # 1. Income Score (25%) Smooth Formula
        low_line = 9000.0
        income = beneficiary.monthly_income or 0.0
        raw_inc_score = 100 - ((income / low_line) * 70)
        inc_score = max(30, min(100, raw_inc_score))
            
        # 2. Vulnerability Score (30%)
        v_type = beneficiary.vulnerability_type or ""
        v_type = v_type.lower()
        if "homeless" in v_type:
            vuln_score = 100
        elif "elderly" in v_type:
            vuln_score = 80
        elif "low-income" in v_type or "low income" in v_type or "general_low_income" in v_type:
            vuln_score = 50
        else:
            vuln_score = 50
            
        # 3. Dependents Score (15%)
        size = beneficiary.household_size or 1
        earners = beneficiary.earning_members or 0
        dependents = max(0, size - earners)
        if dependents >= 4:
            dep_score = 100
        elif dependents >= 2:
            dep_score = 70
        elif dependents == 1:
            dep_score = 40
        else:
            dep_score = 20
            
        # 4. Health Condition Score (15%)
        health = beneficiary.health_status or "healthy"
        health = health.lower()
        if "critical" in health:
            health_score = 100
        elif "chronic" in health:
            health_score = 80
        elif "temporary" in health:
            health_score = 50
        else:
            health_score = 20
            
        priority_score = (inc_score * 0.25) + (vuln_score * 0.30) + (dep_score * 0.15) + (health_score * 0.15) + (gap_score * 0.15)

    # Classification
    if priority_score >= 75:
        level = "high"
    elif priority_score >= 50:
        level = "medium"
    else:
        level = "low"
        
    beneficiary.priority_score = priority_score
    beneficiary.priority_level = level
    beneficiary.priority_last_calculated_at = datetime.now(timezone.utc)
    
    if level == "high":
        _create_dss_recommendation(
            db=db,
            rec_type=models.RecommendationTypeEnum.beneficiary_priority,
            severity=models.SeverityEnum.critical,
            title=f"High Priority {'Org' if beneficiary.beneficiary_type == 'organization' else 'Beneficiary'}: {beneficiary.full_name}",
            description=f"Priority score {priority_score:.2f} classified as High.",
            evidence={"priority_score": priority_score, "type": beneficiary.beneficiary_type},
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

def forecast_demand(db: Session, resource_id: int, region_id: int):
    from datetime import timedelta
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
    transactions = db.query(models.ResourceTransaction).filter(
        models.ResourceTransaction.resource_id == resource_id,
        models.ResourceTransaction.to_region_id == region_id,
        models.ResourceTransaction.transaction_type == 'outflow',
        models.ResourceTransaction.date >= three_months_ago
    ).order_by(models.ResourceTransaction.date.asc()).all()

    if len(transactions) < 2:
        # Provide a simulated baseline forecast for the dashboard when data is missing
        return {
            "resource_id": resource_id,
            "region_id": region_id,
            "predicted": 1250.0,
            "confidence": "Low (Simulated)",
            "based_on_records": len(transactions),
            "message": "Insufficient historical data. Showing simulated baseline."
        }

    total = sum(t.quantity for t in transactions)
    moving_avg = total / len(transactions)
    predicted = round(moving_avg * 1.1, 2) # 10% buffer

    confidence = "High" if len(transactions) >= 10 else "Medium" if len(transactions) >= 5 else "Low"
    
    return {
        "resource_id": resource_id,
        "region_id": region_id,
        "predicted": predicted,
        "confidence": confidence,
        "based_on_records": len(transactions)
    }

def detect_anomalies(db: Session):
    from datetime import timedelta
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
    transactions = db.query(models.ResourceTransaction).filter(
        models.ResourceTransaction.date >= three_months_ago
    ).all()

    groups = {}
    for t in transactions:
        key = f"{t.resource_id}-{t.to_region_id}"
        if key not in groups:
            groups[key] = []
        groups[key].append(t.quantity)

    anomalies = []
    for key, quantities in groups.items():
        if len(quantities) > 1:
            avg = sum(quantities[:-1]) / len(quantities[:-1])
            last = quantities[-1]
            if avg > 0 and last > avg * 1.5:
                anomalies.append({
                    "key": key,
                    "average": round(avg, 2),
                    "last_value": last,
                    "flag": "Unusual spike"
                })
    return anomalies

def detect_beneficiary_anomalies(db: Session):
    from datetime import timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    recent_aids = db.query(models.BeneficiaryAid).filter(
        models.BeneficiaryAid.date_received >= thirty_days_ago
    ).all()
    
    b_map = {}
    for a in recent_aids:
        if a.beneficiary_id not in b_map:
            b_map[a.beneficiary_id] = []
        b_map[a.beneficiary_id].append(a)
        
    anomalies = []
    for b_id, aids in b_map.items():
        ben = db.query(models.Beneficiary).filter(models.Beneficiary.beneficiary_id == b_id).first()
        if not ben:
            continue
            
        total_received = sum(a.quantity_received for a in aids)
        
        # Individual Rule: high frequency
        if ben.beneficiary_type == "individual" and len(aids) > 5:
            anomalies.append({
                "beneficiary": ben.full_name,
                "type": "individual",
                "issue": "High frequency of aid (Received > 5 times in 30 days)"
            })
            
        # Organization Rule: Mismatch between capacity and received resources
        if ben.beneficiary_type == "organization":
            cap = ben.capacity or 100
            if total_received > cap * 1.5:
                anomalies.append({
                    "beneficiary": ben.full_name,
                    "type": "organization",
                    "issue": f"Over-allocation anomaly. Received {total_received} but capacity is {cap}"
                })
                
    return anomalies

def what_if_simulation(db: Session, region_id: int, demand_multiplier: float = 1.0, budget_change_percent: float = 0.0,
                       procurement_efficiency: float = 0.8, supply_delay_days: int = 3, active_volunteers: int = None):
    # 1. Baseline Values
    beneficiaries = 450
    per_capita = 1.5
    base_daily_demand = beneficiaries * per_capita   # ~675

    cost_per_unit = 10.0
    daily_budget_base = 7000.0
    
    # 2. Apply User Inputs
    adjusted_demand = base_daily_demand * demand_multiplier
    initial_stock = adjusted_demand * 12
    adjusted_daily_budget = daily_budget_base * (1 + (budget_change_percent / 100.0))
    
    print("--- DSS SIMULATION LOG ---")
    print("Demand:", adjusted_demand)
    print("Max Procurement:", (procurement_efficiency * adjusted_daily_budget) / cost_per_unit)
    
    # 3. Setup Loop Variables
    stock = initial_stock
    shortage_days = 0
    timeline_data = []
    delivery_queue = []
    
    previous_shortage = 0
    
    # 4. 30-Day Simulation Loop
    for day in range(1, 31):
        
        # Need-based procurement
        required_daily_procurement = adjusted_demand
        gap = required_daily_procurement - (stock / 10)
        procurement_budget = adjusted_daily_budget * (1 + max(0, gap / adjusted_demand))
            
        daily_procurement = (procurement_efficiency * procurement_budget) / cost_per_unit
        
        # Queue delivery
        delivery_day = day + supply_delay_days
        delivery_queue.append({
            "day": delivery_day,
            "quantity": daily_procurement
        })

        # A. Receive supply
        for delivery in delivery_queue:
            if delivery["day"] == day:
                stock += delivery["quantity"]

        # B. Dynamic demand
        demand = adjusted_demand + (previous_shortage * 0.1)

        # C. Volunteer effect
        volunteer_factor = 1.0
        if active_volunteers is not None:
            if active_volunteers < 30:
                volunteer_factor = 0.85
            elif active_volunteers > 70:
                volunteer_factor = 1.1

        # D. Consumption
        consumed = min(stock, demand)
        effective_consumption = consumed * volunteer_factor
        shortage = demand - consumed

        stock -= effective_consumption
        previous_shortage = shortage

        if shortage > 0:
            shortage_days += 1

        timeline_data.append({
            "day": day,
            "stock": round(stock, 2),
            "demand": round(demand, 2),
            "shortage": round(shortage, 2)
        })

    # 5. System Status Logic
    system_status = "Healthy"
    shortage_trend = "Stable"
    root_cause = None
    recommendation = None
    
    if shortage_days == 0:
        system_status = "Healthy"
        shortage_trend = "Stable"
        root_cause = None
    elif shortage_days <= 8:
        system_status = "Strained"
        shortage_trend = "Increasing"
        root_cause = "Demand approaching supply limits"
        recommendation = "Monitor inventory levels closely and consider a small budget bump."
    else:
        system_status = "Struggling"
        shortage_trend = "Critical"
        
        if procurement_efficiency < 0.5:
            root_cause = "Poor procurement efficiency"
            recommendation = "Improve supply chain conversion efficiency before adding budget."
        elif supply_delay_days > 7:
            root_cause = "High supply delay"
            recommendation = "Fix logistics bottleneck. Goods are taking too long to arrive."
        elif budget_change_percent < 0:
            root_cause = "Budget reduction"
            recommendation = "Restore funding to baseline."
        else:
            root_cause = "Demand exceeding supply capacity"
            recommendation = "Seek external emergency aid. Current system cannot sustain this demand multiplier."

    return {
        "shortageTrend": shortage_trend,
        "programStatus": system_status,
        "rootCause": root_cause,
        "recommendation": recommendation,
        "timelineData": timeline_data
    }

def redistribution_recommendations(db: Session):
    stocks = db.query(models.ResourceInventory).all()
    
    grouped = {}
    for s in stocks:
        if s.resource_id not in grouped:
            resource = db.query(models.Resource).filter(models.Resource.resource_id == s.resource_id).first()
            grouped[s.resource_id] = {"resource": resource.resource_name if resource else str(s.resource_id), "stocks": []}
        region = db.query(models.Region).filter(models.Region.region_id == s.region_id).first()
        grouped[s.resource_id]["stocks"].append({
            "region_id": s.region_id,
            "region": region.region_name if region else str(s.region_id),
            "quantity": s.quantity_available
        })

    recommendations = []
    for rid, data in grouped.items():
        sorted_stocks = sorted(data["stocks"], key=lambda x: x["quantity"], reverse=True)
        if len(sorted_stocks) > 1:
            surplus = sorted_stocks[0]
            shortage = sorted_stocks[-1]
            if surplus["quantity"] > 50 and shortage["quantity"] < 10:
                transfer = int((surplus["quantity"] - shortage["quantity"]) / 2)
                recommendations.append({
                    "resource": data["resource"],
                    "from": surplus["region"],
                    "to": shortage["region"],
                    "suggestedTransfer": transfer
                })
    return recommendations
