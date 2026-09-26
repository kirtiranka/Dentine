import { useQuery , useMutation, useQueryClient} from '@tanstack/react-query';
import { supabase } from '../lib/supabase'; // Adjust based on your supabase client location
import type { Patient, PatientDetails } from '../types/patient';

export function usePatients() {
  return useQuery({
    queryKey: ['patients', 'all'],
    queryFn: async (): Promise<Patient[]> => {
      const {data, error} = await supabase
        .from('patient')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as Patient[]) || [];
    },
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async (): Promise<Patient> => {
      if (!id) throw new Error('Patient ID is required');

      const { data, error } = await supabase
        .from('patient')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as Patient;
    },
    enabled: Boolean(id),
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      details,
    }: {
      id: string;
      name: string;
      details: PatientDetails;
    }) => {
      const { data, error } = await supabase
        .from('patient')
        .update({
          name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: details as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Patient;
    },
    onSuccess: (updatedPatient) => {
      // Invalidate specific patient cache and general list
      queryClient.setQueryData(['patients', updatedPatient.id], updatedPatient);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}