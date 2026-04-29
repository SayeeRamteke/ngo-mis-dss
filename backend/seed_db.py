from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import models
from datetime import datetime, timedelta, timezone

def seed_data():
    db = SessionLocal()
    
    try:
        # Check if already seeded
        if db.query(models.Region).first():
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding database...")

        # 1. Regions
        regions = [
            models.Region(region_name="Mumbai North", state="Maharashtra", district="Mumbai Suburban"),
            models.Region(region_name="Pune Rural", state="Maharashtra", district="Pune"),
            models.Region(region_name="Nagpur Central", state="Maharashtra", district="Nagpur")
        ]
        db.add_all(regions)
        db.commit()
        for r in regions: db.refresh(r)

        # 2. Users
        users = [
            models.User(full_name="Admin User", email="admin@ngo.org", role="admin"),
            models.User(full_name="Manager Mumbai", email="mumbai@ngo.org", role="program_manager", region_id=regions[0].region_id),
            models.User(full_name="Ravi Volunteer", email="ravi@ngo.org", role="volunteer", region_id=regions[0].region_id),
            models.User(full_name="Priya Volunteer", email="priya@ngo.org", role="volunteer", region_id=regions[1].region_id)
        ]
        db.add_all(users)
        db.commit()
        for u in users: db.refresh(u)

        # 3. Volunteer Profiles & Skills
        profiles = [
            models.VolunteerProfile(user_id=users[2].user_id, availability="available"),
            models.VolunteerProfile(user_id=users[3].user_id, availability="assigned")
        ]
        db.add_all(profiles)
        db.commit()
        for p in profiles: db.refresh(p)

        skills = [
            models.VolunteerSkill(volunteer_id=profiles[0].profile_id, skill_name="First Aid", proficiency="expert"),
            models.VolunteerSkill(volunteer_id=profiles[0].profile_id, skill_name="Logistics", proficiency="intermediate"),
            models.VolunteerSkill(volunteer_id=profiles[1].profile_id, skill_name="Teaching", proficiency="expert")
        ]
        db.add_all(skills)
        db.commit()

        # 4. Programs
        programs = [
            models.Program(program_name="Rural Education Drive", program_type="education", region_id=regions[1].region_id, total_budget=500000, budget_spent=350000, status="active", start_date=datetime.now(timezone.utc).date()),
            models.Program(program_name="Flood Relief Camp", program_type="basic_needs", region_id=regions[0].region_id, total_budget=1000000, budget_spent=950000, status="active", start_date=datetime.now(timezone.utc).date()),
            models.Program(program_name="Healthcare Awareness", program_type="health", region_id=regions[2].region_id, total_budget=300000, budget_spent=100000, status="active", start_date=datetime.now(timezone.utc).date())
        ]
        db.add_all(programs)
        db.commit()
        for p in programs: db.refresh(p)

        # 5. Resources & Inventory
        resources = [
            models.Resource(resource_name="Rice Packs", category="Food", resource_type="consumable", unit_of_measure="kg"),
            models.Resource(resource_name="Medical Kits", category="Medical", resource_type="consumable", unit_of_measure="boxes"),
            models.Resource(resource_name="Blankets", category="Clothing", resource_type="reusable", unit_of_measure="pieces")
        ]
        db.add_all(resources)
        db.commit()
        for r in resources: db.refresh(r)

        inventories = [
            models.ResourceInventory(resource_id=resources[0].resource_id, region_id=regions[0].region_id, quantity_available=50), # Low stock
            models.ResourceInventory(resource_id=resources[0].resource_id, region_id=regions[1].region_id, quantity_available=2000), # High stock
            models.ResourceInventory(resource_id=resources[1].resource_id, region_id=regions[0].region_id, quantity_available=500),
            models.ResourceInventory(resource_id=resources[2].resource_id, region_id=regions[2].region_id, quantity_available=150)
        ]
        db.add_all(inventories)
        db.commit()

        # Add some transactions for DSS engine
        now = datetime.now(timezone.utc)
        transactions = []
        for i in range(15):
            transactions.append(
                models.ResourceTransaction(
                    resource_id=resources[0].resource_id,
                    to_region_id=regions[0].region_id,
                    quantity=100,
                    transaction_type="outflow",
                    date=now - timedelta(days=i*5)
                )
            )
        db.add_all(transactions)
        db.commit()

        # 6. Beneficiaries
        beneficiaries = [
            models.Beneficiary(full_name="Aisha Khan", household_size=4, monthly_income=5000, vulnerability_index=8.5, location_id=regions[0].region_id, need_type="Medical", priority_level="high"),
            models.Beneficiary(full_name="Sanjay Patil", household_size=6, monthly_income=8000, vulnerability_index=6.0, location_id=regions[1].region_id, need_type="Food", priority_level="medium"),
            models.Beneficiary(full_name="Sunita Sharma", household_size=2, monthly_income=12000, vulnerability_index=3.0, location_id=regions[0].region_id, need_type="General", priority_level="low")
        ]
        db.add_all(beneficiaries)
        db.commit()

        # 7. Finance (Donations & Expenses)
        donations = [
            models.Donation(donor_name="Global Charity Fund", amount=800000, donation_type="Cash", program_id=programs[1].program_id),
            models.Donation(donor_name="Anonymous", amount=50000, donation_type="Cash"),
            models.Donation(donor_name="Tech Corp CSR", amount=350000, donation_type="Cash", program_id=programs[0].program_id)
        ]
        db.add_all(donations)

        expenses = [
            models.Expense(program_id=programs[1].program_id, region_id=regions[0].region_id, category="Resource Procurement", amount=450000),
            models.Expense(program_id=programs[1].program_id, region_id=regions[0].region_id, category="Logistics", amount=150000),
            models.Expense(program_id=programs[0].program_id, region_id=regions[1].region_id, category="Events", amount=100000)
        ]
        db.add_all(expenses)
        db.commit()

        print("Successfully seeded the database with mock data!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
