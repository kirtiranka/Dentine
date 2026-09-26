import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LabTest, LabTestStatus } from '../types/labTest';
import {
  useAllLabTests,
  useCreateGlobalLabTest,
  useUpdateGlobalLabTest,
} from '../hooks/useAllLabTests';
import { usePatients } from '../hooks/usePatients';

type FilterTab = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

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

export const LabTests: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);

  const { data: labTests, isLoading, isError, error } = useAllLabTests(searchTerm);
  const updateMutation = useUpdateGlobalLabTest();

  // Apply tab filters and client-side patient name matching
  const filteredTests = labTests?.filter((test) => {
    const matchesTab = activeTab === 'all' || test.status === activeTab;
    const matchesPatientName = test.patient?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesQuery =
      searchTerm === '' ||
      test.procedure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (test.lab_name && test.lab_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      matchesPatientName;

    return matchesTab && matchesQuery;
  });

  const counts = {
    all: labTests?.length || 0,
    pending: labTests?.filter((t) => t.status === 'pending').length || 0,
    in_progress: labTests?.filter((t) => t.status === 'in_progress').length || 0,
    completed: labTests?.filter((t) => t.status === 'completed').length || 0,
    cancelled: labTests?.filter((t) => t.status === 'cancelled').length || 0,
  };

  const handleQuickStatusChange = (testId: string, newStatus: LabTestStatus) => {
    updateMutation.mutate({ id: testId, status: newStatus });
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Lab Orders</h1>
          <p className="mt-1 text-slate-500 text-sm">
            Track external laboratory prosthetics, CAD/CAM fabrications, and diagnostics.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
        >
          + New Lab Order
        </button>
      </div>

      {/* Controls: Search and Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by procedure, vendor, or patient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-xs px-3.5 py-2 text-sm border border-slate-300 rounded-md outline-none bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'in_progress', label: 'In Progress', count: counts.in_progress },
              { id: 'completed', label: 'Completed', count: counts.completed },
              { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {isLoading && (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading clinic lab requisitions...
          </div>
        )}

        {isError && (
          <div className="p-6 text-red-700 bg-red-50 text-sm">
            Failed to load lab tests: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && filteredTests?.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            No lab orders found matching current filters.
          </div>
        )}

        {!isLoading && !isError && filteredTests && filteredTests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Procedure / Test</th>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Lab Vendor</th>
                  <th className="px-4 py-3 font-semibold">Date Ordered</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.map((test) => {
                  const badge = statusConfig[test.status] || statusConfig.pending;
                  const dateStr = new Date(test.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={test.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Procedure */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {test.procedure}
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3.5 text-slate-700">
                        {test.patient ? (
                          <Link
                            to={`/patients/${test.patient.id}/lab-tests`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {test.patient.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Lab Name */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {test.lab_name || <span className="text-slate-400 italic">In-house</span>}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {dateStr}
                      </td>

                      {/* Status / Quick Switch */}
                      <td className="px-4 py-3.5">
                        <select
                          value={test.status}
                          onChange={(e) =>
                            handleQuickStatusChange(test.id, e.target.value as LabTestStatus)
                          }
                          disabled={updateMutation.isPending}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium outline-none focus:ring-1 focus:ring-blue-500 ${badge.badgeClass}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Edit Button */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingTest(test)}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded text-xs font-medium text-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <CreateLabOrderModal onClose={() => setIsModalOpen(false)} />
      )}

      {/* Edit Order Modal */}
      {editingTest && (
        <EditLabOrderModal test={editingTest} onClose={() => setEditingTest(null)} />
      )}
    </div>
  );
};

// ============================================================================
// MODAL: Create Lab Order (With Patient Selection)
// ============================================================================
const CreateLabOrderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  const createMutation = useCreateGlobalLabTest();

  const [patientId, setPatientId] = useState('');
  const [procedure, setProcedure] = useState('');
  const [labName, setLabName] = useState('');
  const [status, setStatus] = useState<LabTestStatus>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!patientId) {
      setErrorMsg('Please select a patient.');
      return;
    }

    if (!procedure.trim()) {
      setErrorMsg('Please specify the procedure.');
      return;
    }

    const selectedPatient = patients?.find((p) => p.id === patientId);
    if (!selectedPatient) {
      setErrorMsg('Invalid patient selected.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        clinicId: selectedPatient.clinic_id,
        patientId,
        procedure: procedure.trim(),
        labName: labName.trim() || null,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create lab order');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Create New Lab Order</h3>
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

          {/* Procedure */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procedure / Work Ordered
            </label>
            <input
              type="text"
              placeholder="e.g. Zirconia Crown CAD/CAM (#46)"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Lab Vendor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lab Vendor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Precision Dental Lab"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LabTestStatus)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
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
              {createMutation.isPending ? 'Ordering...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: Edit Lab Order
// ============================================================================
const EditLabOrderModal: React.FC<{
  test: LabTest;
  onClose: () => void;
}> = ({ test, onClose }) => {
  const updateMutation = useUpdateGlobalLabTest();

  // Initialize form state directly from props on mount (no useEffect)
  const [procedure, setProcedure] = useState(test.procedure);
  const [labName, setLabName] = useState(test.lab_name || '');
  const [status, setStatus] = useState<LabTestStatus>(test.status);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!procedure.trim()) {
      setErrorMsg('Procedure cannot be empty.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: test.id,
        procedure: procedure.trim(),
        labName: labName.trim() || null,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Lab Order</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Patient: <strong className="text-slate-700">{test.patient?.name || 'Unassigned'}</strong>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procedure / Work Ordered
            </label>
            <input
              type="text"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lab Vendor Name
              </label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LabTestStatus)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
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