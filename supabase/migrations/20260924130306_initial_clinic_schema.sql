-- Enable UUID extension (enabled by default on Supabase, included for safety)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. CORE TENANCY & USERS
-- ==========================================

CREATE TABLE clinic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    -- Nullable for now. When Google Auth is linked, populate with auth.users.id
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    -- JSON structure: { "address": "...", "contact": {"phone": ..., "email": ...}}
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    type TEXT NOT NULL DEFAULT 'employee', -- 'owner', 'partner', 'employee'
    role TEXT NOT NULL DEFAULT 'doctor',   -- 'doctor', 'receptionist', 'visiting_doctor'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. PATIENTS & CLINICAL DATA
-- ==========================================

CREATE TABLE patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    -- JSON structure: { "address": "...", "contact": {"phone": ..., "email": ...}, "insurance": {...}, "medical_alerts": ["penicillin_allergy", "diabetes"] }
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE visit_note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    -- JSON structure for SOAP: { "subjective": "...", "objective": "...", "assessment": "...", "plan": "..." }
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE procedure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT, -- e.g., 'Extractions', 'Orthodontics', 'Periodontics'
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE treatment_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending', 'active', 'completed'
    -- JSON structure: { "steps": [ { "step_id": "uuid", "procedure_name": "...", "teeth_numbers": [16], "cost": 4500, "status": "completed" } ] }
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prescription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    -- JSON structure: {"prescriptions" : [ { "id": "uuid", "name": "Amoxicillin", "dosage": "500mg", "frequency": "1-0-1", "duration_days": 5, "instructions": "After food" } ]}
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lab_test (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    lab_name TEXT, 
    procedure TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT, -- 'xray', 'lab_report', 'prescription_scan', 'consent_form'
    storage_path TEXT NOT NULL, -- Path inside Supabase Storage bucket
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. SCHEDULING & WORKFLOW
-- ==========================================

CREATE TABLE appointment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
    -- JSON structure: { "type": "patient_visit" | "clinic_meeting", "patient_id": "...", "participants": ["..."] }
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE follow_up (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'once', -- 'once', 'recurring'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'disabled'
    num_days INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 4. BILLING & AUDIT LOGS
-- ==========================================

CREATE TABLE invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid', 'cancelled'
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    -- JSON structure: { "items": [ { "step_id": "uuid", "description": "Root Canal", "amount": 4500, "discount": 500 } ] }
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    -- Nullable: link to an invoice when settling a specific bill, or leave NULL for advance payments
    invoice_id UUID REFERENCES invoice(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'cash', 'card', 'upi', 'insurance'
    transaction_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE action_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    asof_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 5. PERFORMANCE & RLS-READINESS INDEXES
-- ==========================================

-- Clinic-level tenant indexes
CREATE INDEX idx_employee_clinic ON employee(clinic_id);
CREATE INDEX idx_employee_user ON employee(user_id);
CREATE INDEX idx_patient_clinic ON patient(clinic_id);
CREATE INDEX idx_visit_note_clinic ON visit_note(clinic_id);
CREATE INDEX idx_appointment_clinic ON appointment(clinic_id);
CREATE INDEX idx_treatment_plan_clinic ON treatment_plan(clinic_id);
CREATE INDEX idx_prescription_clinic ON prescription(clinic_id);
CREATE INDEX idx_lab_test_clinic ON lab_test(clinic_id);
CREATE INDEX idx_document_clinic ON document(clinic_id);
CREATE INDEX idx_invoice_clinic ON invoice(clinic_id);
CREATE INDEX idx_payment_clinic ON payment(clinic_id);
CREATE INDEX idx_follow_up_clinic ON follow_up(clinic_id);
CREATE INDEX idx_action_log_clinic ON action_log(clinic_id);

-- Common relational lookup indexes
-- CREATE INDEX idx_visit_note_patient ON visit_note(patient_id);
-- CREATE INDEX idx_document_patient ON document(patient_id);
-- CREATE INDEX idx_invoice_patient ON invoice(patient_id);
-- CREATE INDEX idx_payment_invoice ON payment(invoice_id);