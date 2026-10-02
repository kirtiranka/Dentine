export type EmployeeType = 'owner' | 'partner' | 'employee';
export type EmployeeRole = 'doctor' | 'receptionist' | 'visiting_doctor';

export type EmployeeDetails = {
  address?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
};

export type Employee = {
  id: string;
  clinic_id: string;
  user_id: string | null;
  name: string;
  details: EmployeeDetails;
  type: EmployeeType;
  role: EmployeeRole;
  created_at: string;
  updated_at: string;
};

export type Procedure = {
  id: string;
  clinic_id: string;
  name: string;
  type: string | null; // e.g. 'Preventive', 'Endodontics', 'Orthodontics', 'Surgery'
  cost: number;
  created_at: string;
  updated_at: string;
};

export type Lab = {
  id: string;
  clinic_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  procedures?: LabProcedure[];
};

export type LabProcedure = {
  id: string;
  clinic_id: string;
  lab_id: string;
  name: string;
  cost: number;
  estimated_turnaround_days: number;
  created_at: string;
  updated_at: string;
  lab?: Lab;
};