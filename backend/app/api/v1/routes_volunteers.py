from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...models import models
from ...schemas import schemas

router = APIRouter(prefix="/api/v1/volunteers", tags=["volunteers"])

@router.get("/", response_model=List[schemas.VolunteerProfileResponse])
def get_volunteers(region_id: Optional[int] = None, skill: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.VolunteerProfile)
    
    if region_id:
        query = query.join(models.User).filter(models.User.region_id == region_id)
        
    if skill:
        query = query.join(models.VolunteerSkill).filter(models.VolunteerSkill.skill_name.ilike(f"%{skill}%"))
        
    return query.all()

@router.post("/")
def create_volunteer(data: schemas.VolunteerCreateNew, db: Session = Depends(get_db)):
    # 1. Create User
    db_user = models.User(
        full_name=data.full_name,
        email=data.email,
        role="volunteer",
        region_id=data.region_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # 2. Create Profile
    db_profile = models.VolunteerProfile(
        user_id=db_user.user_id,
        availability="available"
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    # 3. Create Skill
    db_skill = models.VolunteerSkill(
        volunteer_id=db_profile.profile_id,
        skill_name=data.skill_name,
        proficiency="intermediate"
    )
    db.add(db_skill)
    db.commit()
    
    return {"message": "Volunteer created successfully"}

@router.post("/match")
def match_volunteers(program_id: int, required_skills: List[str], region_id: int, db: Session = Depends(get_db)):
    target_program = db.query(models.Program).filter(models.Program.program_id == program_id).first()
    if not target_program:
        return []

    volunteers = db.query(models.VolunteerProfile).join(models.User).filter(
        models.User.region_id == region_id
    ).all()
    
    ranked = []
    for v in volunteers:
        # Check Overlap (DSS business rule)
        overlapping = db.query(models.ProgramVolunteer).filter(
            models.ProgramVolunteer.volunteer_id == v.profile_id,
            models.ProgramVolunteer.status == "active",
            models.ProgramVolunteer.start_date <= target_program.end_date if target_program.end_date else True,
            models.ProgramVolunteer.end_date >= target_program.start_date if target_program.start_date else True
        ).first()

        if overlapping:
            continue # Skip double-assignment

        v_skills = db.query(models.VolunteerSkill).filter(models.VolunteerSkill.volunteer_id == v.profile_id).all()
        v_skill_names = [s.skill_name.lower() for s in v_skills]
        
        match_count = sum(1 for req in required_skills if req.lower() in v_skill_names)
        if match_count > 0:
            user = db.query(models.User).filter(models.User.user_id == v.user_id).first()
            ranked.append({
                "profile_id": v.profile_id,
                "name": user.full_name if user else "Unknown",
                "matchScore": match_count,
                "skills": [s.skill_name for s in v_skills]
            })
            
    ranked.sort(key=lambda x: x["matchScore"], reverse=True)
    return ranked

@router.post("/assign", response_model=schemas.ProgramVolunteerResponse)
def assign_volunteer(assignment: schemas.ProgramVolunteerCreate, db: Session = Depends(get_db)):
    db_assignment = models.ProgramVolunteer(**assignment.model_dump())
    db.add(db_assignment)
    
    profile = db.query(models.VolunteerProfile).filter(models.VolunteerProfile.profile_id == assignment.volunteer_id).first()
    if profile:
        profile.availability = "assigned"
        
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/{profile_id}")
def delete_volunteer(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.VolunteerProfile).filter(models.VolunteerProfile.profile_id == profile_id).first()
    if not profile:
        return {"error": "Not found"}
        
    user_id = profile.user_id
    
    # Delete skills and assignments
    db.query(models.VolunteerSkill).filter(models.VolunteerSkill.volunteer_id == profile_id).delete()
    db.query(models.ProgramVolunteer).filter(models.ProgramVolunteer.volunteer_id == profile_id).delete()
    
    # Delete profile and user
    db.delete(profile)
    db.query(models.User).filter(models.User.user_id == user_id).delete()
    
    db.commit()
    return {"message": "Deleted successfully"}
