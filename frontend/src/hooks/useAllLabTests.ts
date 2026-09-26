import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { LabTest, LabTestStatus } from '../types/labTest';
import type { Database } from '../types/database.types';

type LabTestUpdate = Database['public']['Tables']['lab_test']['Update'] 

export function useAllLabTests(searchQuery: string = '') {
  return useQuery({
    queryKey: ['all_lab_tests', { search: searchQuery }],
    queryFn: async (): Promise<LabTest[]> => {
      let query = supabase
        .from('lab_test')
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

      if (searchQuery.trim()) {
        // Filter by procedure or lab vendor
        query = query.or(`procedure.ilike.%${searchQuery.trim()}%,lab_name.ilike.%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as LabTest[]) || [];
    },
  });
}

export function useCreateGlobalLabTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      patientId,
      doctorId,
      procedure,
      labName,
      status = 'pending',
    }: {
      clinicId: string;
      patientId: string;
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
      queryClient.invalidateQueries({ queryKey: ['all_lab_tests'] });
      queryClient.invalidateQueries({ queryKey: ['lab_tests'] });
    },
  });
}

export function useUpdateGlobalLabTest() {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates:LabTestUpdate = {
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
      queryClient.invalidateQueries({ queryKey: ['all_lab_tests'] });
      queryClient.invalidateQueries({ queryKey: ['lab_tests'] });
    },
  });
}