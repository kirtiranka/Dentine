// types/patient.ts

export type Gender = 'male' | 'female' | 'other' | 'undisclosed';

export interface MedicalAlert {
  id: string;
  type: 'allergy' | 'condition' | 'medication' | 'warning';
  description: string;
  severity: 'low' | 'medium' | 'high';
}


export interface PatientDetails {
  gender?: 'male' | 'female' | 'other';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  medicalAlerts?: MedicalAlert[];
  insurance?: {
    provider: string;
    policyNumber: string;
  };
  [key: string]: unknown;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string; // ISO format: 'YYYY-MM-DD'
  phoneNumber: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  details?: PatientDetails
}

// Form payload types (omit generated fields)
export type CreatePatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientInput = Partial<CreatePatientInput>;


// 4. Domain Type: Patient Summary (excluding the heavy JSONB column)
export type PatientSummary = Omit<Patient, 'patient_details'>;