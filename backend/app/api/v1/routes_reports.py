from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from ...core.database import get_db
from ...models import models

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

@router.get("/resources")
def get_resources_report(region_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.ResourceInventory)
    if region_id:
        query = query.filter(models.ResourceInventory.region_id == region_id)
    stocks = query.all()
    
    report = []
    for s in stocks:
        resource = db.query(models.Resource).filter(models.Resource.resource_id == s.resource_id).first()
        region = db.query(models.Region).filter(models.Region.region_id == s.region_id).first()
        report.append({
            "inventory_id": s.inventory_id,
            "resource_id": s.resource_id,
            "region_id": s.region_id,
            "resource": resource.resource_name if resource else str(s.resource_id),
            "region": region.region_name if region else str(s.region_id),
            "quantity_available": s.quantity_available,
            "quantity_committed": s.quantity_committed
        })
    return report

@router.get("/resource-insights")
def get_resource_insights(db: Session = Depends(get_db)):
    from datetime import datetime, timezone, timedelta
    today = datetime.now(timezone.utc).date()
    
    stocks = db.query(models.ResourceInventory).all()
    
    kpis = {"total_types": 0, "low_stock": 0, "expiring_soon": 0, "surplus": 0}
    alerts = []
    
    # Pre-fetch resources and regions to minimize queries
    resources = {r.resource_id: r for r in db.query(models.Resource).all()}
    regions = {r.region_id: r for r in db.query(models.Region).all()}
    
    kpis["total_types"] = len(resources)
    
    shortages = []
    surpluses = []
    
    for s in stocks:
        res = resources.get(s.resource_id)
        if not res: continue
        
        reg_name = regions[s.region_id].region_name if s.region_id in regions else f"Region {s.region_id}"
        
        # Check Shortage
        if s.quantity_available < res.minimum_threshold:
            kpis["low_stock"] += 1
            alerts.append({
                "type": "shortage",
                "message": f"Shortage Alert: {res.resource_name} is below threshold in {reg_name} ({s.quantity_available} left)",
                "resource_id": res.resource_id,
                "region_id": s.region_id,
                "deficit": res.minimum_threshold - s.quantity_available
            })
            shortages.append({"inventory": s, "resource": res, "deficit": res.minimum_threshold - s.quantity_available})
            
        # Check Surplus
        if res.maximum_threshold > 0 and s.quantity_available > res.maximum_threshold:
            kpis["surplus"] += 1
            alerts.append({
                "type": "surplus",
                "message": f"Surplus Alert: {reg_name} has excess {res.resource_name} ({s.quantity_available} available)",
                "resource_id": res.resource_id,
                "region_id": s.region_id,
                "excess": s.quantity_available - res.maximum_threshold
            })
            surpluses.append({"inventory": s, "resource": res, "excess": s.quantity_available - res.maximum_threshold})
            
        # Check Expiry
        if s.expiry_date:
            days_left = (s.expiry_date - today).days
            if 0 <= days_left <= 14:
                kpis["expiring_soon"] += 1
                alerts.append({
                    "type": "expiry",
                    "message": f"{res.resource_name} in {reg_name} expires in {days_left} days",
                    "inventory_id": s.inventory_id,
                    "days_left": days_left,
                    "quantity": s.quantity_available
                })
                
    # Match Transfers
    transfers = []
    for short in shortages:
        # Find matching surplus
        match = next((sur for sur in surpluses if sur["resource"].resource_id == short["resource"].resource_id and sur["excess"] > 0), None)
        if match:
            transfer_qty = min(short["deficit"], match["excess"])
            if transfer_qty > 0:
                # Calculate costs (dummy logic for DSS comparison)
                distance_factor = abs(match["inventory"].region_id - short["inventory"].region_id)
                transport_cost_per_unit = distance_factor * 15 # e.g. 15 rupees per unit per distance unit
                buying_cost_per_unit = 50 # Base buying cost

                if transport_cost_per_unit < buying_cost_per_unit:
                    transfers.append({
                        "type": "transfer",
                        "message": f"Region {short['inventory'].region_id} requires {short['deficit']} {short['resource'].unit_of_measure}. Suggested Transfer: {transfer_qty} from Region {match['inventory'].region_id} (Leaves safe surplus in Region {match['inventory'].region_id})",
                        "resource_id": short["resource"].resource_id,
                        "from_region_id": match["inventory"].region_id,
                        "to_region_id": short["inventory"].region_id,
                        "quantity": transfer_qty
                    })
                else:
                    transfers.append({
                        "type": "buy",
                        "message": f"Region {short['inventory'].region_id} requires {transfer_qty} {short['resource'].unit_of_measure}. Suggested Buy/Restock (Transfer from Region {match['inventory'].region_id} too expensive)",
                        "resource_id": short["resource"].resource_id,
                        "region_id": short["inventory"].region_id,
                        "quantity": transfer_qty
                    })

                # Adjust for subsequent matching
                match["excess"] -= transfer_qty
                short["deficit"] -= transfer_qty
        
        # If still deficit, must buy
        if short["deficit"] > 0:
            transfers.append({
                "type": "buy",
                "message": f"Region {short['inventory'].region_id} requires {short['deficit']} {short['resource'].unit_of_measure}. Suggested Buy/Restock (No surplus available to transfer)",
                "resource_id": short["resource"].resource_id,
                "region_id": short["inventory"].region_id,
                "quantity": short["deficit"]
            })

    # Combine actionable DSS
    dss_cards = alerts + transfers

    return {
        "kpis": kpis,
        "dss_cards": dss_cards
    }

