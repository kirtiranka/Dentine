import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import type {
  TreatmentPlan,
  TreatmentPlanDetails,
  TreatmentPlanStatus,
  TreatmentStep,
  TreatmentStepStatus,
} from '../../types/treatmentPlan';
import {
  useTreatmentPlans,
  useCreateTreatmentPlan,
  useUpdateTreatmentPlan,
} from '../../hooks/useTreatmentPlans';

// Helper to format currency
const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export const PatientTreatmentPlans: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const [isCreating, setIsCreating] = useState(false);
  const { data: plans, isLoading, isError, error } = useTreatmentPlans(patient.id);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Treatment Plans</h2>
          <p className="text-xs text-slate-500">
            Design multi-step procedures, track tooth targets, costs, and progress.
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          >
            + Create Treatment Plan
          </button>
        )}
      </div>

      {/* New Plan Card */}
      {isCreating && (
        <CreatePlanCard patient={patient} onClose={() => setIsCreating(false)} />
      )}

      {/* Plans Feed */}
      <div className="space-y-6">
        {isLoading && (
          <div className="bg-white p-8 text-center text-sm text-slate-400 rounded-lg border border-slate-200">
            Loading treatment plans...
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
            Failed to load plans: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && plans?.length === 0 && !isCreating && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-sm font-medium text-slate-700">No treatment plans found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Create a staged treatment proposal with estimated costs and tooth numbering.
            </p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Start First Plan
            </button>
          </div>
        )}

        {plans?.map((plan) => (
          <HistoricalPlanCard key={plan.id} plan={plan} patientId={patient.id} />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: New Treatment Plan Creator
// ============================================================================
const CreatePlanCard: React.FC<{
  patient: Patient;
  onClose: () => void;
}> = ({ patient, onClose }) => {
  const createMutation = useCreateTreatmentPlan(patient.id);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TreatmentPlanStatus>('active');
  const [notes, setNotes] = useState('');
  const [steps, setSteps] = useState<
    Array<{
      step_id: string;
      procedure_name: string;
      teethInput: string;
      cost: number | '';
      status: TreatmentStepStatus;
    }>
  >([
    {
      step_id: crypto.randomUUID(),
      procedure_name: '',
      teethInput: '',
      cost: '',
      status: 'planned',
    },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddStepRow = () => {
    setSteps([
      ...steps,
      {
        step_id: crypto.randomUUID(),
        procedure_name: '',
        teethInput: '',
        cost: '',
        status: 'planned',
      },
    ]);
  };

  const handleRemoveStepRow = (index: number) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (
    index: number,
    field: 'procedure_name' | 'teethInput' | 'cost' | 'status',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const totalCost = steps.reduce(
    (acc, curr) => acc + (typeof curr.cost === 'number' ? curr.cost : 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formattedSteps: TreatmentStep[] = steps
      .filter((s) => s.procedure_name.trim() !== '')
      .map((s) => ({
        step_id: s.step_id,
        procedure_name: s.procedure_name.trim(),
        teeth_numbers: s.teethInput
          .split(',')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n)),
        cost: typeof s.cost === 'number' ? s.cost : 0,
        status: s.status,
        completed_at: s.status === 'completed' ? new Date().toISOString() : null,
      }));

    if (formattedSteps.length === 0) {
      setErrorMsg('Please enter at least one procedure step.');
      return;
    }

    const details: TreatmentPlanDetails = {
      title: title.trim() || undefined,
      notes: notes.trim() || undefined,
      steps: formattedSteps,
    };

    try {
      await createMutation.mutateAsync({
        clinicId: patient.clinic_id,
        doctorId: null,
        status,
        details,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create plan');
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 shadow-md p-6">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          New Treatment Plan
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs font-medium"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Plan Title / Objective
            </label>
            <input
              type="text"
              placeholder="e.g. Complete Mandibular Restoration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TreatmentPlanStatus)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending Acceptance</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Steps Builder */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Procedure Steps
            </span>
            <span className="text-xs font-medium text-slate-600">
              Total Estimate: <strong className="text-slate-900">{formatCurrency(totalCost)}</strong>
            </span>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={step.step_id}
                className="flex flex-col md:flex-row items-start md:items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md"
              >
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Procedure (e.g. Root Canal Treatment)"
                    value={step.procedure_name}
                    onChange={(e) => handleStepChange(idx, 'procedure_name', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="w-full md:w-32">
                  <input
                    type="text"
                    placeholder="Teeth (e.g. 16, 46)"
                    value={step.teethInput}
                    onChange={(e) => handleStepChange(idx, 'teethInput', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-full md:w-28">
                  <input
                    type="number"
                    placeholder="Cost (₹)"
                    value={step.cost}
                    onChange={(e) =>
                      handleStepChange(
                        idx,
                        'cost',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-full md:w-28">
                  <select
                    value={step.status}
                    onChange={(e) => handleStepChange(idx, 'status', e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStepRow(idx)}
                  disabled={steps.length === 1}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddStepRow}
            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            + Add Step
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Clinical Notes</label>
          <textarea
            rows={2}
            placeholder="Special considerations, sedation needs, patient consent details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
          >
            {createMutation.isPending ? 'Saving...' : 'Save Treatment Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// COMPONENT: Historical Plan Card (View vs Edit Controller)
// ============================================================================
const HistoricalPlanCard: React.FC<{
  plan: TreatmentPlan;
  patientId: string;
}> = ({ plan, patientId }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {!isEditing ? (
        <PlanView plan={plan} onEdit={() => setIsEditing(true)} />
      ) : (
        <PlanEditForm plan={plan} patientId={patientId} onCancel={() => setIsEditing(false)} />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Plan View Mode
// ============================================================================
const PlanView: React.FC<{
  plan: TreatmentPlan;
  onEdit: () => void;
}> = ({ plan, onEdit }) => {
  const createdFormatted = new Date(plan.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const steps = plan.details?.steps || [];
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const totalCost = steps.reduce((sum, s) => sum + (s.cost || 0), 0);
  const progressPercent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  const statusStyles: Record<TreatmentPlanStatus, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    active: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const stepStatusBadge: Record<TreatmentStepStatus, { label: string; class: string }> = {
    planned: { label: 'Planned', class: 'bg-slate-100 text-slate-600' },
    in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Done', class: 'bg-emerald-100 text-emerald-800 font-semibold' },
    cancelled: { label: 'Cancelled', class: 'bg-slate-100 text-slate-400 line-through' },
  };

  return (
    <div className="p-6">
      {/* Plan Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900">
              {plan.details?.title || 'Comprehensive Treatment Plan'}
            </h3>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${statusStyles[plan.status]}`}
            >
              {plan.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Created: {createdFormatted}</span>
            {plan.doctor?.name && (
              <>
                <span>•</span>
                <span>Doctor: {plan.doctor.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Estimated Total
            </span>
            <span className="text-base font-bold text-slate-800">{formatCurrency(totalCost)}</span>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
          >
            Edit Plan
          </button>
        </div>
      </div>

      {/* Progress Metric */}
      {steps.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Completion Progress</span>
            <span className="font-semibold text-slate-700">
              {completedSteps} of {steps.length} Steps ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps Table */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-4">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="py-2.5 px-3 font-semibold w-10">#</th>
              <th className="py-2.5 px-3 font-semibold">Procedure</th>
              <th className="py-2.5 px-3 font-semibold">Teeth</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {steps.map((step, idx) => (
              <tr key={step.step_id} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                <td className="py-2.5 px-3 font-medium text-slate-800">
                  {step.procedure_name}
                </td>
                <td className="py-2.5 px-3">
                  {step.teeth_numbers && step.teeth_numbers.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {step.teeth_numbers.map((t) => (
                        <span
                          key={t}
                          className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">General</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] ${stepStatusBadge[step.status]?.class}`}
                  >
                    {stepStatusBadge[step.status]?.label || step.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                  {formatCurrency(step.cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plan.details?.notes && (
        <div className="text-xs bg-slate-50 p-3 rounded border border-slate-100 text-slate-600">
          <strong className="text-slate-700 block mb-0.5">Clinical Plan Notes:</strong>
          {plan.details.notes}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Plan Edit Form
// ============================================================================
const PlanEditForm: React.FC<{
  plan: TreatmentPlan;
  patientId: string;
  onCancel: () => void;
}> = ({ plan, patientId, onCancel }) => {
  const updateMutation = useUpdateTreatmentPlan(patientId);

  // Initialized directly from props on mount (no useEffect)
  const [title, setTitle] = useState(plan.details?.title || '');
  const [status, setStatus] = useState<TreatmentPlanStatus>(plan.status);
  const [notes, setNotes] = useState(plan.details?.notes || '');
  const [steps, setSteps] = useState<
    Array<{
      step_id: string;
      procedure_name: string;
      teethInput: string;
      cost: number | '';
      status: TreatmentStepStatus;
    }>
  >(
    (plan.details?.steps || []).map((s) => ({
      step_id: s.step_id,
      procedure_name: s.procedure_name,
      teethInput: s.teeth_numbers?.join(', ') || '',
      cost: s.cost,
      status: s.status,
    }))
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddStepRow = () => {
    setSteps([
      ...steps,
      {
        step_id: crypto.randomUUID(),
        procedure_name: '',
        teethInput: '',
        cost: '',
        status: 'planned',
      },
    ]);
  };

  const handleRemoveStepRow = (index: number) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (
    index: number,
    field: 'procedure_name' | 'teethInput' | 'cost' | 'status',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formattedSteps: TreatmentStep[] = steps
      .filter((s) => s.procedure_name.trim() !== '')
      .map((s) => ({
        step_id: s.step_id,
        procedure_name: s.procedure_name.trim(),
        teeth_numbers: s.teethInput
          .split(',')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n)),
        cost: typeof s.cost === 'number' ? s.cost : 0,
        status: s.status,
        completed_at: s.status === 'completed' ? new Date().toISOString() : null,
      }));

    const updatedDetails: TreatmentPlanDetails = {
      ...plan.details,
      title: title.trim() || undefined,
      notes: notes.trim() || undefined,
      steps: formattedSteps,
    };

    try {
      await updateMutation.mutateAsync({
        id: plan.id,
        status,
        details: updatedDetails,
      });
      onCancel();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update plan');
    }
  };

  return (
    <form onSubmit={handleUpdate} className="p-6 bg-slate-50/50 space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Edit Treatment Plan
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-xs text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Updating...' : 'Save Plan'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TreatmentPlanStatus)}
            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending Acceptance</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Editable Steps Table */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Procedure Steps</label>
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div
              key={step.step_id}
              className="flex flex-col md:flex-row items-start md:items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-md"
            >
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Procedure Name"
                  value={step.procedure_name}
                  onChange={(e) => handleStepChange(idx, 'procedure_name', e.target.value)}
                  className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="w-full md:w-32">
                <input
                  type="text"
                  placeholder="Teeth (16, 46)"
                  value={step.teethInput}
                  onChange={(e) => handleStepChange(idx, 'teethInput', e.target.value)}
                  className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-full md:w-28">
                <input
                  type="number"
                  placeholder="Cost"
                  value={step.cost}
                  onChange={(e) =>
                    handleStepChange(
                      idx,
                      'cost',
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-full md:w-28">
                <select
                  value={step.status}
                  onChange={(e) => handleStepChange(idx, 'status', e.target.value)}
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveStepRow(idx)}
                disabled={steps.length === 1}
                className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddStepRow}
          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          + Add Step
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Clinical Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-xs p-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </form>
  );
};