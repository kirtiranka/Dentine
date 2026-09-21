export type Gender = 'male' | 'female' | 'transgender' | 'declined';

export interface Visit {
  id: string;
  patientName: string;
  patientGender: Gender;
  dob: string;
  complaint: string;
  treatmentPlan: string;
  visitDate: string;
}

export type FormFieldType = 'text_input' | 'select' | 'textarea' | 'date';

export interface FormFieldSchema {
  id: string;
  type: FormFieldType;
  purpose: string;
  options?: string[];
  current_value: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionsExecuted?: string[];
}