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
  startTime: string; // ISO 8601: '2026-08-24T09:00:00.000Z'
  endTime: string;   // ISO 8601: '2026-08-24T09:45:00.000Z'
  status: AppointmentStatus;
  treatmentType: TreatmentType;
  operatoryNumber?: number; // Dental chair / room #
  notes?: string;
}

export type CreateAppointmentInput = Omit<Appointment, 'id'>;
export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;