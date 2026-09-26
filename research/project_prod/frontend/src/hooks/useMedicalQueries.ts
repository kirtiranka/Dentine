// src/hooks/useMedicalQueries.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Patient, PatientSummary, PatientDetails } from '../types/patient';
// import type { Appointment } from '../types/appointment';
import type { Database, Json } from '../types/database.types';

export type PatientRow = Database['public']['Tables']['patients']['Row'];
export type PatientInsert = Database['public']['Tables']['patients']['Insert'];

export type DoctorRow = Database['public']['Tables']['doctors']['Row'];

type PatientSummaryRow = Omit<PatientRow, 'patient_details'>;

// --- Query Keys ---
export const medicalKeys = {
  patients: {
    all: ['patients'] as const,
    summaries: () => [...medicalKeys.patients.all, 'summaries'] as const,
    detail: (id: string) => [...medicalKeys.patients.all, 'detail', id] as const,
  },
  meetings: {
    all: ['meetings'] as const,
  },
};

function parsePatientDetails(json: Json): PatientDetails | undefined {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return undefined;
  }
  return json as PatientDetails;
}

/**
 * Maps client domain Patient input into a Supabase-compatible insert/update row.
 */
export function fromPatient(
  patient: Partial<Patient> & { name: string; dateOfBirth: string; phoneNumber: string }
): PatientInsert {
  return {
    ...(patient.id ? { id: patient.id } : {}),
    name: patient.name,
    dob: patient.dateOfBirth,
    phone_number: patient.phoneNumber,
    email: patient.email ?? "",
    patient_details: (patient.details as unknown as Json) ?? null,
  };
}

/**
 * Maps a database PatientRow to the full client domain Patient model.
 */
export function toPatient(row: PatientRow): Patient {
  const createdAtIso = row.created_at ?? new Date().toISOString();

  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.dob,
    phoneNumber: row.phone_number,
    email: row.email || undefined,
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
    details: parsePatientDetails(row.patient_details),
  };
}

/**
 * Maps a database PatientRow to PatientSummary (excluding details).
 */
export function toPatientSummary(row: PatientSummaryRow): PatientSummary {
  const createdAtIso = row.created_at ?? new Date().toISOString();

  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.dob,
    phoneNumber: row.phone_number,
    email: row.email || undefined,
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
  };
}

// --- 1. Select All Patients (Excluding JSONB) ---
export function usePatientsSummary() {
  return useQuery({
    queryKey: medicalKeys.patients.summaries(),
    queryFn: async (): Promise<PatientSummary[]> => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, email, dob, phone_number, created_at')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(toPatientSummary);
    },
  });
}

// --- 2. Select Patient by ID (All Columns) ---
export function usePatientById(id: string) {
  return useQuery({
    queryKey: medicalKeys.patients.detail(id),
    queryFn: async (): Promise<Patient> => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return toPatient(data);
    },
    enabled: Boolean(id),
  });
}

// Input type: requires core fields, id is optional (generated on insert if omitted)
export type SavePatientInput = Partial<Patient> & {
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
};

// --- 3. Add or Update Patient ---
export function useSavePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavePatientInput): Promise<Patient> => {
      const payload = fromPatient(input);

      // Uses Supabase upsert: updates matching row if `id` exists, inserts if not
      const { data, error } = await supabase
        .from('patients')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return toPatient(data);
    },
    onSuccess: (savedPatient) => {
      // Invalidate the summary list so directories update automatically
      queryClient.invalidateQueries({
        queryKey: medicalKeys.patients.summaries(),
      });

      // Update and invalidate the specific patient's detail cache
      queryClient.setQueryData(
        medicalKeys.patients.detail(savedPatient.id),
        savedPatient
      );
      queryClient.invalidateQueries({
        queryKey: medicalKeys.patients.detail(savedPatient.id),
      });
    },
  });
}


export function useDoctors() {
  return useQuery({
    queryKey: ['doctors', 'all'] as const,
    queryFn: async (): Promise<DoctorRow[]> => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60, // Doctors rarely change; cache 1 hr
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;
      return patientId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: medicalKeys.patients.summaries() });
      queryClient.removeQueries({ queryKey: medicalKeys.patients.detail(deletedId) });
    },
  });
}