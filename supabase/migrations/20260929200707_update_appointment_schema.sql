-- 1. Drop existing action_log table and any dependent objects
DROP TABLE IF EXISTS appointment CASCADE;

CREATE TABLE appointment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    operatory_number INT NOT NULL DEFAULT 1,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'
    type TEXT NOT NULL DEFAULT 'consultation', -- 'consultation', 'procedure', 'emergency', 'follow_up'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for date-range calendar queries
CREATE INDEX idx_appointment_clinic_time 
ON appointment (clinic_id, start_time, end_time);