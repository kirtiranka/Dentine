// App.tsx
import React from 'react';
import { useDentineStore } from '../store/useDentineStore';
import { PatientFinder } from './PatientFinder';
import { CalendarPage } from './CalendarPage';
import { PatientView } from './PatientView';

export const MainPage: React.FC = () => {
  const activeTab = useDentineStore((state) => state.activeTab);
  const setActiveTab = useDentineStore((state) => state.setActiveTab);
  const selectPatient = useDentineStore((state) => state.selectPatient);
  const patientId = useDentineStore((state) => state.selectedPatientId)

  return (
    <div className="flex h-screen flex-col bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Global Topbar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-teal-400">🦷 DENTINE</span>
          <span className="rounded bg-teal-950/80 border border-teal-800/60 px-1.5 py-0.5 text-[10px] font-bold text-teal-300 uppercase">
            EMR
          </span>
        </div>

        <nav className="flex space-x-1">
          <button
            onClick={(): void => {
              selectPatient(null);
              setActiveTab('finder');
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'finder'
                ? 'bg-teal-950/80 text-teal-300 border border-teal-800/60'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            Patients
          </button>
          <button
            onClick={(): void => setActiveTab('calendar')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'calendar'
                ? 'bg-teal-950/80 text-teal-300 border border-teal-800/60'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={(): void => setActiveTab('patient-view')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'patient-view'
                ? 'bg-teal-950/80 text-teal-300 border border-teal-800/60'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            Chart
          </button>
        </nav>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-auto bg-slate-950">
        {activeTab === 'finder' && <PatientFinder />}
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'patient-view' && <PatientView key={patientId}/>}
      </main>
    </div>
  );
};

export default MainPage;