export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType =
  | 'consultation'
  | 'procedure'
  | 'emergency'
  | 'follow_up';

export type Appointment = {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  operatory_number: number;
  start_time: string; // ISO UTC timestamp
  end_time: string;   // ISO UTC timestamp
  status: AppointmentStatus;
  type: AppointmentType;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    name: string;
    details?: {
      contact?: {
        phone?: string;
        email?: string;
      };
    };
  } | null;
  doctor?: {
    id: string;
    name: string;
  } | null;
};

export type CreateAppointmentInput = {
  clinic_id: string;
  patient_id: string;
  doctor_id?: string | null;
  operatory_number: number;
  start_time: string; // ISO UTC string
  end_time: string;   // ISO UTC string
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string | null;
};