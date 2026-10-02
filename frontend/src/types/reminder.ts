export type ReminderStatus = 'active' | 'inactive' | 'disabled';

export type ReminderType = 'meeting' | 'follow_up' | 'lab_test' | 'general';

export type ReminderDetails = {
  title?: string;
  notes?: string;
  entity_id?: string;
  patient_id?: string;
  patient_name?: string;
  doctor_name?: string;
  lab_name?: string;
  [key: string]: unknown;
};

export type Reminder = {
  id: string;
  clinic_id: string;
  employee_id: string | null;
  asof_datetime: string;
  remind_in_days: number;
  due_at: string;
  status: ReminderStatus;
  type: ReminderType;
  details: ReminderDetails;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
  } | null;
};

export type CreateReminderInput = {
  clinic_id: string;
  employee_id?: string | null;
  asof_datetime: string;
  remind_in_days?: number;
  type: ReminderType;
  status?: ReminderStatus;
  details: ReminderDetails;
};

export type UpdateReminderInput = {
  id: string;
  remind_in_days?: number;
  status?: ReminderStatus;
  details?: ReminderDetails;
};