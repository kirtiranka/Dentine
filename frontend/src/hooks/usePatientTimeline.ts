import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ActionLog } from '../types/actionLog';

export function usePatientTimeline(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient_timeline', patientId],
    queryFn: async (): Promise<ActionLog[]> => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('action_log')
        .select(`
          *,
          actor:employee (
            id,
            name
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as ActionLog[]) || [];
    },
    enabled: Boolean(patientId),
  });
}