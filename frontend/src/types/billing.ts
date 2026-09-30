export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'insurance';

export type InvoiceItem = {
  step_id: string; // references TreatmentStep.step_id
  description: string;
  amount: number;
  discount?: number;
};

export type InvoiceDetails = {
  items: InvoiceItem[];
  notes?: string;
};

export type Invoice = {
  id: string;
  clinic_id: string;
  patient_id: string;
  status: InvoiceStatus;
  total_amount: number;
  details: InvoiceDetails;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  clinic_id: string;
  patient_id: string;
  invoice_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  transaction_ref: string | null;
  created_at: string;
  updated_at: string;
};

export type CompletedProcedure = {
  step_id: string;
  plan_id: string;
  plan_title: string;
  procedure_name: string;
  teeth_numbers: number[];
  cost: number;
  completed_at?: string | null;
  isInvoiced: boolean;
};