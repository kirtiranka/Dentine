import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import type { LabTest, LabTestStatus } from '../../types/labTest';
import {
  useLabTests,
  useCreateLabTest,
  useUpdateLabTest,
} from '../../hooks/useLabTests';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

const statusConfig: Record<LabTestStatus, { label: string; badgeClass: string }> = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 line-through',
  },
};

export const PatientLabTests: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const { data: tests, isLoading, isError, error } = useLabTests(patient.id);

  const filteredTests = tests?.filter((test) => {
    if (filter === 'active') return test.status === 'pending' || test.status === 'in_progress';
    if (filter === 'completed') return test.status === 'completed';
    if (filter === 'cancelled') return test.status === 'cancelled';
    return true;
  });

  const activeCount = tests?.filter((t) => t.status === 'pending' || t.status === 'in_progress').length || 0;
  const completedCount = tests?.filter((t) => t.status === 'completed').length || 0;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lab Orders & Requisitions</h2>
          <p className="text-xs text-slate-500">
            Order external prosthesis, dental CAD/CAM work, diagnostics, and track turnaround statuses.
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          >
            + Order Lab Test
          </button>
        )}
      </div>

      {/* New Lab Test Form */}
      {isCreating && (
        <CreateLabTestCard patient={patient} onClose={() => setIsCreating(false)} />
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          {(
            [
              { id: 'all', label: 'All Orders', count: tests?.length || 0 },
              { id: 'active', label: 'Active', count: activeCount },
              { id: 'completed', label: 'Completed', count: completedCount },
              { id: 'cancelled', label: 'Cancelled', count: (tests?.length || 0) - activeCount - completedCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="bg-white p-8 text-center text-sm text-slate-400 rounded-lg border border-slate-200">
            Loading lab orders...
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
            Failed to load lab tests: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && filteredTests?.length === 0 && !isCreating && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-sm font-medium text-slate-700">No lab tests found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {filter === 'all'
                ? 'No external lab work has been ordered for this patient yet.'
                : `No orders matching filter "${filter}".`}
            </p>
            {filter === 'all' && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Create Lab Order
              </button>
            )}
          </div>
        )}

        {filteredTests?.map((test) => (
          <HistoricalLabTestCard key={test.id} test={test} patientId={patient.id} />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: New Lab Test Order Form
// ============================================================================
const CreateLabTestCard: React.FC<{
  patient: Patient;
  onClose: () => void;
}> = ({ patient, onClose }) => {
  const createMutation = useCreateLabTest(patient.id);

  const [procedure, setProcedure] = useState('');
  const [labName, setLabName] = useState('');
  const [status, setStatus] = useState<LabTestStatus>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!procedure.trim()) {
      setErrorMsg('Please specify the lab test or procedure name.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        clinicId: patient.clinic_id,
        doctorId: null,
        procedure: procedure.trim(),
        labName: labName.trim() || null,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create lab test');
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 shadow-md p-6">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          New Lab Requisition
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Procedure / Work Ordered
            </label>
            <input
              type="text"
              placeholder="e.g. Zirconia Crown CAD/CAM (#46) or Complete Blood Count"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Laboratory Name / Vendor
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Precision Dental Lab"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LabTestStatus)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
            {createMutation.isPending ? 'Ordering...' : 'Submit Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// COMPONENT: Historical Lab Test Card (View vs Edit Controller)
// ============================================================================
const HistoricalLabTestCard: React.FC<{
  test: LabTest;
  patientId: string;
}> = ({ test, patientId }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {!isEditing ? (
        <LabTestView test={test} patientId={patientId} onEdit={() => setIsEditing(true)} />
      ) : (
        <LabTestEditForm test={test} patientId={patientId} onCancel={() => setIsEditing(false)} />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Lab Test View Mode with Quick Status Selector
// ============================================================================
const LabTestView: React.FC<{
  test: LabTest;
  patientId: string;
  onEdit: () => void;
}> = ({ test, patientId, onEdit }) => {
  const updateMutation = useUpdateLabTest(patientId);

  const createdFormatted = new Date(test.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handleQuickStatusChange = (newStatus: LabTestStatus) => {
    updateMutation.mutate({ id: test.id, status: newStatus });
  };

  const currentBadge = statusConfig[test.status] || statusConfig.pending;

  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Test details */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-slate-900">{test.procedure}</span>
          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${currentBadge.badgeClass}`}
          >
            {currentBadge.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>
            Lab: <strong className="text-slate-700">{test.lab_name || 'In-House / Unspecified'}</strong>
          </span>
          <span>•</span>
          <span>Ordered: {createdFormatted}</span>
          {test.doctor?.name && (
            <>
              <span>•</span>
              <span>Doctor: {test.doctor.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Quick Status and Actions */}
      <div className="flex items-center gap-3 self-end md:self-center">
        {/* Quick status dropdown */}
        <select
          value={test.status}
          onChange={(e) => handleQuickStatusChange(e.target.value as LabTestStatus)}
          disabled={updateMutation.isPending}
          className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
        >
          <option value="pending">Mark Pending</option>
          <option value="in_progress">Mark In Progress</option>
          <option value="completed">Mark Completed</option>
          <option value="cancelled">Mark Cancelled</option>
        </select>

        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Lab Test Edit Form
// ============================================================================
const LabTestEditForm: React.FC<{
  test: LabTest;
  patientId: string;
  onCancel: () => void;
}> = ({ test, patientId, onCancel }) => {
  const updateMutation = useUpdateLabTest(patientId);

  // Initialized directly from props on mount (no useEffect)
  const [procedure, setProcedure] = useState(test.procedure);
  const [labName, setLabName] = useState(test.lab_name || '');
  const [status, setStatus] = useState<LabTestStatus>(test.status);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!procedure.trim()) {
      setErrorMsg('Please specify the procedure.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: test.id,
        procedure: procedure.trim(),
        labName: labName.trim() || null,
        status,
      });
      onCancel();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update lab test');
    }
  };

  return (
    <form onSubmit={handleUpdate} className="p-4 bg-slate-50/50 space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Edit Lab Order
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
            {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Procedure</label>
          <input
            type="text"
            value={procedure}
            onChange={(e) => setProcedure(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LabTestStatus)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Laboratory Name / Vendor
          </label>
          <input
            type="text"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </form>
  );
};