// types/view-state.ts
import type { AppointmentStatus } from "./appointment";

export type ActiveTab = 'finder' | 'patient-view' | 'calendar';

export interface CalendarFilter {
  selectedDentistId?: string;
  selectedOperatory?: number;
  statusFilter?: AppointmentStatus[];
}

export interface PatientSearchParams {
  query: string; // matches name or phone
  page: number;
  limit: number;
}