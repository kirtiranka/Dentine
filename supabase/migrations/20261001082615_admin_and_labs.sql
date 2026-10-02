-- 1. Create Master Lab Directory
CREATE TABLE lab (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_clinic_id ON lab (clinic_id);

-- 2. Create Master Lab Procedures (Tests offered by each lab)
CREATE TABLE lab_procedure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES lab(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                                 -- e.g., 'Zirconia Crown CAD/CAM', 'Cast Partial Denture'
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estimated_turnaround_days INT NOT NULL DEFAULT 7,   -- Default 1 week (7 days)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_procedure_lab_id ON lab_procedure (lab_id);
CREATE INDEX idx_lab_procedure_clinic_id ON lab_procedure (clinic_id);

-- Wipe out all existing lab tests (and any referencing rows)
TRUNCATE TABLE lab_test CASCADE;

-- 3. Update lab_test to reference lab_procedure
ALTER TABLE lab_test
    DROP COLUMN IF EXISTS lab_name,
    DROP COLUMN IF EXISTS procedure,
    ADD COLUMN lab_procedure_id UUID NOT NULL REFERENCES lab_procedure(id) ON DELETE RESTRICT;

-- 4. Update the audit trigger for lab_test to resolve the procedure name from lab_procedure
CREATE OR REPLACE FUNCTION log_lab_test_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_proc_name TEXT;
    v_lab_name TEXT;
BEGIN
    SELECT lp.name, l.name INTO v_proc_name, v_lab_name
    FROM lab_procedure lp
    JOIN lab l ON l.id = lp.lab_id
    WHERE lp.id = NEW.lab_procedure_id;

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
                'procedure', v_proc_name,
                'lab_name', v_lab_name,
                'lab_procedure_id', NEW.lab_procedure_id,
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
                'procedure', v_proc_name,
                'lab_name', v_lab_name,
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
                'procedure', v_proc_name,
                'lab_name', v_lab_name,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;