import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  ReminderStatus,
  ReminderType,
} from '../types/reminder';
import type { Json, Database } from '../types/database.types';

type ReminderUpdate = Database['public']['Tables']['reminder']['Update'];

interface UseRemindersOptions {
  status?: ReminderStatus | 'all';
  type?: ReminderType | 'all';
}

export function useReminders(clinicId: string, options: UseRemindersOptions = {}) {
  const { status = 'active', type = 'all' } = options;

  return useQuery({
    queryKey: ['reminders', clinicId, status, type],
    queryFn: async (): Promise<Reminder[]> => {
      let query = supabase
        .from('reminder')
        .select(`
          *,
          employee:employee (
            id,
            name
          )
        `)
        .eq('clinic_id', clinicId)
        .order('due_at', { ascending: true });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (type !== 'all') {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as Reminder[]) || [];
    },
    enabled: Boolean(clinicId),
  });
}

export function useCreateReminder(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReminderInput) => {
      const { data, error } = await supabase
        .from('reminder')
        .insert({
          clinic_id: input.clinic_id,
          employee_id: input.employee_id || null,
          asof_datetime: input.asof_datetime,
          remind_in_days: input.remind_in_days ?? 0,
          status: input.status ?? 'active',
          type: input.type,
          details: input.details as Json,
          due_at: "",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', clinicId] });
    },
  });
}

export function useUpdateReminder(clinicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateReminderInput) => {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.remind_in_days !== undefined) {
        updates.remind_in_days = input.remind_in_days;
      }
      if (input.status !== undefined) {
        updates.status = input.status;
      }
      if (input.details !== undefined) {
        updates.details = input.details;
      }

      const { data, error } = await supabase
        .from('reminder')
        .update(updates as ReminderUpdate)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', clinicId] });
    },
  });
}