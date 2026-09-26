export interface PatientContact {
  phone?: string;
  email?: string;
}

export interface PatientInsurance {
  provider?: string;
  policy_number?: string;
}

export interface PatientDetails {
  address?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  contact?: PatientContact;
  insurance?: PatientInsurance | null;
  medical_alerts?: string[];
  [key: string]: unknown;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  details: PatientDetails;
  created_at: string;
  updated_at: string;
}