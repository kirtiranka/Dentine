import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Layout } from './components/Layout';
import { AllPatients } from './pages/AllPatients';
import {
  Dashboard,
  Calendar,
  Financials,
  Admin,
  // PatientProfile,
} from './pages/Shells';
import { LabTests } from './pages/LabTests';
import { Prescriptions } from './pages/Prescriptions';
import { PatientPage } from './pages/PatientPage';
import { PatientDetails } from './pages/patient/PatientDetails';
import { PatientVisitNotes } from './pages/patient/PatientVisitNotes';
import { PatientTreatmentPlans } from './pages/patient/PatientTreatmentPlans';
import { PatientLabTests } from './pages/patient/PatientLabTests';
import { PatientPrescriptions } from './pages/patient/PatientPrescriptions';
import { PatientDocuments } from './pages/patient/PatientDocuments';
import { PatientTimeline} from './pages/patient/PatientSubPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data "fresh" for 1-2 minutes before triggering background refetches
      staleTime: 1000 * 60 * 5, // 2 minutes

      // Keep unused data in memory for 15 minutes
      gcTime: 1000 * 60 * 15,

      // Disable refetching on window focus (often annoying in desktop workflows)
      refetchOnWindowFocus: false,

      // Retry once instead of three times for faster UI error feedback
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="patients" element={<AllPatients />} />
            <Route path="patients/:id" element={<PatientPage />} >
              <Route index element={<Navigate to="details" replace />} />
              <Route path="details" element={<PatientDetails />} />
              <Route path="timeline" element={<PatientTimeline />} />
              <Route path="visit-notes" element={<PatientVisitNotes />} />
              <Route path="treatment-plans" element={<PatientTreatmentPlans />} />
              <Route path="lab-tests" element={<PatientLabTests />} />
              <Route path="prescriptions" element={<PatientPrescriptions />} />
              <Route path="documents" element={<PatientDocuments />} />
            </Route>
            <Route path="lab-tests" element={<LabTests />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="financials" element={<Financials />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}