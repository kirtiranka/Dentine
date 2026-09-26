// types/appointment.ts

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked-in'
  | 'in-chair'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type TreatmentType =
  | 'cleaning'
  | 'consultation'
  | 'extraction'
  | 'root-canal'
  | 'filling'
  | 'crown'
  | 'orthodontics'
  | 'emergency';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string; // Denormalized for fast calendar rendering
  dentistId: string;
  dentistName: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  procedure: string;
  notes?: string;
}

export type CreateAppointmentInput = Omit<Appointment, 'id'>;
export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;