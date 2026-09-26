import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TreatmentPlan, TreatmentPlanDetails, TreatmentPlanStatus } from '../types/treatmentPlan';

export function useTreatmentPlans(patientId: string | undefined) {
  return useQuery({
    queryKey: ['treatment_plans', patientId],
    queryFn: async (): Promise<TreatmentPlan[]> => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('treatment_plan')
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
      return (data as TreatmentPlan[]) || [];
    },
    enabled: Boolean(patientId),
  });
}

export function useCreateTreatmentPlan(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      doctorId,
      status,
      details,
    }: {
      clinicId: string;
      doctorId?: string | null;
      status: TreatmentPlanStatus;
      details: TreatmentPlanDetails;
    }) => {
      const { data, error } = await supabase
        .from('treatment_plan')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          doctor_id: doctorId || null,
          status,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: details as any,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as TreatmentPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment_plans', patientId] });
    },
  });
}

export function useUpdateTreatmentPlan(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      details,
    }: {
      id: string;
      status: TreatmentPlanStatus;
      details: TreatmentPlanDetails;
    }) => {
      const { data, error } = await supabase
        .from('treatment_plan')
        .update({
          status,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: details as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as TreatmentPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment_plans', patientId] });
    },
  });
}