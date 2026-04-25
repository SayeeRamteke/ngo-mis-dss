from typing import List, Dict, Any

def run_whatif_simulation(
    current_budget: float,
    budget_change_percent: float,
    donation_drop_percent: float,
    programs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Stateless What-If Simulator
    Inputs:
    - budget_change_percent (-80 to +50)
    - donation_drop_percent (0 to 100)
    - programs list
    """
    new_budget = current_budget * (1 + (budget_change_percent / 100))
    
    impacted_beneficiaries = 0
    programs_at_risk = []
    
    for program in programs:
        prog_budget = program.get("budget", 0)
        # Apply drop proportionally
        new_prog_budget = prog_budget * (1 + (budget_change_percent / 100))
        
        if new_prog_budget < (prog_budget * 0.60): # At risk if < 60%
            programs_at_risk.append({
                "program_id": program.get("id"),
                "name": program.get("name"),
                "current_budget": prog_budget,
                "new_budget": new_prog_budget,
                "status": "Critical Stop" if new_prog_budget < (prog_budget * 0.40) else "At Risk"
            })
            # Estimate beneficiaries impacted
            if "cost_per_beneficiary" in program and program["cost_per_beneficiary"] > 0:
                lost_budget = prog_budget - new_prog_budget
                impacted_beneficiaries += int(lost_budget / program["cost_per_beneficiary"])

    return {
        "new_total_budget": new_budget,
        "beneficiaries_impacted": impacted_beneficiaries,
        "high_priority_impacted": int(impacted_beneficiaries * 0.2), # estimation
        "programs_at_risk": programs_at_risk,
        "estimated_recovery_days": int(donation_drop_percent * 1.5) # simple model
    }
