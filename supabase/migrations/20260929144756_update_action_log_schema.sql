-- 1. Drop existing action_log table and any dependent objects
DROP TABLE IF EXISTS action_log CASCADE;

-- 2. Create the redesigned action_log table (without summary)
CREATE TABLE action_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL, -- 'visit_note', 'prescription', 'lab_test', 'treatment_plan', 'document'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,      -- 'CREATED', 'UPDATED', 'STATUS_CHANGE'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for fast timeline filtering
CREATE INDEX idx_action_log_patient_timeline 
ON action_log (patient_id, created_at DESC);

CREATE INDEX idx_action_log_clinic_id 
ON action_log (clinic_id);

-- ========================================================
-- 4. TRIGGER FUNCTIONS
-- ========================================================

-- Lab Test Logger
CREATE OR REPLACE FUNCTION log_lab_test_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'lab_test',
            NEW.id,
            'CREATED',
            jsonb_build_object(
                'procedure', NEW.procedure,
                'lab_name', NEW.lab_name,
                'status', NEW.status
            )
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'lab_test',
            NEW.id,
            'STATUS_CHANGE',
            jsonb_build_object(
                'procedure', NEW.procedure,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'lab_test',
            NEW.id,
            'UPDATED',
            jsonb_build_object(
                'procedure', NEW.procedure,
                'lab_name', NEW.lab_name,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Prescription Logger
CREATE OR REPLACE FUNCTION log_prescription_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'prescription',
            NEW.id,
            'CREATED',
            NEW.details
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'prescription',
            NEW.id,
            'UPDATED',
            NEW.details
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Visit Note Logger
CREATE OR REPLACE FUNCTION log_visit_note_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'visit_note',
            NEW.id,
            'CREATED',
            NEW.details
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'visit_note',
            NEW.id,
            'UPDATED',
            NEW.details
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Treatment Plan Logger
CREATE OR REPLACE FUNCTION log_treatment_plan_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'treatment_plan',
            NEW.id,
            'CREATED',
            jsonb_build_object(
                'status', NEW.status,
                'details', NEW.details
            )
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'treatment_plan',
            NEW.id,
            'STATUS_CHANGE',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'details', NEW.details
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NEW.doctor_id,
            'treatment_plan',
            NEW.id,
            'UPDATED',
            jsonb_build_object(
                'status', NEW.status,
                'details', NEW.details
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- Document Activity Logger
-- ========================================================

CREATE OR REPLACE FUNCTION log_document_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NULL, -- The document table schema does not track employee/doctor ID; set to NULL
            'document',
            NEW.id,
            'CREATED',
            jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type,
                'storage_path', NEW.storage_path
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO action_log (clinic_id, patient_id, actor_id, entity_type, entity_id, action, details)
        VALUES (
            NEW.clinic_id,
            NEW.patient_id,
            NULL,
            'document',
            NEW.id,
            'UPDATED',
            jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type,
                'old_name', OLD.name,
                'old_type', OLD.type
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- ========================================================
-- 5. BIND TRIGGERS TO TABLES
-- ========================================================

DROP TRIGGER IF EXISTS trg_log_lab_test ON lab_test;
CREATE TRIGGER trg_log_lab_test
AFTER INSERT OR UPDATE ON lab_test
FOR EACH ROW EXECUTE FUNCTION log_lab_test_activity();

DROP TRIGGER IF EXISTS trg_log_prescription ON prescription;
CREATE TRIGGER trg_log_prescription
AFTER INSERT OR UPDATE ON prescription
FOR EACH ROW EXECUTE FUNCTION log_prescription_activity();

DROP TRIGGER IF EXISTS trg_log_visit_note ON visit_note;
CREATE TRIGGER trg_log_visit_note
AFTER INSERT OR UPDATE ON visit_note
FOR EACH ROW EXECUTE FUNCTION log_visit_note_activity();

DROP TRIGGER IF EXISTS trg_log_treatment_plan ON treatment_plan;
CREATE TRIGGER trg_log_treatment_plan
AFTER INSERT OR UPDATE ON treatment_plan
FOR EACH ROW EXECUTE FUNCTION log_treatment_plan_activity();

DROP TRIGGER IF EXISTS trg_log_document ON document;
CREATE TRIGGER trg_log_document
AFTER INSERT OR UPDATE ON document
FOR EACH ROW EXECUTE FUNCTION log_document_activity();