@router.get("/programs")
def get_programs_report(db: Session = Depends(get_db)):
    programs = db.query(models.Program).all()
    report = []
    for p in programs:
        region = db.query(models.Region).filter(models.Region.region_id == p.region_id).first()
        
        # Volunteers Assigned
        vols_assigned = db.query(models.ProgramVolunteer).filter(models.ProgramVolunteer.program_id == p.program_id).all()
        vol_details = []
        for v in vols_assigned:
            profile = db.query(models.VolunteerProfile).filter(models.VolunteerProfile.profile_id == v.volunteer_id).first()
            if profile:
                user = db.query(models.User).filter(models.User.user_id == profile.user_id).first()
                if user:
                    vol_details.append({
                        "name": user.full_name,
                        "start_date": v.start_date.isoformat() if v.start_date else None,
                        "end_date": v.end_date.isoformat() if v.end_date else None,
                        "role": v.role or "General"
                    })
        
        # Beneficiaries Served Table & Summary Widgets
        aids = db.query(models.BeneficiaryAid).filter(models.BeneficiaryAid.program_id == p.program_id).all()
        
        ben_table = []
        unique_bens = set()
        high_served = 0
        med_served = 0
        low_served = 0
        total_resources = 0
        
        for aid in aids:
            ben = db.query(models.Beneficiary).filter(models.Beneficiary.beneficiary_id == aid.beneficiary_id).first()
            res = db.query(models.Resource).filter(models.Resource.resource_id == aid.resource_id).first()
            
            if ben:
                ben_table.append({
                    "name": ben.full_name,
                    "type": "ORG" if ben.beneficiary_type == "organization" else "IND",
                    "resource": res.resource_name if res else "Unknown",
                    "quantity": aid.quantity_received,
                    "date": aid.date_received.isoformat() if aid.date_received else None
                })
                
                total_resources += aid.quantity_received
                
                if ben.beneficiary_id not in unique_bens:
                    unique_bens.add(ben.beneficiary_id)
                    p_level = (ben.priority_level or "medium").lower()
                    if p_level == "high": high_served += 1
                    elif p_level == "medium": med_served += 1
                    else: low_served += 1
        
        # Impact reach
        reach = 0
        for b_id in unique_bens:
            ben = db.query(models.Beneficiary).filter(models.Beneficiary.beneficiary_id == b_id).first()
            if ben:
                if ben.beneficiary_type == "organization":
                    reach += (ben.population_served or 0)
                else:
                    reach += 1
                    
        cost_per_beneficiary = 0
        if reach > 0:
            cost_per_beneficiary = p.budget_spent / reach

        report.append({
            "program_id": p.program_id,
            "program_name": p.program_name,
            "region": region.region_name if region else str(p.region_id),
            "status": p.status,
            "total_budget": p.total_budget,
            "budget_spent": p.budget_spent,
            "utilization": round((p.budget_spent / p.total_budget)*100, 1) if p.total_budget > 0 else 0,
            
            # Drill-down metrics
            "volunteers": vol_details,
            "beneficiary_table": sorted(ben_table, key=lambda x: x['date'] if x['date'] else '', reverse=True),
            "summary": {
                "total_served": reach,
                "high_served": high_served,
                "medium_served": med_served,
                "low_served": low_served,
                "total_resources": total_resources,
                "cost_per_beneficiary": round(cost_per_beneficiary, 2)
            }
        })
    return report

@router.get("/volunteers")
def get_volunteers_report(db: Session = Depends(get_db)):
    volunteers = db.query(models.VolunteerProfile).all()
    report = []
    for v in volunteers:
        user = db.query(models.User).filter(models.User.user_id == v.user_id).first()
        skills = db.query(models.VolunteerSkill).filter(models.VolunteerSkill.volunteer_id == v.profile_id).all()
        assignments = db.query(models.ProgramVolunteer).filter(models.ProgramVolunteer.volunteer_id == v.profile_id).all()
        region = db.query(models.Region).filter(models.Region.region_id == user.region_id).first() if user else None
        
        assignment_history = []
        for a in assignments:
            prog = db.query(models.Program).filter(models.Program.program_id == a.program_id).first()
            assignment_history.append({
                "program_name": prog.program_name if prog else str(a.program_id),
                "start_date": a.start_date.isoformat() if a.start_date else None,
                "end_date": a.end_date.isoformat() if a.end_date else None,
                "status": a.status
            })

        report.append({
            "profile_id": v.profile_id,
            "name": user.full_name if user else "Unknown",
            "region": region.region_name if region else "Unknown",
            "availability": v.availability,
            "skills": [s.skill_name for s in skills],
            "total_assignments": len(assignments),
            "assignments": assignment_history
        })
    return report

