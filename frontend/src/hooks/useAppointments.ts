import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
} from '../types/appointment';

export function useAppointments(startDateIso: string, endDateIso: string) {
  return useQuery({
    queryKey: ['appointments', startDateIso, endDateIso],
    queryFn: async (): Promise<Appointment[]> => {
      // Find all overlapping appointments within the calendar window
      const { data, error } = await supabase
        .from('appointment')
        .select(`
          *,
          patient:patient (
            id,
            name,
            details
          ),
          doctor:employee (
            id,
            name
          )
        `)
        .lt('start_time', endDateIso)
        .gt('end_time', startDateIso)
        .order('start_time', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as Appointment[]) || [];
    },
    enabled: Boolean(startDateIso && endDateIso),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const { data, error } = await supabase
        .from('appointment')
        .insert({
          clinic_id: input.clinic_id,
          patient_id: input.patient_id,
          doctor_id: input.doctor_id || null,
          operatory_number: input.operatory_number,
          start_time: input.start_time,
          end_time: input.end_time,
          status: input.status,
          type: input.type,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentStatus;
    }) => {
      const { data, error } = await supabase
        .from('appointment')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}