import sys
import os
from datetime import datetime, timezone, timedelta
import random

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app.core.database import SessionLocal
from app.models import models

db = SessionLocal()

db.query(models.ResourceInventory).delete()
db.query(models.Resource).delete()
db.commit()

resources_data = [
    {"name": "Rice Bags (50kg)", "cat": "food", "type": "consumable", "uom": "bags", "min": 50, "max": 200},
    {"name": "Wheat Flour (10kg)", "cat": "food", "type": "consumable", "uom": "bags", "min": 100, "max": 500},
    {"name": "Lentils (Dal) 5kg", "cat": "food", "type": "consumable", "uom": "bags", "min": 50, "max": 150},
    {"name": "Cooking Oil (1L)", "cat": "food", "type": "consumable", "uom": "bottles", "min": 100, "max": 300},
    {"name": "Milk Powder (1kg)", "cat": "food", "type": "consumable", "uom": "packets", "min": 30, "max": 100},
    
    {"name": "Paracetamol 500mg", "cat": "medicine", "type": "consumable", "uom": "strips", "min": 200, "max": 1000},
    {"name": "Bandages & Gauze", "cat": "medicine", "type": "consumable", "uom": "boxes", "min": 50, "max": 200},
    {"name": "Antiseptic Liquid", "cat": "medicine", "type": "consumable", "uom": "bottles", "min": 30, "max": 100},
    {"name": "Water Purification Tabs", "cat": "medicine", "type": "consumable", "uom": "strips", "min": 500, "max": 2000},
    
    {"name": "Winter Blankets", "cat": "equipment", "type": "reusable", "uom": "pieces", "min": 100, "max": 500},
    {"name": "Tents (Family Size)", "cat": "equipment", "type": "reusable", "uom": "pieces", "min": 10, "max": 50},
    {"name": "Tarpaulins", "cat": "equipment", "type": "reusable", "uom": "pieces", "min": 50, "max": 200},
    {"name": "Solar Lanterns", "cat": "equipment", "type": "reusable", "uom": "pieces", "min": 20, "max": 100},
    
    {"name": "Hygiene Kits", "cat": "non-food", "type": "consumable", "uom": "kits", "min": 100, "max": 400},
    {"name": "School Kits", "cat": "education", "type": "consumable", "uom": "kits", "min": 50, "max": 150},
]

resource_objs = []
for rd in resources_data:
    res = models.Resource(
        resource_name=rd["name"],
        category=rd["cat"],
        resource_type=rd["type"],
        unit_of_measure=rd["uom"],
        minimum_threshold=rd["min"],
        maximum_threshold=rd["max"],
        unit_cost=random.randint(50, 500)
    )
    db.add(res)
    resource_objs.append(res)

db.commit()

today = datetime.now(timezone.utc).date()
for res in resource_objs:
    qty1 = random.randint(int(res.maximum_threshold * 0.9), int(res.maximum_threshold * 1.5))
    inv1 = models.ResourceInventory(
        resource_id=res.resource_id,
        region_id=1,
        quantity_available=qty1,
        expiry_date=today + timedelta(days=random.randint(100, 300)) if res.category in ["food", "medicine"] else None
    )
    db.add(inv1)
    
    qty2 = random.randint(int(res.minimum_threshold * 1.1), int(res.maximum_threshold * 0.8))
    exp_days = random.choice([5, 12, 25, 200]) if res.category in ["food", "medicine"] else None
    inv2 = models.ResourceInventory(
        resource_id=res.resource_id,
        region_id=2,
        quantity_available=qty2,
        expiry_date=today + timedelta(days=exp_days) if exp_days else None
    )
    db.add(inv2)
    
    max_short = int(res.minimum_threshold * 0.8)
    qty3 = random.randint(0, max_short) if max_short > 0 else 0
    inv3 = models.ResourceInventory(
        resource_id=res.resource_id,
        region_id=3,
        quantity_available=qty3,
        expiry_date=today + timedelta(days=random.randint(50, 200)) if res.category in ["food", "medicine"] else None
    )
    db.add(inv3)

db.commit()
print("Success")
