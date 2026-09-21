import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const PatientPage: React.FC = () => {
  const { patientInput, setPatientInput, addPatient, removePatient, patients, clearPatientInput } =
    useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInput.trim()) return;
    addPatient();
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto">
      {/* Action Bar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Patient Registry</h2>
          <p className="text-xs text-zinc-400">Enter a patient name to add them to current queue</p>
        </div>
        <span className="text-[11px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
          Slice: patientSlice
        </span>
      </div>

      {/* Input Card Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Enter Patient Name</span>
              <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded">
                Live Editable
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Type manually or use the Voice Copilot to dictate.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="patient_name" className="block text-xs font-medium text-zinc-400 mb-1">
              Patient Full Name *
            </label>
            <input
              id="patient_name"
              type="text"
              required
              value={patientInput}
              onChange={(e) => setPatientInput(e.target.value)}
              placeholder="e.g. Johnathan Doe"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={clearPatientInput}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Clear
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-950"
            >
              + Add Patient
            </button>
          </div>
        </form>
      </div>

      {/* Displayed Names Below the Textbox */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Registered Patients ({patients.length})
          </h3>
          <span className="text-[11px] text-zinc-500">Live synced to voice state</span>
        </div>

        {patients.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-xs">
            No patient names entered yet. Type a name above or dictate to the Voice Copilot.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-100 text-sm">{patient.name}</h4>
                    <span className="text-[10px] text-zinc-400">Logged at {patient.createdAt}</span>
                  </div>
                </div>

                <button
                  onClick={() => removePatient(patient.id)}
                  className="text-zinc-500 hover:text-rose-400 p-1 rounded transition text-xs"
                  title="Remove entry"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};