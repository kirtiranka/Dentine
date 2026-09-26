import React from 'react';
import { useParams, NavLink, Outlet, Link } from 'react-router-dom';
import { usePatient } from '../hooks/usePatients';

const patientTabs = [
  { label: 'Details', path: 'details' },
  { label: 'Timeline', path: 'timeline' },
  { label: 'Visit Notes', path: 'visit-notes' },
  { label: 'Treatment Plans', path: 'treatment-plans' },
  { label: 'Lab Tests', path: 'lab-tests' },
  { label: 'Prescriptions', path: 'prescriptions' },
  { label: 'Documents', path: 'documents' },
];

export const PatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading, isError, error } = usePatient(id);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-slate-500 text-sm">
        Loading patient profile...
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
          {error instanceof Error ? error.message : 'Patient not found'}
        </div>
        <Link to="/patients" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
          ← Return to All Patients
        </Link>
      </div>
    );
  }

  const phone = patient.details?.contact?.phone || 'No phone recorded';
  const age = patient.details?.age ? `${patient.details.age} yrs` : '';
  const gender = patient.details?.gender ? `(${patient.details.gender})` : '';
  const alerts = patient.details?.medical_alerts || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Summary Header */}
      <div>
        <Link
          to="/patients"
          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors inline-block mb-3"
        >
          ← Back to Patient Directory
        </Link>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
              <span className="text-sm font-medium text-slate-400">
                {[age, gender].filter(Boolean).join(' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Contact: <span className="text-slate-700 font-medium">{phone}</span> | ID:{' '}
              <span className="font-mono text-slate-400">{patient.id.slice(0, 8)}</span>
            </p>
          </div>

          {/* Quick-glance medical alert tags */}
          {alerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {alerts.map((alert, i) => (
                <span
                  key={i}
                  className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
                >
                  ⚠ {alert.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sub-page Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto">
          {patientTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `pb-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sub-page Content Outlet */}
      <div>
        <Outlet context={{ patient }} />
      </div>
    </div>
  );
};