import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import type {
  Prescription,
  PrescriptionDetails,
  PrescriptionItem,
} from '../../types/prescription';
import {
  usePrescriptions,
  useCreatePrescription,
  useUpdatePrescription,
} from '../../hooks/usePrescriptions';

export const PatientPrescriptions: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const [isCreating, setIsCreating] = useState(false);
  const { data: prescriptions, isLoading, isError, error } = usePrescriptions(patient.id);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Prescriptions</h2>
          <p className="text-xs text-slate-500">
            Write structured medication orders, dosing schedules, and patient instructions.
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          >
            + New Prescription
          </button>
        )}
      </div>

      {/* New Prescription Form Card */}
      {isCreating && (
        <CreatePrescriptionCard patient={patient} onClose={() => setIsCreating(false)} />
      )}

      {/* Historical Prescriptions List */}
      <div className="space-y-6">
        {isLoading && (
          <div className="bg-white p-8 text-center text-sm text-slate-400 rounded-lg border border-slate-200">
            Loading prescriptions...
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
            Failed to load prescriptions: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && prescriptions?.length === 0 && !isCreating && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-sm font-medium text-slate-700">No prescriptions found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              There are no recorded medication slips for this patient yet.
            </p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Write First Prescription
            </button>
          </div>
        )}

        {prescriptions?.map((prescription) => (
          <HistoricalPrescriptionCard
            key={prescription.id}
            prescription={prescription}
            patient={patient}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: New Prescription Card (Multi-medication Builder)
// ============================================================================
const CreatePrescriptionCard: React.FC<{
  patient: Patient;
  onClose: () => void;
}> = ({ patient, onClose }) => {
  const createMutation = useCreatePrescription(patient.id);

  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      duration_days: number | '';
      instructions: string;
    }>
  >([
    {
      id: crypto.randomUUID(),
      name: '',
      dosage: '',
      frequency: '1-0-1',
      duration_days: 5,
      instructions: 'After food',
    },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: '',
        dosage: '',
        frequency: '1-0-1',
        duration_days: 5,
        instructions: 'After food',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formattedItems: PrescriptionItem[] = items
      .filter((item) => item.name.trim() !== '')
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        dosage: item.dosage.trim() || 'As directed',
        frequency: item.frequency.trim(),
        duration_days: typeof item.duration_days === 'number' ? item.duration_days : 1,
        instructions: item.instructions.trim(),
      }));

    if (formattedItems.length === 0) {
      setErrorMsg('Please specify at least one medication name.');
      return;
    }

    const details: PrescriptionDetails = {
      prescriptions: formattedItems,
      notes: notes.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync({
        clinicId: patient.clinic_id,
        doctorId: null,
        details,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save prescription');
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 shadow-md p-6">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          New Prescription
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
        <div>
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Medications List
          </span>
          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md items-center"
              >
                {/* Drug Name */}
                <div className="md:col-span-4">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold md:hidden mb-0.5">
                    Medicine
                  </label>
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Dosage */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold md:hidden mb-0.5">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="Dosage (1 cap)"
                    value={item.dosage}
                    onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Frequency */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold md:hidden mb-0.5">
                    Frequency
                  </label>
                  <input
                    type="text"
                    placeholder="Freq (1-0-1 / TID)"
                    value={item.frequency}
                    onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Duration */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold md:hidden mb-0.5">
                    Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Days"
                    value={item.duration_days}
                    onChange={(e) =>
                      handleItemChange(
                        idx,
                        'duration_days',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Instructions */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold md:hidden mb-0.5">
                    Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. After food"
                    value={item.instructions}
                    onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Delete */}
                <div className="md:col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={items.length === 1}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItemRow}
            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            + Add Another Medicine
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            General Dietary or Clinical Advice
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Drink warm fluids, avoid chewing on right side for 48 hours..."
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
            {createMutation.isPending ? 'Saving...' : 'Issue Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// COMPONENT: Historical Prescription Card (View vs Edit Controller)
// ============================================================================
const HistoricalPrescriptionCard: React.FC<{
  prescription: Prescription;
  patient: Patient;
}> = ({ prescription, patient }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {!isEditing ? (
        <PrescriptionView
          prescription={prescription}
          patient={patient}
          onEdit={() => setIsEditing(true)}
        />
      ) : (
        <PrescriptionEditForm
          prescription={prescription}
          patientId={patient.id}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Prescription View Mode (Clean Slip Layout)
// ============================================================================
const PrescriptionView: React.FC<{
  prescription: Prescription;
  patient: Patient;
  onEdit: () => void;
}> = ({ prescription, onEdit }) => {
  const items = prescription.details?.prescriptions || [];
  const createdDate = new Date(prescription.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="p-6">
      {/* Rx Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-serif font-bold text-blue-700 italic">Rx</span>
            <span className="text-sm font-semibold text-slate-800">
              Prescription Slip
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Issued: {createdDate}</span>
            {prescription.doctor?.name && (
              <>
                <span>•</span>
                <span>Doctor: {prescription.doctor.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
          >
            🖨 Print Slip
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Medication Pad Table */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-3">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th className="py-2.5 px-3 font-semibold w-10">#</th>
              <th className="py-2.5 px-3 font-semibold">Medication</th>
              <th className="py-2.5 px-3 font-semibold">Dosage</th>
              <th className="py-2.5 px-3 font-semibold">Frequency</th>
              <th className="py-2.5 px-3 font-semibold">Duration</th>
              <th className="py-2.5 px-3 font-semibold">Instructions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((med, idx) => (
              <tr key={med.id || idx} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">{med.name}</td>
                <td className="py-2.5 px-3 text-slate-700">{med.dosage}</td>
                <td className="py-2.5 px-3">
                  <span className="bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded text-[11px] font-medium">
                    {med.frequency}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-700 font-medium">
                  {med.duration_days} {med.duration_days === 1 ? 'day' : 'days'}
                </td>
                <td className="py-2.5 px-3 text-slate-500 italic">
                  {med.instructions || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {prescription.details?.notes && (
        <div className="text-xs bg-slate-50 p-3 rounded border border-slate-100 text-slate-600">
          <strong className="text-slate-700 block mb-0.5">Doctor's Advice:</strong>
          {prescription.details.notes}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Prescription Edit Form
// ============================================================================
const PrescriptionEditForm: React.FC<{
  prescription: Prescription;
  patientId: string;
  onCancel: () => void;
}> = ({ prescription, patientId, onCancel }) => {
  const updateMutation = useUpdatePrescription(patientId);

  // Initialized directly from props on mount (no useEffect)
  const [notes, setNotes] = useState(prescription.details?.notes || '');
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      duration_days: number | '';
      instructions: string;
    }>
  >(
    (prescription.details?.prescriptions || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      duration_days: item.duration_days,
      instructions: item.instructions || '',
    }))
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: '',
        dosage: '',
        frequency: '1-0-1',
        duration_days: 5,
        instructions: 'After food',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formattedItems: PrescriptionItem[] = items
      .filter((item) => item.name.trim() !== '')
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        dosage: item.dosage.trim() || 'As directed',
        frequency: item.frequency.trim(),
        duration_days: typeof item.duration_days === 'number' ? item.duration_days : 1,
        instructions: item.instructions.trim(),
      }));

    if (formattedItems.length === 0) {
      setErrorMsg('Please specify at least one medication.');
      return;
    }

    const updatedDetails: PrescriptionDetails = {
      prescriptions: formattedItems,
      notes: notes.trim() || undefined,
    };

    try {
      await updateMutation.mutateAsync({
        id: prescription.id,
        details: updatedDetails,
      });
      onCancel();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update prescription');
    }
  };

  return (
    <form onSubmit={handleUpdate} className="p-6 bg-slate-50/50 space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Edit Prescription
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

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Medications</label>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2.5 bg-white border border-slate-200 rounded-md items-center"
            >
              <div className="md:col-span-4">
                <input
                  type="text"
                  placeholder="Medicine Name"
                  value={item.name}
                  onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                  className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Dosage"
                  value={item.dosage}
                  onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                  className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Frequency"
                  value={item.frequency}
                  onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                  className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-1">
                <input
                  type="number"
                  min="1"
                  placeholder="Days"
                  value={item.duration_days}
                  onChange={(e) =>
                    handleItemChange(
                      idx,
                      'duration_days',
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Instructions"
                  value={item.instructions}
                  onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                  className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => handleRemoveItemRow(idx)}
                  disabled={items.length === 1}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddItemRow}
          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          + Add Medication
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor's Advice</label>
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