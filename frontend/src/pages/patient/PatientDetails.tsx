import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient, PatientDetails as IPatientDetails } from '../../types/patient';
import { useUpdatePatient } from '../../hooks/usePatients';

export const PatientDetails: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm max-w-4xl overflow-hidden">
      {!isEditing ? (
        <PatientView patient={patient} onEdit={() => setIsEditing(true)} />
      ) : (
        <PatientEditForm patient={patient} onCancel={() => setIsEditing(false)} />
      )}
    </div>
  );
};

// ==========================================
// 1. READ-ONLY VIEW (No state, zero cascading renders)
// ==========================================
const PatientView: React.FC<{ patient: Patient; onEdit: () => void }> = ({
  patient,
  onEdit,
}) => {
  const phone = patient.details?.contact?.phone || '—';
  const email = patient.details?.contact?.email || '—';
  const address = patient.details?.address || '—';
  const age = patient.details?.age ? `${patient.details.age} years` : '—';
  const gender = patient.details?.gender ? patient.details.gender : '—';
  const insurance = patient.details?.insurance;
  const alerts = patient.details?.medical_alerts || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Personal & Clinical Details</h3>
          <p className="text-xs text-slate-500">Demographic, contact, and safety alerts</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300 transition-colors"
        >
          Edit Record
        </button>
      </div>

      <div className="space-y-6">
        {/* Demographics */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            General Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <div>
              <span className="block text-xs text-slate-400">Full Name</span>
              <span className="text-sm font-medium text-slate-800">{patient.name}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400">Age</span>
              <span className="text-sm font-medium text-slate-800">{age}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400">Gender</span>
              <span className="text-sm font-medium text-slate-800 capitalize">{gender}</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Contact & Address
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <div>
              <span className="block text-xs text-slate-400">Phone</span>
              <span className="text-sm font-medium text-slate-800">{phone}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400">Email</span>
              <span className="text-sm font-medium text-slate-800">{email}</span>
            </div>
            <div className="md:col-span-2">
              <span className="block text-xs text-slate-400">Address</span>
              <span className="text-sm font-medium text-slate-800">{address}</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-3">
            Medical & Safety Alerts
          </h4>
          <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50">
            {alerts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {alerts.map((alert) => (
                  <span
                    key={alert}
                    className="bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {alert.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400">No medical alerts recorded for this patient.</span>
            )}
          </div>
        </div>

        {/* Insurance */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Insurance Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <div>
              <span className="block text-xs text-slate-400">Provider</span>
              <span className="text-sm font-medium text-slate-800">
                {insurance?.provider || 'Self-pay / Uninsured'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-400">Policy Number</span>
              <span className="text-sm font-medium text-slate-800">
                {insurance?.policy_number || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. EDIT FORM (Initializes state on mount, no useEffect)
// ==========================================
const PatientEditForm: React.FC<{ patient: Patient; onCancel: () => void }> = ({
  patient,
  onCancel,
}) => {
  const updatePatientMutation = useUpdatePatient();

  // Initialize state directly from patient prop once on mount
  const [name, setName] = useState(patient.name);
  const [phone, setPhone] = useState(patient.details?.contact?.phone || '');
  const [email, setEmail] = useState(patient.details?.contact?.email || '');
  const [address, setAddress] = useState(patient.details?.address || '');
  const [age, setAge] = useState<number | ''>(patient.details?.age ?? '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(
    patient.details?.gender || ''
  );
  const [insuranceProvider, setInsuranceProvider] = useState(
    patient.details?.insurance?.provider || ''
  );
  const [policyNumber, setPolicyNumber] = useState(
    patient.details?.insurance?.policy_number || ''
  );
  const [alerts, setAlerts] = useState<string[]>(patient.details?.medical_alerts || []);
  const [newAlertInput, setNewAlertInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddAlert = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const formatted = newAlertInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (formatted && !alerts.includes(formatted)) {
      setAlerts([...alerts, formatted]);
      setNewAlertInput('');
    }
  };

  const handleRemoveAlert = (target: string) => {
    setAlerts(alerts.filter((a) => a !== target));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const updatedDetails: IPatientDetails = {
      ...patient.details,
      address,
      gender: gender ? gender : undefined,
      age: age !== '' ? Number(age) : undefined,
      contact: { phone, email },
      insurance: insuranceProvider
        ? { provider: insuranceProvider, policy_number: policyNumber }
        : null,
      medical_alerts: alerts,
    };

    try {
      await updatePatientMutation.mutateAsync({
        id: patient.id,
        name,
        details: updatedDetails,
      });
      onCancel(); // Return to view mode
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update patient');
    }
  };

  return (
    <form onSubmit={handleSave} className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Editing Patient Record</h3>
          <p className="text-xs text-slate-500">Update personal, demographic, or clinical notes</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md border border-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updatePatientMutation.isPending}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:opacity-50 transition-colors"
          >
            {updatePatientMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs bg-red-50 text-red-700 rounded-md border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Demographics */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          General Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">Unspecified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Contact & Address
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Residential Address</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-3">
          Medical & Safety Alerts
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {alerts.map((alert) => (
            <span
              key={alert}
              className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium"
            >
              {alert.replace(/_/g, ' ')}
              <button
                type="button"
                onClick={() => handleRemoveAlert(alert)}
                className="hover:text-red-900 font-bold ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 max-w-sm">
          <input
            type="text"
            placeholder="e.g. penicillin_allergy"
            value={newAlertInput}
            onChange={(e) => setNewAlertInput(e.target.value)}
            onKeyDown={handleAddAlert}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-md flex-1 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddAlert}
            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300"
          >
            Add Alert
          </button>
        </div>
      </div>

      {/* Insurance */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Insurance Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Provider Name</label>
            <input
              type="text"
              value={insuranceProvider}
              placeholder="e.g. Star Health"
              onChange={(e) => setInsuranceProvider(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Policy / Member Number</label>
            <input
              type="text"
              value={policyNumber}
              placeholder="e.g. POL-892102"
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
};