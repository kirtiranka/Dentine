import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Prescription, PrescriptionDetails } from '../types/prescription';
import type { Json } from '../types/database.types';

export function usePrescriptions(patientId: string | undefined) {
  return useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: async (): Promise<Prescription[]> => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('prescription')
        .select(`
          *,
          doctor:employee (
            id,
            name
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as Prescription[]) || [];
    },
    enabled: Boolean(patientId),
  });
}

export function useCreatePrescription(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      doctorId,
      details,
    }: {
      clinicId: string;
      doctorId?: string | null;
      details: PrescriptionDetails;
    }) => {
      const { data, error } = await supabase
        .from('prescription')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: doctorId || null,
          details: details as Json,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}

export function useUpdatePrescription(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      details,
    }: {
      id: string;
      details: PrescriptionDetails;
    }) => {
      const { data, error } = await supabase
        .from('prescription')
        .update({
          details: details as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}