import sqlite3

def run():
    conn = sqlite3.connect('ngomis.db')
    cursor = conn.cursor()
    columns = [
        "beneficiary_type VARCHAR DEFAULT 'individual'",
        "priority_score FLOAT DEFAULT 0.0",
        "priority_last_calculated_at DATETIME",
        "last_aid_date DATETIME",
        "date_of_birth DATE",
        "earning_members INTEGER DEFAULT 0",
        "health_status VARCHAR DEFAULT 'healthy'",
        "vulnerability_type VARCHAR",
        "organization_type VARCHAR",
        "registration_number VARCHAR",
        "capacity INTEGER",
        "current_occupancy INTEGER",
        "population_served INTEGER",
        "funding_level VARCHAR",
        "service_type VARCHAR"
    ]
    for col in columns:
        try:
            cursor.execute(f"ALTER TABLE beneficiaries ADD COLUMN {col};")
        except sqlite3.OperationalError as e:
            print(f"Skipping {col}: {e}")
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == '__main__':
    run()
