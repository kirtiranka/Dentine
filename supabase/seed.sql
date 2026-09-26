-- Reset data for clean execution
TRUNCATE TABLE clinic CASCADE;

-- ==========================================
-- 1. CLINIC
-- ==========================================
INSERT INTO clinic (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Apex Dental & Polyclinic');

-- ==========================================
-- 2. EMPLOYEES
-- ==========================================
INSERT INTO employee (id, clinic_id, name, type, role, details)
VALUES 
  (
    '22222222-2222-2222-2222-222222222221', 
    '11111111-1111-1111-1111-111111111111', 
    'Dr. Sarah Connor', 
    'owner', 
    'doctor',
    '{
      "address": "B-401, Koregaon Park, Pune",
      "contact": {
        "phone": "+91 98230 11111",
        "email": "sarah@apexclinic.com"
      },
      "specialization": "Endodontics",
      "license_number": "D-48291"
    }'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222', 
    '11111111-1111-1111-1111-111111111111', 
    'Dr. Rahul Joshi', 
    'employee', 
    'visiting_doctor',
    '{
      "address": "Baner Road, Pune",
      "contact": {
        "phone": "+91 98230 22222",
        "email": "rahul@apexclinic.com"
      },
      "specialization": "Orthodontics",
      "license_number": "D-33012"
    }'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222223', 
    '11111111-1111-1111-1111-111111111111', 
    'Anita Deshmukh', 
    'employee', 
    'receptionist',
    '{
      "address": "Kothrud, Pune",
      "contact": {
        "phone": "+91 98230 33333",
        "email": "reception@apexclinic.com"
      },
      "shift": "morning"
    }'::jsonb
  );

-- ==========================================
-- 3. PROCEDURES
-- ==========================================
INSERT INTO procedure (id, clinic_id, name, type, cost)
VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Routine Dental Cleaning', 'Preventive', 1500.00),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Root Canal Treatment (Molar)', 'Endodontics', 5500.00),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Composite Resin Filling', 'Restorative', 2000.00),
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Zirconia Crown', 'Prosthodontics', 9000.00);

-- ==========================================
-- 4. PATIENTS
-- ==========================================
INSERT INTO patient (id, clinic_id, name, details)
VALUES
  (
    '44444444-4444-4444-4444-444444444441', 
    '11111111-1111-1111-1111-111111111111', 
    'Amit Patel', 
    '{
      "address": "Flat 402, Green Acres, Pune",
      "gender": "male",
      "age": 34,
      "contact": {
        "phone": "+91 99112 33445",
        "email": "amit.patel@example.com"
      },
      "insurance": {
        "provider": "Star Health",
        "policy_number": "SH-9281928"
      },
      "medical_alerts": ["penicillin_allergy", "mild_hypertension"]
    }'::jsonb
  ),
  (
    '44444444-4444-4444-4444-444444444442', 
    '11111111-1111-1111-1111-111111111111', 
    'Priya Sharma', 
    '{
      "address": "Bungalow 12, Kalyani Nagar, Pune",
      "gender": "female",
      "age": 28,
      "contact": {
        "phone": "+91 98877 66554",
        "email": "priya.s@example.com"
      },
      "insurance": null,
      "medical_alerts": []
    }'::jsonb
  );

-- ==========================================
-- 5. APPOINTMENTS
-- ==========================================
INSERT INTO appointment (id, clinic_id, organizer_id, start_datetime, duration_minutes, status, details)
VALUES
  (
    '55555555-5555-5555-5555-555555555551', 
    '11111111-1111-1111-1111-111111111111', 
    '22222222-2222-2222-2222-222222222221', 
    now() - INTERVAL '3 hours', 
    45, 
    'completed', 
    '{
      "type": "patient_visit",
      "patient_id": "44444444-4444-4444-4444-444444444441",
      "patient_name": "Amit Patel",
      "reason": "Severe lower molar ache"
    }'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555552', 
    '11111111-1111-1111-1111-111111111111', 
    '22222222-2222-2222-2222-222222222221', 
    now() + INTERVAL '1 day' + INTERVAL '2 hours', 
    30, 
    'scheduled', 
    '{
      "type": "patient_visit",
      "patient_id": "44444444-4444-4444-4444-444444444442",
      "patient_name": "Priya Sharma",
      "reason": "Routine scaling and polish"
    }'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555553', 
    '11111111-1111-1111-1111-111111111111', 
    '22222222-2222-2222-2222-222222222221', 
    now() + INTERVAL '2 days', 
    60, 
    'scheduled', 
    '{
      "type": "clinic_meeting",
      "title": "Quarterly Operations & Case Review",
      "participants": [
        "22222222-2222-2222-2222-222222222221", 
        "22222222-2222-2222-2222-222222222222"
      ]
    }'::jsonb
  );

-- ==========================================
-- 6. VISIT NOTE (SOAP)
-- ==========================================
INSERT INTO visit_note (id, clinic_id, patient_id, doctor_id, details)
VALUES
  (
    '66666666-6666-6666-6666-666666666661', 
    '11111111-1111-1111-1111-111111111111', 
    '44444444-4444-4444-4444-444444444441', 
    '22222222-2222-2222-2222-222222222221', 
    '{
      "subjective": "Patient presents with intense throbbing pain in lower right posterior quadrant for 3 days. Pain lingers with cold fluids.",
      "objective": "Tooth #46 shows deep disto-occlusal caries. Positive response to vertical percussion. Cold test lingering > 10 seconds.",
      "assessment": "Symptomatic Irreversible Pulpitis on #46 with Symptomatic Apical Periodontitis.",
      "plan": "Performed emergency pulpectomy on #46 today. Scheduled completion of Root Canal Treatment next week followed by Zirconia Crown."
    }'::jsonb
  );

