import React from 'react';

const ShellContainer: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 mb-6">{description}</p>
    <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400 text-sm">
      Module interface shell ready for development.
    </div>
  </div>
);

export const PatientTimeline: React.FC = () => (
  <ShellContainer
    title="Activity Timeline"
    description="Chronological log of visits, treatment changes, orders, and interactions."
  />
);

export const PatientVisitNotes: React.FC = () => (
  <ShellContainer
    title="Visit Notes (SOAP)"
    description="Clinical visit histories, objective observations, and clinical assessments."
  />
);

export const PatientTreatmentPlans: React.FC = () => (
  <ShellContainer
    title="Treatment Plans"
    description="Multi-stage procedures, tooth numbers, step tracking, and costs."
  />
);

export const PatientLabTests: React.FC = () => (
  <ShellContainer
    title="Lab Tests"
    description="External lab requisitions, turnaround monitoring, and order statuses."
  />
);

export const PatientPrescriptions: React.FC = () => (
  <ShellContainer
    title="Prescriptions"
    description="Medication histories, dosage instructions, and printable prescription slips."
  />
);

export const PatientDocuments: React.FC = () => (
  <ShellContainer
    title="Patient Documents"
    description="Digital X-rays, laboratory result PDFs, consent forms, and scans."
  />
);