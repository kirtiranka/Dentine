export type VisitNoteVitals = {
  blood_pressure?: string; // e.g., "120/80"
  pulse_bpm?: number;
  temperature_c?: number;
};

export type VisitNoteDetails = {
  chief_complaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  vitals?: VisitNoteVitals;
};

export type VisitNote = {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  details: VisitNoteDetails;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    name: string;
  } | null;
};