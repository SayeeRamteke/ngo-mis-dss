from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
import csv
import io
from ...core.database import get_db
from ...models import models

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])

@router.post("/resources")
async def upload_resources(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    count = 0
    for row in reader:
        db_resource = db.query(models.Resource).filter(models.Resource.resource_name == row.get('name')).first()
        if not db_resource:
            db_resource = models.Resource(
                resource_name=row.get('name'),
                category=row.get('category'),
                resource_type=row.get('type'), # Assuming maps to ResourceTypeEnum string
                unit_of_measure=row.get('unit')
            )
            db.add(db_resource)
            count += 1
            
    db.commit()
    return {"imported": count}

@router.post("/volunteers")
async def upload_volunteers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    count = 0
    for row in reader:
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == row.get('email')).first()
        if not user:
            user = models.User(
                full_name=row.get('name'),
                email=row.get('email'),
                role="volunteer",
                region_id=int(row.get('regionId')) if row.get('regionId') else None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Create volunteer profile
        profile = db.query(models.VolunteerProfile).filter(models.VolunteerProfile.user_id == user.user_id).first()
        if not profile:
            profile = models.VolunteerProfile(
                user_id=user.user_id,
                availability="available"
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            count += 1
            
        # Parse and create skills
        skills_raw = row.get('skills', '')
        if skills_raw:
            skill_list = [s.strip() for s in skills_raw.split(',') if s.strip()]
            for skill_name in skill_list:
                existing = db.query(models.VolunteerSkill).filter(
                    models.VolunteerSkill.volunteer_id == profile.profile_id,
                    models.VolunteerSkill.skill_name == skill_name
                ).first()
                if not existing:
                    new_skill = models.VolunteerSkill(
                        volunteer_id=profile.profile_id,
                        skill_name=skill_name,
                        proficiency="intermediate"
                    )
                    db.add(new_skill)
            
    db.commit()
    return {"imported": count}
