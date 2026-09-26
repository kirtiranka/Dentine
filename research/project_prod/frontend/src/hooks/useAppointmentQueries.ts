// Add to src/hooks/useMedicalQueries.ts
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { Appointment } from '../types/appointment';

export type MeetingInsert = Database['public']['Tables']['meetings']['Insert'];
export type MeetingRow = Database['public']['Tables']['meetings']['Row'];


export function toAppointment(row: MeetingRow & {patients:{name:string}, doctors:{name:string}}): Appointment {

  return {
    id: row.id,
    patientId: row.patient_id,
    dentistId: row.doctor_id,
    date: row.date,
    time: row.time,
    duration: row.duration,
    procedure: row.procedure || "",
    notes: row.notes || "",
    status: "scheduled",
    patientName: row.patients.name,
    dentistName:row.doctors.name,
  };
}

export function useAppointments() {
  return useQuery({
    queryKey: ['meetings', 'all'] as const,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, patients (name), doctors (name)');

      if (error) throw error;
      return (data ?? []).map(toAppointment);
    },
  });
}



export interface CreateAppointmentInput {
  patientId: string;
  dentistId: string;
  date: string;
  time: string;
  duration: number;
  procedure: string;
  notes?: string;
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const payload: MeetingInsert = {
        patient_id: input.patientId,
        doctor_id: input.dentistId,
        date: input.date,
        time: input.time,
        duration: input.duration,
        procedure: input.procedure,
        notes: input.notes ?? null,
      };

      const { data, error } = await supabase
        .from('meetings')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate appointment/meeting queries so calendars and lists refresh
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}