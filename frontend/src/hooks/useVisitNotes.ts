import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { VisitNote, VisitNoteDetails } from '../types/visitNote';

export function useVisitNotes(patientId: string | undefined) {
  return useQuery({
    queryKey: ['visit_notes', patientId],
    queryFn: async (): Promise<VisitNote[]> => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('visit_note')
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
      return (data as VisitNote[]) || [];
    },
    enabled: Boolean(patientId),
  });
}

export function useCreateVisitNote(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      doctorId,
      details,
    }: {
      clinicId: string;
      doctorId?: string | null;
      details: VisitNoteDetails;
    }) => {
      const { data, error } = await supabase
        .from('visit_note')
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
      return data as VisitNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit_notes', patientId] });
    },
  });
}

export function useUpdateVisitNote(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      details,
    }: {
      id: string;
      details: VisitNoteDetails;
    }) => {
      const { data, error } = await supabase
        .from('visit_note')
        .update({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: details as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as VisitNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit_notes', patientId] });
    },
  });
}