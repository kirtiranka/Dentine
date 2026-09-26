import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Prescription, PrescriptionDetails, PrescriptionItem } from '../types/prescription';
import {
  useAllPrescriptions,
  useCreateGlobalPrescription,
  useUpdateGlobalPrescription,
} from '../hooks/useAllPrescriptions';
import { usePatients } from '../hooks/usePatients';

export const Prescriptions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingRx, setViewingRx] = useState<Prescription | null>(null);
  const [editingRx, setEditingRx] = useState<Prescription | null>(null);

  const { data: prescriptions, isLoading, isError, error } = useAllPrescriptions(searchTerm);

  // Client-side filtering matching patient name, medication name, or doctor name
  const filteredPrescriptions = prescriptions?.filter((rx) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();

    const matchesPatient = rx.patient?.name?.toLowerCase().includes(query);
    const matchesDoctor = rx.doctor?.name?.toLowerCase().includes(query);
    const matchesMeds = rx.details?.prescriptions?.some((item) =>
      item.name.toLowerCase().includes(query)
    );

    return matchesPatient || matchesDoctor || matchesMeds;
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Prescriptions</h1>
          <p className="mt-1 text-slate-500 text-sm">
            Review clinic-wide medication orders, dosage regimens, and print prescription slips.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
        >
          + Issue Prescription
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by patient, medicine (e.g. Amoxicillin), or doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3.5 py-2 text-sm border border-slate-300 rounded-md outline-none bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {filteredPrescriptions?.length || 0} Prescriptions Recorded
        </span>
      </div>

      {/* Table Data View */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {isLoading && (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading prescription history...
          </div>
        )}

        {isError && (
          <div className="p-6 text-red-700 bg-red-50 text-sm">
            Failed to load prescriptions: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && filteredPrescriptions?.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            No prescriptions found matching "{searchTerm}".
          </div>
        )}

        {!isLoading && !isError && filteredPrescriptions && filteredPrescriptions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Date Issued</th>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Medications Summary</th>
                  <th className="px-4 py-3 font-semibold">Prescribing Doctor</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.map((rx) => {
                  const meds = rx.details?.prescriptions || [];
                  const dateStr = new Date(rx.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={rx.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3.5 text-slate-800">
                        {rx.patient ? (
                          <div>
                            <Link
                              to={`/patients/${rx.patient.id}/prescriptions`}
                              className="font-semibold text-blue-600 hover:underline block"
                            >
                              {rx.patient.name}
                            </Link>
                            {rx.patient.details?.contact?.phone && (
                              <span className="text-[11px] text-slate-400">
                                {rx.patient.details.contact.phone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Medications */}
                      <td className="px-4 py-3.5">
                        {meds.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-lg">
                            {meds.map((med, i) => (
                              <span
                                key={med.id || i}
                                className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded font-medium"
                              >
                                <strong className="text-slate-900">{med.name}</strong>{' '}
                                <span className="text-slate-500 font-normal">
                                  ({med.dosage}, {med.frequency})
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">No items listed</span>
                        )}
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                        {rx.doctor?.name || <span className="text-slate-400 italic">Unspecified</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingRx(rx)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                          >
                            Slip / Print
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRx(rx)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded text-xs font-medium text-slate-700 transition-colors"
                          >
                            Edit
                          </button>
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

      {/* Modal: Create Prescription */}
      {isCreateOpen && (
        <CreatePrescriptionModal onClose={() => setIsCreateOpen(false)} />
      )}

      {/* Modal: View & Print Slip */}
      {viewingRx && (
        <PrescriptionSlipModal rx={viewingRx} onClose={() => setViewingRx(null)} />
      )}

      {/* Modal: Edit Prescription */}
      {editingRx && (
        <EditPrescriptionModal rx={editingRx} onClose={() => setEditingRx(null)} />
      )}
    </div>
  );
};

// ============================================================================
// MODAL: Create Prescription (With Patient Selector & Drug Builder)
// ============================================================================
const CreatePrescriptionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  const createMutation = useCreateGlobalPrescription();

  const [patientId, setPatientId] = useState('');
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
      dosage: '500mg',
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
        duration_days: 3,
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

    if (!patientId) {
      setErrorMsg('Please select a patient.');
      return;
    }

    const selectedPatient = patients?.find((p) => p.id === patientId);
    if (!selectedPatient) {
      setErrorMsg('Invalid patient selected.');
      return;
    }

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
      setErrorMsg('Please add at least one valid medication.');
      return;
    }

    const details: PrescriptionDetails = {
      prescriptions: formattedItems,
      notes: notes.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync({
        clinicId: selectedPatient.clinic_id,
        patientId,
        doctorId: null,
        details,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to issue prescription');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Issue New Prescription</h3>
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
          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Patient
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Patient --</option>
              {isLoadingPatients && <option disabled>Loading patients...</option>}
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.details?.contact?.phone ? `(${p.details.contact.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Medications Form */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Medication Items
            </label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded items-center"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={item.dosage}
                      onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Freq (1-0-1)"
                      value={item.frequency}
                      onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-1">
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
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Instructions"
                      value={item.instructions}
                      onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={items.length === 1}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30 text-sm font-bold"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              General Advice / Dietary Warnings
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Take after meals, plenty of hydration..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
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
              disabled={createMutation.isPending}
              className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? 'Issuing...' : 'Issue Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: Printable Prescription Pad
// ============================================================================
const PrescriptionSlipModal: React.FC<{
  rx: Prescription;
  onClose: () => void;
}> = ({ rx, onClose }) => {
  const items = rx.details?.prescriptions || [];
  const dateFormatted = new Date(rx.created_at).toLocaleDateString('en-US', {
    dateStyle: 'medium',
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
        {/* Prescription Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">CLINICAL PRESCRIPTION</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctor: <strong className="text-slate-800">{rx.doctor?.name || 'Primary Physician'}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">Date: {dateFormatted}</span>
            <span className="text-xs text-slate-400 block font-mono">Rx ID: #{rx.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Patient Metadata */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block">Patient Name</span>
            <strong className="text-slate-900 text-sm">{rx.patient?.name || 'Unassigned'}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Contact Phone</span>
            <strong className="text-slate-700">{rx.patient?.details?.contact?.phone || '—'}</strong>
          </div>
        </div>

        {/* Prescription Pad / Medicines */}
        <div>
          <div className="text-2xl font-serif font-bold text-blue-700 italic mb-2">Rx</div>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-2 px-1">#</th>
                <th className="py-2 px-2">Medication</th>
                <th className="py-2 px-2">Dosage</th>
                <th className="py-2 px-2">Frequency</th>
                <th className="py-2 px-2">Duration</th>
                <th className="py-2 px-2">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((med, idx) => (
                <tr key={med.id || idx}>
                  <td className="py-3 px-1 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-2 font-bold text-slate-900">{med.name}</td>
                  <td className="py-3 px-2 text-slate-700">{med.dosage}</td>
                  <td className="py-3 px-2 font-mono text-slate-800">{med.frequency}</td>
                  <td className="py-3 px-2 text-slate-700">{med.duration_days} days</td>
                  <td className="py-3 px-2 text-slate-500 italic">{med.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rx.details?.notes && (
          <div className="bg-amber-50/60 p-3 rounded border border-amber-200 text-xs text-amber-900">
            <strong>Advisory Notes:</strong> {rx.details.notes}
          </div>
        )}

        {/* Doctor Signature Line */}
        <div className="pt-8 flex justify-between items-end border-t border-slate-200">
          <div className="text-[11px] text-slate-400">
            Generated via Clinic OS EMR
          </div>
          <div className="text-center w-48 border-t border-slate-400 pt-1">
            <span className="text-xs text-slate-700 font-medium block">Authorized Signature</span>
          </div>
        </div>

        {/* Action Controls (Hidden during browser printing) */}
        <div className="flex justify-end gap-2 pt-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold shadow-sm"
          >
            🖨 Print Prescription Slip
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: Edit Prescription
// ============================================================================
const EditPrescriptionModal: React.FC<{
  rx: Prescription;
  onClose: () => void;
}> = ({ rx, onClose }) => {
  const updateMutation = useUpdateGlobalPrescription();

  // Initialize directly from props on mount (no useEffect)
  const [notes, setNotes] = useState(rx.details?.notes || '');
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
    (rx.details?.prescriptions || []).map((med) => ({
      id: med.id || crypto.randomUUID(),
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration_days: med.duration_days,
      instructions: med.instructions || '',
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
        duration_days: 3,
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
      setErrorMsg('Please keep at least one valid medication.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: rx.id,
        details: {
          prescriptions: formattedItems,
          notes: notes.trim() || undefined,
        },
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update prescription');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Prescription</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Patient: <strong className="text-slate-700">{rx.patient?.name || 'Unassigned'}</strong>
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

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded items-center"
              >
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={item.dosage}
                    onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Freq"
                    value={item.frequency}
                    onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-1">
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
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Instructions"
                    value={item.instructions}
                    onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={items.length === 1}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-30 text-sm font-bold"
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
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            + Add Medication
          </button>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              General Advice
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
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
              disabled={updateMutation.isPending}
              className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};