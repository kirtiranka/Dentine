import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Employee, Procedure, Lab,  } from '../types/admin';

// ============================================================================
// EMPLOYEES
// ============================================================================

export function useEmployees(clinicId: string) {
  return useQuery({
    queryKey: ['admin_employees', clinicId],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as Employee[]) || [];
    },
    enabled: Boolean(clinicId),
  });
}

export function useSaveEmployee(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: Partial<Employee> & { name: string }) => {
      if (employee.id) {
        const { data, error } = await supabase
          .from('employee')
          .update({
            name: employee.name,
            role: employee.role,
            type: employee.type,
            details: employee.details,
            updated_at: new Date().toISOString(),
          })
          .eq('id', employee.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase
          .from('employee')
          .insert({
            clinic_id: clinicId,
            name: employee.name,
            role: employee.role || 'doctor',
            type: employee.type || 'employee',
            details: employee.details || {},
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_employees', clinicId] });
    },
  });
}

// ============================================================================
// CLINICAL PROCEDURES
// ============================================================================

export function useProcedures(clinicId: string) {
  return useQuery({
    queryKey: ['admin_procedures', clinicId],
    queryFn: async (): Promise<Procedure[]> => {
      const { data, error } = await supabase
        .from('procedure')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: Boolean(clinicId),
  });
}

export function useSaveProcedure(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proc: { id?: string; name: string; type?: string | null; cost: number }) => {
      if (proc.id) {
        const { data, error } = await supabase
          .from('procedure')
          .update({
            name: proc.name,
            type: proc.type || null,
            cost: proc.cost,
            updated_at: new Date().toISOString(),
          })
          .eq('id', proc.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase
          .from('procedure')
          .insert({
            clinic_id: clinicId,
            name: proc.name,
            type: proc.type || null,
            cost: proc.cost,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_procedures', clinicId] });
    },
  });
}

// ============================================================================
// LABS & LAB PROCEDURES
// ============================================================================

export function useLabs(clinicId: string) {
  return useQuery({
    queryKey: ['admin_labs', clinicId],
    queryFn: async (): Promise<Lab[]> => {
      const { data, error } = await supabase
        .from('lab')
        .select(`
          *,
          procedures:lab_procedure (*)
        `)
        .eq('clinic_id', clinicId)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: Boolean(clinicId),
  });
}

export function useSaveLab(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lab: {
      id?: string;
      name: string;
      contact_person?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
    }) => {
      if (lab.id) {
        const { data, error } = await supabase
          .from('lab')
          .update({
            name: lab.name,
            contact_person: lab.contact_person || null,
            phone: lab.phone || null,
            email: lab.email || null,
            address: lab.address || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lab.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase
          .from('lab')
          .insert({
            clinic_id: clinicId,
            name: lab.name,
            contact_person: lab.contact_person || null,
            phone: lab.phone || null,
            email: lab.email || null,
            address: lab.address || null,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_labs', clinicId] });
    },
  });
}

export function useSaveLabProcedure(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lp: {
      id?: string;
      lab_id: string;
      name: string;
      cost: number;
      estimated_turnaround_days: number;
    }) => {
      if (lp.id) {
        const { data, error } = await supabase
          .from('lab_procedure')
          .update({
            name: lp.name,
            cost: lp.cost,
            estimated_turnaround_days: lp.estimated_turnaround_days,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lp.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase
          .from('lab_procedure')
          .insert({
            clinic_id: clinicId,
            lab_id: lp.lab_id,
            name: lp.name,
            cost: lp.cost,
            estimated_turnaround_days: lp.estimated_turnaround_days ?? 7,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_labs', clinicId] });
    },
  });
}