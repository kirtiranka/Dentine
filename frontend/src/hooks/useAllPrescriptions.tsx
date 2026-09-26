import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Prescription, PrescriptionDetails } from '../types/prescription';

export function useAllPrescriptions(searchQuery: string = '') {
  return useQuery({
    queryKey: ['all_prescriptions', { search: searchQuery }],
    queryFn: async (): Promise<Prescription[]> => {
      const { data, error } = await supabase
        .from('prescription')
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
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as Prescription[]) || [];
    },
  });
}

export function useCreateGlobalPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      patientId,
      doctorId,
      details,
    }: {
      clinicId: string;
      patientId: string;
      doctorId?: string | null;
      details: PrescriptionDetails;
    }) => {
      const { data, error } = await supabase
        .from('prescription')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: doctorId || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: details as any,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

export function useUpdateGlobalPrescription() {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: details as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}