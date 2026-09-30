import React, { useState, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import type {
  Invoice,
//   Payment,
  InvoiceStatus,
  PaymentMethod,
  CompletedProcedure,
  InvoiceItem,
} from '../../types/billing';
import {
  usePatientBilling,
  useCreateInvoice,
  useUpdateInvoiceStatus,
  useCreatePayment,
} from '../../hooks/useBilling';
import { useReactToPrint } from 'react-to-print';
import { PrintableInvoice } from '../../components/printing/PrintableInvoice';

const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; badge: string }
> = {
  unpaid: { label: 'Unpaid', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  partially_paid: { label: 'Partially Paid', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Paid in Full', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', badge: 'bg-slate-100 text-slate-500 border-slate-200 line-through' },
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '💵 Cash',
  card: '💳 Card (POS)',
  upi: '📱 UPI / QR',
  insurance: '🛡 Insurance',
};

export const PatientPayments: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const { invoices, payments, treatmentPlans, isLoading, isError, error } =
    usePatientBilling(patient.id);

  const [selectedStepIds, setSelectedStepIds] = useState<Set<string>>(new Set());
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePrintInvoice, setActivePrintInvoice] = useState<Invoice | null>(null);

  const updateInvoiceStatus = useUpdateInvoiceStatus(patient.id);

  // 1. Identify all active (non-cancelled) invoiced step IDs
  const activeInvoicedStepIds = useMemo(() => {
    const ids = new Set<string>();
    invoices
      .filter((inv) => inv.status !== 'cancelled')
      .forEach((inv) => {
        inv.details?.items?.forEach((item) => {
          if (item.step_id) ids.add(item.step_id);
        });
      });
    return ids;
  }, [invoices]);

  // 2. Extract completed treatment steps across all treatment plans
  const completedProcedures: CompletedProcedure[] = useMemo(() => {
    const list: CompletedProcedure[] = [];
    treatmentPlans.forEach((plan) => {
      const steps = plan.details?.steps || [];
      steps.forEach((step) => {
        if (step.status === 'completed') {
          list.push({
            step_id: step.step_id,
            plan_id: plan.id,
            plan_title: plan.details?.title || 'Treatment Plan',
            procedure_name: step.procedure_name,
            teeth_numbers: step.teeth_numbers || [],
            cost: Number(step.cost) || 0,
            completed_at: step.completed_at,
            isInvoiced: activeInvoicedStepIds.has(step.step_id),
          });
        }
      });
    });
    return list;
  }, [treatmentPlans, activeInvoicedStepIds]);

  // 3. Filter unbilled procedures available for new invoices
  const unbilledProcedures = useMemo(
    () => completedProcedures.filter((p) => !p.isInvoiced),
    [completedProcedures]
  );

  const totalProceduresCharge = useMemo(() => {
  return completedProcedures.reduce((sum, proc) => sum + Number(proc.cost), 0);
}, [completedProcedures]);

  // 4. Financial ledger calculations
  const totalCharged = useMemo(() => {
    return invoices
      .filter((inv) => inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
  }, [payments]);

  const balanceOwed = totalCharged - totalPaid;

  // Selection handlers
  const handleToggleSelectStep = (stepId: string) => {
    const next = new Set(selectedStepIds);
    if (next.has(stepId)) {
      next.delete(stepId);
    } else {
      next.add(stepId);
    }
    setSelectedStepIds(next);
  };

  const handleSelectAllUnbilled = () => {
    // The name is a little misleading. It also deselects all if you had previously selected all unbilled
    if (selectedStepIds.size === unbilledProcedures.length) {
      setSelectedStepIds(new Set());
    } else {
      setSelectedStepIds(new Set(unbilledProcedures.map((p) => p.step_id)));
    }
  };

  const selectedProceduresList = useMemo(() => {
    return unbilledProcedures.filter((p) => selectedStepIds.has(p.step_id));
  }, [unbilledProcedures, selectedStepIds]);

  // Toggle invoice status between paid and unpaid
  const handleTogglePaidStatus = (invoice: Invoice) => {
    const nextStatus: InvoiceStatus =
      invoice.status === 'paid' ? 'unpaid' : 'paid';
    updateInvoiceStatus.mutate({ id: invoice.id, status: nextStatus });
  };

  // Cancel invoice (frees up procedures)
  const handleCancelInvoice = (invoice: Invoice) => {
    if (
      window.confirm(
        'Cancel this invoice? The procedures included in it will become available to invoice again.'
      )
    ) {
      updateInvoiceStatus.mutate({ id: invoice.id, status: 'cancelled' });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 text-center text-sm text-slate-400 rounded-lg border border-slate-200">
        Loading patient billing accounts, invoices, and ledger...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
        Failed to load billing records: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Top Banner: Financial Ledger Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 1. Gross Procedures Completed */}
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
      Treatments Completed
    </span>
    <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
      ₹{totalProceduresCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </div>
    <span className="text-[11px] text-slate-500 mt-1 block">
      {completedProcedures.length} procedure{completedProcedures.length === 1 ? '' : 's'} done (gross)
    </span>
  </div>

  {/* 2. Total Invoiced */}
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
      Total Invoiced
    </span>
    <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
      ₹{totalCharged.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </div>
    <span className="text-[11px] text-slate-500 mt-1 block">
      Active invoices issued (net)
    </span>
  </div>

  {/* 3. Total Payments */}
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
      Payments Received
    </span>
    <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
      ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </div>
    <span className="text-[11px] text-slate-500 mt-1 block">
      {payments.length} receipt{payments.length === 1 ? '' : 's'} recorded
    </span>
  </div>

  {/* 4. Balance / Advance */}
  <div
    className={`p-5 rounded-lg border shadow-xs ${
      balanceOwed > 0
        ? 'bg-amber-50/50 border-amber-200'
        : balanceOwed < 0
        ? 'bg-emerald-50/50 border-emerald-200'
        : 'bg-white border-slate-200'
    }`}
  >
    <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500">
      {balanceOwed >= 0 ? 'Amount Yet Owed (Due)' : 'Advance Balance / Credit'}
    </span>
    <div
      className={`text-2xl font-bold mt-1 font-mono ${
        balanceOwed > 0
          ? 'text-amber-700'
          : balanceOwed < 0
          ? 'text-emerald-700'
          : 'text-slate-700'
      }`}
    >
      {balanceOwed >= 0
        ? `₹${balanceOwed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : `- ₹${Math.abs(balanceOwed).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
    </div>
    <span className="text-[11px] text-slate-500 mt-1 block">
      {balanceOwed > 0
        ? 'Pending patient settlement'
        : balanceOwed < 0
        ? 'Patient has paid in advance'
        : 'All accounts balanced'}
    </span>
  </div>
</div>

      {/* ==================================================================== */}
      {/* SECTION 1: TREATMENTS DONE (Unbilled vs Invoiced)                    */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Treatments Done
            </h3>
            <p className="text-xs text-slate-500">
              Completed procedural steps ready for invoicing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unbilledProcedures.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllUnbilled}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                {selectedStepIds.size === unbilledProcedures.length
                  ? 'Deselect All'
                  : 'Select All Unbilled'}
              </button>
            )}

            <button
              type="button"
              disabled={selectedStepIds.size === 0}
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors disabled:opacity-40"
            >
              + Generate Invoice ({selectedStepIds.size})
            </button>
          </div>
        </div>

        {completedProcedures.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No completed treatment steps found for this patient.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {completedProcedures.map((proc) => {
              const isSelected = selectedStepIds.has(proc.step_id);

              return (
                <div
                  key={proc.step_id}
                  // How does this work?
                  onClick={() => !proc.isInvoiced && handleToggleSelectStep(proc.step_id)}
                  className={`px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                    proc.isInvoiced
                      ? 'bg-slate-50/60 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50/50 cursor-pointer'
                      : 'hover:bg-slate-50/80 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={proc.isInvoiced}
                      onChange={() => handleToggleSelectStep(proc.step_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {proc.procedure_name}
                        </span>
                        {proc.teeth_numbers?.length > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded border border-slate-200">
                            Tooth: {proc.teeth_numbers.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Plan: {proc.plan_title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold font-mono text-slate-900">
                      ₹{proc.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>

                    {proc.isInvoiced ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 bg-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                        Invoiced ✓
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold uppercase tracking-wider">
                        Ready to Bill
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* SECTION 2: INVOICES                                                 */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Issued Invoices
            </h3>
            <p className="text-xs text-slate-500">
              Tax invoices generated against completed procedures.
            </p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No invoices have been generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">Invoice ID</th>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Items</th>
                  <th className="py-2.5 px-4 font-semibold">Amount</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const statusInfo =
                    INVOICE_STATUS_CONFIG[inv.status] || INVOICE_STATUS_CONFIG.unpaid;
                  const items = inv.details?.items || [];
                  const dateStr = new Date(inv.created_at).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  });

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        inv.status === 'cancelled' ? 'bg-slate-50/40 opacity-60' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        #{inv.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate" title={items.map((i) => i.description).join(', ')}>
                          {items.map((i) => i.description).join(', ') || 'No item details'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${statusInfo.badge}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Slip */}
                          <button
                            type="button"
                            onClick={() => setActivePrintInvoice(inv)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium"
                          >
                            🖨 Print
                          </button>

                          {inv.status !== 'cancelled' && (
                            <>
                              {/* Toggle Paid / Unpaid */}
                              <button
                                type="button"
                                onClick={() => handleTogglePaidStatus(inv)}
                                className={`px-2.5 py-1 rounded font-semibold border transition-colors ${
                                  inv.status === 'paid'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {inv.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                              </button>

                              {/* Cancel Invoice */}
                              <button
                                type="button"
                                onClick={() => handleCancelInvoice(inv)}
                                className="px-2 py-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                title="Cancel invoice (frees items)"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* SECTION 3: PAYMENTS RECORDED                                        */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Payments & Receipts
            </h3>
            <p className="text-xs text-slate-500">
              Transactions, advance credits, and settlements.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
          >
            + Add Payment
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No payments have been recorded for this patient.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">Receipt ID</th>
                  <th className="py-2.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-2.5 px-4 font-semibold">Linked Invoice</th>
                  <th className="py-2.5 px-4 font-semibold">Method</th>
                  <th className="py-2.5 px-4 font-semibold">Ref / Trans ID</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const dateStr = new Date(p.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        #{p.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        {p.invoice_id ? (
                          <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                            Inv #{p.invoice_id.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Advance / Unlinked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {p.transaction_ref || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{Number(p.amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL: Generate Invoice                                              */}
      {/* ==================================================================== */}
      {isInvoiceModalOpen && (
        <CreateInvoiceModal
          patient={patient}
          procedures={selectedProceduresList}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedStepIds(new Set());
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: Add Payment                                                   */}
      {/* ==================================================================== */}
      {isPaymentModalOpen && (
        <CreatePaymentModal
          patient={patient}
          invoices={invoices.filter((i) => i.status !== 'cancelled')}
          balanceOwed={balanceOwed}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL: Printable Invoice Slip                                        */}
      {/* ==================================================================== */}
      {activePrintInvoice && (
        <PrintInvoiceModal
          patient={patient}
          invoice={activePrintInvoice}
          onClose={() => setActivePrintInvoice(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Create Invoice Modal
// ============================================================================
const CreateInvoiceModal: React.FC<{
  patient: Patient;
  procedures: CompletedProcedure[];
  onClose: () => void;
}> = ({ patient, procedures, onClose }) => {
  const createInvoice = useCreateInvoice(patient.id);

  // Editable item list initialized from selected procedures
  const [items, setItems] = useState<InvoiceItem[]>(() =>
    procedures.map((p) => ({
      step_id: p.step_id,
      description: `${p.procedure_name}${
        p.teeth_numbers?.length ? ` (Tooth: ${p.teeth_numbers.join(', ')})` : ''
      }`,
      amount: p.cost,
      discount: 0,
    }))
  );
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDiscountChange = (index: number, discountValue: number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      discount: Math.max(0, discountValue || 0),
    };
    setItems(updated);
  };

  const totalCalculated = items.reduce(
    (sum, i) => sum + Math.max(0, i.amount - (i.discount || 0)),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('At least one item is required to generate an invoice.');
      return;
    }

    try {
      await createInvoice.mutateAsync({
        clinicId: patient.clinic_id,
        items,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create invoice');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Generate Invoice</h3>
            <p className="text-xs text-slate-500">
              Patient: <strong className="text-slate-800">{patient.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2 px-3 text-left">Procedure</th>
                  <th className="py-2 px-3 text-right">Fee (₹)</th>
                  <th className="py-2 px-3 text-right w-24">Discount (₹)</th>
                  <th className="py-2 px-3 text-right">Net (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const net = Math.max(0, item.amount - (item.discount || 0));
                  return (
                    <tr key={item.step_id || idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {item.amount.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={item.amount}
                          value={item.discount || ''}
                          placeholder="0"
                          onChange={(e) =>
                            handleDiscountChange(idx, Number(e.target.value))
                          }
                          className="w-full text-right text-xs px-1.5 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {net.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase">
              Total Invoiced Amount
            </span>
            <span className="text-base font-bold text-blue-700 font-mono">
              ₹{totalCalculated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invoice Remarks / Advisory (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 10% senior citizen concession applied"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInvoice.isPending}
              className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
            >
              {createInvoice.isPending ? 'Generating...' : 'Confirm & Issue Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Add Payment Modal
// ============================================================================
const CreatePaymentModal: React.FC<{
  patient: Patient;
  invoices: Invoice[];
  balanceOwed: number;
  onClose: () => void;
}> = ({ patient, invoices, balanceOwed, onClose }) => {
  const createPayment = useCreatePayment(patient.id);

  const [invoiceId, setInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>(
    balanceOwed > 0 ? balanceOwed : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!amount || amount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than zero.');
      return;
    }

    try {
      await createPayment.mutateAsync({
        clinicId: patient.clinic_id,
        invoiceId: invoiceId || null,
        amount: Number(amount),
        paymentMethod,
        transactionRef: transactionRef.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Payment recording failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-500">
              Patient: <strong className="text-slate-800">{patient.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Linked Invoice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Apply to Specific Invoice (Optional)
            </label>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">
                -- Advance / General Account Credit --
              </option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  Invoice #{inv.id.slice(0, 8)} — ₹
                  {Number(inv.total_amount).toFixed(2)} ({inv.status})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount Received (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Mode
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="upi">📱 UPI / QR Transfer</option>
              <option value="cash">💵 Cash in Hand</option>
              <option value="card">💳 Debit / Credit Card (POS)</option>
              <option value="insurance">🛡 Insurance Claim Settlement</option>
            </select>
          </div>

          {/* Transaction Ref */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / UTR / Auth Code
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref #4230192831"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPayment.isPending}
              className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded font-semibold disabled:opacity-50"
            >
              {createPayment.isPending ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const InvoiceRowAction: React.FC<{ patient: Patient; invoice: Invoice }> = ({
  patient,
  invoice,
}) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${patient.name.replace(/\s+/g, '_')}_${invoice.id.slice(0, 8)}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => handlePrint()}
        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-xs"
      >
        🖨 Print Invoice
      </button>

      {/* Hidden offscreen container holding the printable layout */}
      <div style={{ display: 'none' }}>
        <PrintableInvoice ref={componentRef} patient={patient} invoice={invoice} />
      </div>
    </div>
  );
};
// ============================================================================
// COMPONENT: Printable Invoice Modal
// ============================================================================
const PrintInvoiceModal: React.FC<{
  patient: Patient;
  invoice: Invoice;
  onClose: () => void;
}> = ({ patient, invoice, onClose }) => {
  const items = invoice.details?.items || [];
  const dateFormatted = new Date(invoice.created_at).toLocaleDateString('en-IN', {
    dateStyle: 'long',
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full p-8 shadow-2xl flex flex-col space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              CLINIC TAX INVOICE
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoice Status:{' '}
              <strong className="uppercase text-slate-800">{invoice.status}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">
              Date: {dateFormatted}
            </span>
            <span className="text-xs text-slate-900 font-mono font-bold block">
              Inv ID: #{invoice.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Patient Metadata */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block">Billed To (Patient)</span>
            <strong className="text-slate-900 text-sm">{patient.name}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Phone</span>
            <strong className="text-slate-700">
              {patient.details?.contact?.phone || '—'}
            </strong>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Procedural Description</th>
                <th className="py-2.5 px-2 text-right">Fee (₹)</th>
                <th className="py-2.5 px-2 text-right">Discount (₹)</th>
                <th className="py-2.5 px-2 text-right">Net Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const net = Math.max(0, item.amount - (item.discount || 0));
                return (
                  <tr key={idx}>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-bold text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                      {item.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                      {item.discount ? item.discount.toFixed(2) : '0.00'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                      {net.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-t border-slate-900 font-bold text-sm text-slate-900">
              <span>Total Payable</span>
              <span className="font-mono">
                ₹
                {Number(invoice.total_amount).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {invoice.details?.notes && (
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs text-slate-600">
            <strong>Notes:</strong> {invoice.details.notes}
          </div>
        )}

        {/* Signature Line */}
        <div className="pt-8 flex justify-between items-end border-t border-slate-200">
          <div className="text-[11px] text-slate-400">
            Computer generated clinical invoice
          </div>
          <div className="text-center w-48 border-t border-slate-400 pt-1">
            <span className="text-xs text-slate-700 font-medium block">
              Authorized Signatory
            </span>
          </div>
        </div>

        {/* Modal Controls (Hidden during print) */}
        <div className="flex justify-end gap-2 pt-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Close
          </button>
          <InvoiceRowAction patient={patient} invoice={invoice}/>
          {/* <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold shadow-xs"
          >
            🖨 Print Invoice Slip
          </button> */}
        </div>
      </div>
    </div>
  );
};

