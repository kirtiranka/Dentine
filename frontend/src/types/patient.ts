// types/patient.ts

export type Gender = 'male' | 'female' | 'other' | 'undisclosed';

export interface MedicalAlert {
  id: string;
  type: 'allergy' | 'condition' | 'medication' | 'warning';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO format: 'YYYY-MM-DD'
  phoneNumber: string;
  email?: string;
  gender?: Gender;
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
  insuranceProvider?: string;
  policyNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// Form payload types (omit generated fields)
export type CreatePatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientInput = Partial<CreatePatientInput>;