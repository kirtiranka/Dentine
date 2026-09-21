import React from 'react';
import { useEmrStore } from '../store/useEmrStore';
import type { Gender } from '../types';

export const MainPage: React.FC = () => {
  const {
    previousVisits,
    isNewVisitOpen,
    toggleNewVisit,
    formData,
    updateFormField,
    resetForm,
    submitCurrentVisit,
    toggleChatModal,
  } = useEmrStore();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCurrentVisit();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Navbar */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🦷</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">DentEMR Studio</h1>
            </div>
            <p className="text-sm text-zinc-400 mt-0.5">Voice-Activated Clinical Charting & Visit Records</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleChatModal(true)}
              className="flex items-center space-x-2 bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-teal-950/40 border border-teal-400/20"
            >
              <span className="text-base">🎙️</span>
              <span>Voice Copilot</span>
            </button>
          </div>
        </header>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-200">Patient Encounters</h2>
          <button
            onClick={() => toggleNewVisit()}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center space-x-2 ${
              isNewVisitOpen
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40'
            }`}
          >
            <span>{isNewVisitOpen ? '✕ Close Form' : '+ New Visit'}</span>
          </button>
        </div>

        {/* INLINE NEW VISIT FORM (Collapsible on page, not modal) */}
        {isNewVisitOpen && (
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 to-teal-400" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Today's Visit Chart</span>
                  <span className="text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                    Voice Fillable
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Dictate patient complaints or fill manually below. Fields update in real-time.
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Patient Name *</label>
                  <input
                    id="patient_name"
                    type="text"
                    required
                    value={formData.patient_name}
                    onChange={(e) => updateFormField('patient_name', e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Patient Gender */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Gender</label>
                  <select
                    id="patient_gender"
                    value={formData.patient_gender}
                    onChange={(e) => updateFormField('patient_gender', e.target.value as Gender)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="transgender">Transgender</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Date of Birth</label>
                  <input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => updateFormField('dob', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Patient Complaint */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Chief Complaint</label>
                <textarea
                  id="patient_complaint"
                  rows={3}
                  value={formData.patient_complaint}
                  onChange={(e) => updateFormField('patient_complaint', e.target.value)}
                  placeholder="Describe reported symptoms, location, duration, and pain level..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Clinical Treatment Plan</label>
                <textarea
                  id="treatment_plan"
                  rows={3}
                  value={formData.treatment_plan}
                  onChange={(e) => updateFormField('treatment_plan', e.target.value)}
                  placeholder="Planned procedures, prescriptions, restorative materials, follow-ups..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              {/* Form Controls */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950"
                >
                  Save Encounter
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Previous Visits Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Previous Visits History ({previousVisits.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previousVisits.map((visit) => (
              <div
                key={visit.id}
                className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-zinc-100 text-base">{visit.patientName}</h4>
                    <span className="text-xs text-zinc-400 capitalize">
                      {visit.patientGender} • DOB: {visit.dob}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-zinc-800 rounded-full font-mono text-zinc-400 border border-zinc-700">
                    {visit.visitDate}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 pt-2 border-t border-zinc-800/80">
                  <div>
                    <span className="font-medium text-emerald-400">Chief Complaint:</span>
                    <p className="text-zinc-300 mt-0.5 leading-relaxed">{visit.complaint || 'None recorded'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-teal-400">Treatment Plan:</span>
                    <p className="text-zinc-300 mt-0.5 leading-relaxed">{visit.treatmentPlan || 'None recorded'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};