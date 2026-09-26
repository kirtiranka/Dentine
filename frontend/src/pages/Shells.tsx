import React from 'react';
import { useParams } from 'react-router-dom';

export const Dashboard: React.FC = () => <div><h2>Dashboard</h2><p>Overview metrics coming soon.</p></div>;
export const Calendar: React.FC = () => <div><h2>Calendar</h2><p>Appointment scheduler view.</p></div>;
export const LabTests: React.FC = () => <div><h2>Lab Tests</h2><p>External lab test orders.</p></div>;
export const Prescriptions: React.FC = () => <div><h2>Prescriptions</h2><p>Prescription history.</p></div>;
export const Financials: React.FC = () => <div><h2>Financials</h2><p>Invoices and payments.</p></div>;
export const Admin: React.FC = () => <div><h2>Admin</h2><p>Staff and clinic management.</p></div>;

export const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h2>Patient Details</h2>
      <p>Viewing profile for ID: <code>{id}</code></p>
    </div>
  );
};