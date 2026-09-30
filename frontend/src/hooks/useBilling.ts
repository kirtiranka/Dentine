import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TreatmentPlan } from '../types/treatmentPlan';
import type {
  Invoice,
  Payment,
  InvoiceStatus,
  PaymentMethod,
  InvoiceItem,
} from '../types/billing';

export function usePatientBilling(patientId: string | undefined) {
  // 1. Fetch Invoices
  const invoicesQuery = useQuery({
    queryKey: ['invoices', patientId],
    queryFn: async (): Promise<Invoice[]> => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('invoice')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as Invoice[]) || [];
    },
    enabled: Boolean(patientId),
  });

  // 2. Fetch Payments
  const paymentsQuery = useQuery({
    queryKey: ['payments', patientId],
    queryFn: async (): Promise<Payment[]> => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('payment')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as Payment[]) || [];
    },
    enabled: Boolean(patientId),
  });

  // 3. Fetch Treatment Plans
  const treatmentPlansQuery = useQuery({
    queryKey: ['treatment_plans', patientId],
    queryFn: async (): Promise<TreatmentPlan[]> => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('treatment_plan')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as TreatmentPlan[]) || [];
    },
    enabled: Boolean(patientId),
  });

  return {
    invoices: invoicesQuery.data || [],
    payments: paymentsQuery.data || [],
    treatmentPlans: treatmentPlansQuery.data || [],
    isLoading:
      invoicesQuery.isLoading ||
      paymentsQuery.isLoading ||
      treatmentPlansQuery.isLoading,
    isError:
      invoicesQuery.isError ||
      paymentsQuery.isError ||
      treatmentPlansQuery.isError,
    error: invoicesQuery.error || paymentsQuery.error || treatmentPlansQuery.error,
  };
}

export function useCreateInvoice(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      items,
      notes,
    }: {
      clinicId: string;
      items: InvoiceItem[];
      notes?: string;
    }) => {
      const totalAmount = items.reduce(
        (sum, item) => sum + Math.max(0, item.amount - (item.discount || 0)),
        0
      );

      const { data, error } = await supabase
        .from('invoice')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          status: 'unpaid',
          total_amount: totalAmount,
          details: {
            items,
            notes: notes || undefined,
          },
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}

export function useUpdateInvoiceStatus(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: InvoiceStatus;
    }) => {
      const { data, error } = await supabase
        .from('invoice')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}

export function useCreatePayment(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clinicId,
      invoiceId,
      amount,
      paymentMethod,
      transactionRef,
    }: {
      clinicId: string;
      invoiceId?: string | null;
      amount: number;
      paymentMethod: PaymentMethod;
      transactionRef?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('payment')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          invoice_id: invoiceId || null,
          amount,
          payment_method: paymentMethod,
          transaction_ref: transactionRef || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', patientId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient_timeline', patientId] });
    },
  });
}