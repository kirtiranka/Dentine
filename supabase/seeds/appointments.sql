-- Clean up existing seed appointments if re-running
DELETE FROM appointment 
WHERE clinic_id = '11111111-1111-1111-1111-111111111111'
  AND notes LIKE '[SEED]%';

-- Insert realistic appointments
INSERT INTO appointment (
    id,
    clinic_id,
    patient_id,
    doctor_id,
    operatory_number,
    start_time,
    end_time,
    status,
    type,
    notes
)
VALUES
-- ============================================================================
-- TODAY'S APPOINTMENTS
-- ============================================================================
-- 1. Completed morning consultation (Chair 1)
(
    'a0000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222221',
    1,
    (CURRENT_DATE + TIME '09:00:00') AT TIME ZONE 'UTC',
    (CURRENT_DATE + TIME '09:45:00') AT TIME ZONE 'UTC',
    'completed',
    'consultation',
    '[SEED] Routine check-up and scaling evaluation'
),

-- 2. Currently seated / in-progress procedure (Chair 2)
(
    'a0000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222221',
    2,
    (CURRENT_DATE + TIME '10:30:00') AT TIME ZONE 'UTC',
    (CURRENT_DATE + TIME '11:30:00') AT TIME ZONE 'UTC',
    'in_progress',
    'procedure',
    '[SEED] Tooth #46 Root Canal Stage 1'
),

-- 3. Checked-in patient waiting in reception (Chair 1)
(
    'a0000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222221',
    1,
    (CURRENT_DATE + TIME '11:45:00') AT TIME ZONE 'UTC',
    (CURRENT_DATE + TIME '12:30:00') AT TIME ZONE 'UTC',
    'checked_in',
    'follow_up',
    '[SEED] Suture removal post-extraction'
),

-- 4. Confirmed afternoon booking (Chair 1)
(
    'a0000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222221',
    1,
    (CURRENT_DATE + TIME '14:00:00') AT TIME ZONE 'UTC',
    (CURRENT_DATE + TIME '15:00:00') AT TIME ZONE 'UTC',
    'confirmed',
    'procedure',
    '[SEED] Crown cementation (#16)'
),

-- 5. Emergency afternoon walk-in slot (Chair 2)
(
    'a0000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222221',
    2,
    (CURRENT_DATE + TIME '16:00:00') AT TIME ZONE 'UTC',
    (CURRENT_DATE + TIME '16:30:00') AT TIME ZONE 'UTC',
    'scheduled',
    'emergency',
    '[SEED] Severe acute pain lower anterior'
),

-- ============================================================================
-- TOMORROW'S APPOINTMENTS (Previewing Future Slots)
-- ============================================================================
(
    'a0000000-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222221',
    1,
    ((CURRENT_DATE + INTERVAL '1 day') + TIME '10:00:00') AT TIME ZONE 'UTC',
    ((CURRENT_DATE + INTERVAL '1 day') + TIME '11:00:00') AT TIME ZONE 'UTC',
    'scheduled',
    'procedure',
    '[SEED] Composite restoration quadrant 2'
),

-- ============================================================================
-- YESTERDAY'S APPOINTMENT (Historical Audit)
-- ============================================================================
(
    'a0000000-0000-0000-0000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222221',
    1,
    ((CURRENT_DATE - INTERVAL '1 day') + TIME '11:00:00') AT TIME ZONE 'UTC',
    ((CURRENT_DATE - INTERVAL '1 day') + TIME '11:30:00') AT TIME ZONE 'UTC',
    'no_show',
    'consultation',
    '[SEED] Patient did not arrive; rescheduled'
)
ON CONFLICT (id) DO NOTHING;