@router.get("/volunteer-matrix")
def get_volunteer_matrix(db: Session = Depends(get_db)):
    # Returns skill availability by region
    skills = db.query(models.VolunteerSkill).all()
    matrix = {}
    for s in skills:
        profile = db.query(models.VolunteerProfile).filter(models.VolunteerProfile.profile_id == s.volunteer_id).first()
        if profile and profile.availability == "available":
            user = db.query(models.User).filter(models.User.user_id == profile.user_id).first()
            if user:
                region = db.query(models.Region).filter(models.Region.region_id == user.region_id).first()
                reg_name = region.region_name if region else "Unknown"
                if reg_name not in matrix:
                    matrix[reg_name] = {}
                matrix[reg_name][s.skill_name] = matrix[reg_name].get(s.skill_name, 0) + 1
    
    formatted_matrix = []
    for reg, sks in matrix.items():
        formatted_matrix.append({"region": reg, "skills": sks})
    return formatted_matrix

@router.get("/volunteer-utilization")
def get_volunteer_utilization(db: Session = Depends(get_db)):
    total = db.query(models.VolunteerProfile).count()
    assigned = db.query(models.VolunteerProfile).filter(models.VolunteerProfile.availability == "assigned").count()
    idle = total - assigned
    return {
        "total": total,
        "assigned": assigned,
        "idle": idle,
        "utilization_rate": round((assigned / total * 100), 1) if total > 0 else 0
    }

@router.get("/finance")
def get_finance_report(db: Session = Depends(get_db)):
    donations = db.query(models.Donation).all()
    expenses = db.query(models.Expense).all()
    programs = db.query(models.Program).all()
    
    total_donations = sum(d.amount for d in donations)
    total_expenses = sum(e.amount for e in expenses)
    total_budget = sum(p.total_budget for p in programs)
    
    return {
        "total_donations": total_donations,
        "total_expenses": total_expenses,
        "total_budget_allocated": total_budget,
        "donations_count": len(donations),
        "expenses_count": len(expenses)
    }

@router.get("/beneficiaries")
def get_beneficiaries_report(region_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Beneficiary)
    if region_id:
        query = query.filter(models.Beneficiary.location_id == region_id)
    beneficiaries = query.all()
    
    report = []
    for b in beneficiaries:
        aid_history = db.query(models.BeneficiaryAid).filter(models.BeneficiaryAid.beneficiary_id == b.beneficiary_id).all()
        region = db.query(models.Region).filter(models.Region.region_id == b.location_id).first()
        report.append({
            "name": b.full_name,
            "region": region.region_name if region else str(b.location_id),
            "priority": getattr(b, 'priority_level', 'medium'),
            "aid_received_count": len(aid_history)
        })
    return report

@router.get("/beneficiary-distribution")
def get_beneficiary_distribution(db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    # Query count grouped by region and priority
    counts = db.query(
        models.Region.region_name,
        models.Beneficiary.priority_level,
        func.count(models.Beneficiary.beneficiary_id)
    ).join(
        models.Beneficiary, models.Region.region_id == models.Beneficiary.location_id
    ).group_by(
        models.Region.region_name,
        models.Beneficiary.priority_level
    ).all()
    
    # Format data
    result = []
    grouped = {}
    for region_name, priority, count in counts:
        if region_name not in grouped:
            grouped[region_name] = {"region": region_name, "high": 0, "medium": 0, "low": 0}
        p_key = priority.lower() if priority else "medium"
        grouped[region_name][p_key] = count
        
    for k, v in grouped.items():
        result.append(v)
        
    return result

@router.get("/program-reach")
def get_program_reach(db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    programs = db.query(models.Program).all()
    result = []
    
    for p in programs:
        aids = db.query(models.BeneficiaryAid).filter(models.BeneficiaryAid.program_id == p.program_id).all()
        unique_bens = set(a.beneficiary_id for a in aids)
        
        reach = 0
        for b_id in unique_bens:
            ben = db.query(models.Beneficiary).filter(models.Beneficiary.beneficiary_id == b_id).first()
            if ben:
                if ben.beneficiary_type == "organization":
                    reach += (ben.population_served or 0)
                else:
                    reach += 1
                    
        result.append({"program": p.program_name, "beneficiaries_reached": reach})
        
    return result