-- ==========================================
-- 7. TREATMENT PLAN
-- ==========================================
INSERT INTO treatment_plan (id, clinic_id, patient_id, doctor_id, status, details)
VALUES
  (
    '77777777-7777-7777-7777-777777777771', 
    '11111111-1111-1111-1111-111111111111', 
    '44444444-4444-4444-4444-444444444441', 
    '22222222-2222-2222-2222-222222222221', 
    'active', 
    '{
      "steps": [
        {
          "step_id": "a1b2c3d4-0001-0000-0000-000000000001",
          "procedure_name": "Root Canal Treatment (Molar)",
          "teeth_numbers": [46],
          "cost": 5500.00,
          "status": "completed",
          "completed_at": "2026-09-24T10:30:00Z"
        },
        {
          "step_id": "a1b2c3d4-0002-0000-0000-000000000002",
          "procedure_name": "Composite Resin Core Buildup",
          "teeth_numbers": [46],
          "cost": 2000.00,
          "status": "planned",
          "completed_at": null
        },
        {
          "step_id": "a1b2c3d4-0003-0000-0000-000000000003",
          "procedure_name": "Zirconia Crown",
          "teeth_numbers": [46],
          "cost": 9000.00,
          "status": "planned",
          "completed_at": null
        }
      ]
    }'::jsonb
  );

-- ==========================================
-- 8. PRESCRIPTION
-- ==========================================
INSERT INTO prescription (id, clinic_id, patient_id, doctor_id, details)
VALUES
  (
    '88888888-8888-8888-8888-888888888881', 
    '11111111-1111-1111-1111-111111111111', 
    '44444444-4444-4444-4444-444444444441', 
    '22222222-2222-2222-2222-222222222221', 
    '{
      "prescriptions": [
        {
          "id": "b1b2c3d4-0001-0000-0000-000000000001",
          "name": "Ibuprofen 400mg + Paracetamol 325mg",
          "dosage": "1 tablet",
          "frequency": "TID (Every 8 hours)",
          "duration_days": 3,
          "instructions": "Take after meals. Discontinue if pain subsides."
        },
        {
          "id": "b1b2c3d4-0002-0000-0000-000000000002",
          "name": "Chlorhexidine 0.2% Antiseptic Mouthwash",
          "dosage": "10 ml",
          "frequency": "BID (Morning & Night)",
          "duration_days": 5,
          "instructions": "Rinse vigorously for 30 seconds after brushing. Do not swallow."
        }
      ]
    }'::jsonb
  );

-- ==========================================
-- 9. LAB TEST
-- ==========================================
INSERT INTO lab_test (id, clinic_id, patient_id, doctor_id, lab_name, procedure, status)
VALUES
  (
    'aaaaaaaa-1111-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222221',
    'Apex Precision Dental Lab',
    'Zirconia Crown CAD/CAM Fabrication (#46)',
    'pending'
  );

-- ==========================================
-- 10. DOCUMENT
-- ==========================================
INSERT INTO document (id, clinic_id, patient_id, name, type, storage_path)
VALUES
  (
    'bbbbbbbb-1111-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    'Intraoral Periapical X-Ray (Tooth #46)',
    'xray',
    '11111111-1111-1111-1111-111111111111/44444444-4444-4444-4444-444444444441/iopa_tooth_46_preop.png'
  );

-- ==========================================
-- 11. FOLLOW UP
-- ==========================================
INSERT INTO follow_up (id, clinic_id, patient_id, type, status, num_days)
VALUES
  (
    'cccccccc-1111-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    'once',
    'active',
    7
  );

-- ==========================================
-- 12. INVOICE & PAYMENT
-- ==========================================
INSERT INTO invoice (id, clinic_id, patient_id, status, total_amount, details)
VALUES
  (
    '99999999-9999-9999-9999-999999999991', 
    '11111111-1111-1111-1111-111111111111', 
    '44444444-4444-4444-4444-444444444441', 
    'partially_paid', 
    5500.00, 
    '{
      "items": [
        {
          "step_id": "a1b2c3d4-0001-0000-0000-000000000001",
          "description": "Root Canal Treatment - Molar (#46)",
          "amount": 5500.00,
          "discount": 0.00
        }
      ]
    }'::jsonb
  );

INSERT INTO payment (id, clinic_id, patient_id, invoice_id, amount, payment_method, transaction_ref)
VALUES
  (
    'dddddddd-1111-0000-0000-000000000001', 
    '11111111-1111-1111-1111-111111111111', 
    '44444444-4444-4444-4444-444444444441', 
    '99999999-9999-9999-9999-999999999991', 
    3000.00, 
    'upi', 
    'UPI/20260924/491029481'
  );

-- ==========================================
-- 13. ACTION LOG
-- ==========================================
INSERT INTO action_log (id, clinic_id, action_type, asof_time, action_payload)
VALUES
  (
    'eeeeeeee-1111-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'create_appointment',
    now() - INTERVAL '3 hours',
    '{
      "organizer_id": "22222222-2222-2222-2222-222222222221",
      "patient_id": "44444444-4444-4444-4444-444444444441",
      "scheduled_time": "2026-09-24T10:00:00Z"
    }'::jsonb
  );