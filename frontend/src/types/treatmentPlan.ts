export type TreatmentStepStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type TreatmentStep = {
  step_id: string; // crypto.randomUUID()
  procedure_name: string;
  teeth_numbers: number[]; // e.g. [16, 17] or [] for full-arch/general
  cost: number;
  status: TreatmentStepStatus;
  notes?: string;
  completed_at?: string | null;
};

export type TreatmentPlanDetails = {
  title?: string; // e.g. "Full Mouth Rehabilitation" or "Tooth #46 RCT & Crown"
  notes?: string;
  steps: TreatmentStep[];
};

export type TreatmentPlanStatus = 'draft' | 'pending' | 'active' | 'completed';

export type TreatmentPlan = {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  status: TreatmentPlanStatus;
  details: TreatmentPlanDetails;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    name: string;
  } | null;
};