export type ActionLogEntityType =
  | 'visit_note'
  | 'prescription'
  | 'lab_test'
  | 'treatment_plan'
  | 'document';

export type ActionLogType = 'CREATED' | 'UPDATED' | 'STATUS_CHANGE';

export type ActionLog = {
  id: string;
  clinic_id: string;
  patient_id: string;
  actor_id: string | null;
  entity_type: ActionLogEntityType;
  entity_id: string;
  action: ActionLogType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, any>;
  created_at: string;
  actor?: {
    id: string;
    name: string;
  } | null;
};