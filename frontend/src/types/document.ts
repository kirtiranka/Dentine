export type DocumentType = 'xray' | 'lab_report' | 'prescription_scan' | 'consent_form' | 'other';

export type PatientDocument = {
  id: string;
  clinic_id: string;
  patient_id: string;
  name: string;
  type: DocumentType;
  storage_path: string;
  created_at: string;
  updated_at: string;
};