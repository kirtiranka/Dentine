export type LabTestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type LabTest = {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  lab_name: string | null;
  procedure: string;
  status: LabTestStatus;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    name: string;
  } | null;
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
};