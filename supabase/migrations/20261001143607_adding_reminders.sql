-- ============================================================================
-- 1. REMINDER TABLE
-- ============================================================================
CREATE TABLE reminder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employee(id) ON DELETE SET NULL, -- creator / assignee
    asof_datetime TIMESTAMPTZ NOT NULL,                          -- Anchor event date/time
    remind_in_days INT NOT NULL DEFAULT 0,                       -- Day offset (+ / - to postpone/prepone)
    due_at TIMESTAMPTZ NOT NULL,                                 -- Populated automatically via trigger
    status TEXT NOT NULL DEFAULT 'active',                       -- 'active', 'inactive', 'disabled'
    type TEXT NOT NULL DEFAULT 'general',                        -- 'meeting', 'follow_up', 'lab_test', 'general'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Indexes for dashboard filtering and date ordering
CREATE INDEX idx_reminder_clinic_status_due ON reminder (clinic_id, status, due_at ASC);
CREATE INDEX idx_reminder_type ON reminder (clinic_id, type);
CREATE INDEX idx_reminder_entity_id ON reminder ((details->>'entity_id'));

CREATE OR REPLACE FUNCTION trg_calculate_reminder_due_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically compute due_at whenever asof_datetime or remind_in_days is set/updated
    NEW.due_at := NEW.asof_datetime + (NEW.remind_in_days * INTERVAL '1 day');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_reminder_due_at ON reminder;
CREATE TRIGGER trg_set_reminder_due_at
BEFORE INSERT OR UPDATE OF asof_datetime, remind_in_days ON reminder
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_reminder_due_at();

-- ============================================================================
-- 2. TRIGGER: Auto-create & Update Reminders on Appointments ('meeting')
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_sync_appointment_reminder()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_name TEXT;
    v_doctor_name TEXT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Fetch patient and doctor names for rich details
        SELECT name INTO v_patient_name FROM patient WHERE id = NEW.patient_id;
        IF NEW.doctor_id IS NOT NULL THEN
            SELECT name INTO v_doctor_name FROM employee WHERE id = NEW.doctor_id;
        END IF;

        INSERT INTO reminder (
            clinic_id,
            employee_id,
            asof_datetime,
            remind_in_days,
            status,
            type,
            details
        ) VALUES (
            NEW.clinic_id,
            NEW.doctor_id,
            NEW.start_time,
            0, -- Alerts on the day of the meeting by default
            'active',
            'meeting',
            jsonb_build_object(
                'entity_id', NEW.id,
                'patient_id', NEW.patient_id,
                'patient_name', COALESCE(v_patient_name, 'Unknown Patient'),
                'doctor_name', v_doctor_name,
                'title', 'Upcoming Appointment (Chair ' || NEW.operatory_number || ')',
                'notes', COALESCE(NEW.notes, 'Consultation / Procedure scheduled')
            )
        );

    ELSIF (TG_OP = 'UPDATE') THEN
        -- If appointment date/time shifts, automatically re-anchor the reminder
        IF (OLD.start_time IS DISTINCT FROM NEW.start_time) THEN
            UPDATE reminder
            SET asof_datetime = NEW.start_time,
                updated_at = now()
            WHERE clinic_id = NEW.clinic_id
              AND type = 'meeting'
              AND details->>'entity_id' = NEW.id::text;
        END IF;

        -- If appointment completes or cancels, retire the reminder
        IF (NEW.status IN ('completed', 'cancelled', 'no_show') AND OLD.status <> NEW.status) THEN
            UPDATE reminder
            SET status = 'inactive',
                updated_at = now()
            WHERE clinic_id = NEW.clinic_id
              AND type = 'meeting'
              AND details->>'entity_id' = NEW.id::text;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointment_reminder ON appointment;
CREATE TRIGGER trg_appointment_reminder
AFTER INSERT OR UPDATE ON appointment
FOR EACH ROW EXECUTE FUNCTION trg_sync_appointment_reminder();

-- ============================================================================
-- 3. TRIGGER: Auto-create & Update Reminders on Lab Orders ('lab_test')
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_sync_lab_test_reminder()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_name TEXT;
    v_proc_name TEXT;
    v_lab_name TEXT;
    v_turnaround INT := 7;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT p.name INTO v_patient_name FROM patient p WHERE p.id = NEW.patient_id;
        
        SELECT lp.name, lp.estimated_turnaround_days, l.name
        INTO v_proc_name, v_turnaround, v_lab_name
        FROM lab_procedure lp
        JOIN lab l ON l.id = lp.lab_id
        WHERE lp.id = NEW.lab_procedure_id;

        INSERT INTO reminder (
            clinic_id,
            employee_id,
            asof_datetime,
            remind_in_days,
            status,
            type,
            details
        ) VALUES (
            NEW.clinic_id,
            NEW.doctor_id,
            (NEW.created_at + (COALESCE(v_turnaround, 7) || ' days')::interval),
            0,
            'active',
            'lab_test',
            jsonb_build_object(
                'entity_id', NEW.id,
                'patient_id', NEW.patient_id,
                'patient_name', COALESCE(v_patient_name, 'Patient'),
                'title', 'Lab Delivery Due: ' || COALESCE(v_proc_name, 'Prosthesis'),
                'lab_name', v_lab_name,
                'notes', 'Expected turnaround: ' || COALESCE(v_turnaround, 7) || ' days'
            )
        );

    ELSIF (TG_OP = 'UPDATE') THEN
        -- If the lab order completes or is cancelled, deactivate the reminder
        IF (NEW.status IN ('completed', 'cancelled') AND OLD.status <> NEW.status) THEN
            UPDATE reminder
            SET status = 'inactive',
                updated_at = now()
            WHERE clinic_id = NEW.clinic_id
              AND type = 'lab_test'
              AND details->>'entity_id' = NEW.id::text;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lab_test_reminder ON lab_test;
CREATE TRIGGER trg_lab_test_reminder
AFTER INSERT OR UPDATE ON lab_test
FOR EACH ROW EXECUTE FUNCTION trg_sync_lab_test_reminder();