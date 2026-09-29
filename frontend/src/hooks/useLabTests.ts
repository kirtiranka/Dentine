import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { LabTest, LabTestStatus } from '../types/labTest';
import type { Database } from '../types/database.types';

type LabTestUpdate = Database['public']['Tables']['lab_test']['Update'] 

export function useLabTests(patientId: string | undefined) {
  return useQuery({
    queryKey: ['lab_tests', patientId],
    queryFn: async (): Promise<LabTest[]> => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('lab_test')
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
      return (data as LabTest[]) || [];
    },
    enabled: Boolean(patientId),
  });
}

export function useCreateLabTest(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      doctorId,
      procedure,
      labName,
      status = 'pending',
    }: {
      clinicId: string;
      doctorId?: string | null;
      procedure: string;
      labName?: string | null;
      status?: LabTestStatus;
    }) => {
      const { data, error } = await supabase
        .from('lab_test')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: doctorId || null,
          procedure,
          lab_name: labName || null,
          status,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as LabTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_tests', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}

export function useUpdateLabTest(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      procedure,
      labName,
      status,
    }: {
      id: string;
      procedure?: string;
      labName?: string | null;
      status?: LabTestStatus;
    }) => {
      const updates: LabTestUpdate = {
        updated_at: new Date().toISOString(),
      };
      if (procedure !== undefined) updates.procedure = procedure;
      if (labName !== undefined) updates.lab_name = labName;
      if (status !== undefined) updates.status = status;

      const { data, error } = await supabase
        .from('lab_test')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as LabTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_tests', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}