import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import type { VisitNote, VisitNoteDetails } from '../../types/visitNote';
import {
  useVisitNotes,
  useCreateVisitNote,
  useUpdateVisitNote,
} from '../../hooks/useVisitNotes';

export const PatientVisitNotes: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const [isCreating, setIsCreating] = useState(false);
  const { data: notes, isLoading, isError, error } = useVisitNotes(patient.id);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Clinical Visit Notes</h2>
          <p className="text-xs text-slate-500">
            Document findings, diagnoses, and treatment plans using the SOAP format.
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          >
            + Add Visit Note
          </button>
        )}
      </div>

      {/* New Note Composer */}
      {isCreating && (
        <CreateNoteCard
          patient={patient}
          onClose={() => setIsCreating(false)}
        />
      )}

      {/* Historical Notes Feed */}
      <div className="space-y-4">
        {isLoading && (
          <div className="bg-white p-8 text-center text-sm text-slate-400 rounded-lg border border-slate-200">
            Loading clinical notes...
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
            Failed to load clinical notes: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && notes?.length === 0 && !isCreating && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-sm font-medium text-slate-700">No visit notes found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              There are no recorded clinical encounters for this patient yet.
            </p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Write First Note
            </button>
          </div>
        )}

        {notes?.map((note) => (
          <HistoricalNoteCard key={note.id} note={note} patientId={patient.id} />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: New Visit Note Creator
// ============================================================================
const CreateNoteCard: React.FC<{
  patient: Patient;
  onClose: () => void;
}> = ({ patient, onClose }) => {
  const createMutation = useCreateVisitNote(patient.id);

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, ] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const details: VisitNoteDetails = {
      chief_complaint: chiefComplaint.trim() || undefined,
      subjective: subjective.trim() || undefined,
      objective: objective.trim() || undefined,
      assessment: assessment.trim() || undefined,
      plan: plan.trim() || undefined,
      vitals: bp || pulse !== '' ? { blood_pressure: bp || undefined, pulse_bpm: pulse !== '' ? Number(pulse) : undefined } : undefined,
    };

    try {
      await createMutation.mutateAsync({
        clinicId: patient.clinic_id,
        doctorId: null, // Replace with authenticated doctor ID when auth is integrated
        details,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating visit note');
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 shadow-md p-6">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          New Clinical Note
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs font-medium"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chief Complaint & Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Chief Complaint
            </label>
            <input
              type="text"
              placeholder="e.g. Pain in lower right jaw on chewing"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Blood Pressure
            </label>
            <input
              type="text"
              placeholder="e.g. 120/80"
              value={bp}
              onChange={(e) => setBp(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* SOAP Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">
              S — Subjective (Symptoms & History)
            </label>
            <textarea
              rows={3}
              placeholder="Patient quotes, pain severity (1-10), duration, triggers..."
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-700 mb-1">
              O — Objective (Clinical Observations)
            </label>
            <textarea
              rows={3}
              placeholder="Visual inspection, percussion test, probing depths, palpation..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-700 mb-1">
              A — Assessment (Diagnosis)
            </label>
            <textarea
              rows={3}
              placeholder="Primary diagnostic impression, status changes..."
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-700 mb-1">
              P — Plan (Actions & Follow-up)
            </label>
            <textarea
              rows={3}
              placeholder="Procedures conducted today, medications prescribed, advice..."
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
          >
            {createMutation.isPending ? 'Saving...' : 'Save Clinical Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// COMPONENT: Historical Note Wrapper (Handles View vs Edit toggle)
// ============================================================================
const HistoricalNoteCard: React.FC<{
  note: VisitNote;
  patientId: string;
}> = ({ note, patientId }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all">
      {!isEditing ? (
        <NoteView note={note} onEdit={() => setIsEditing(true)} />
      ) : (
        <NoteEditForm
          note={note}
          patientId={patientId}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Note View Mode
// ============================================================================
const NoteView: React.FC<{
  note: VisitNote;
  onEdit: () => void;
}> = ({ note, onEdit }) => {
  const createdFormatted = new Date(note.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const updatedFormatted = new Date(note.updated_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const isEdited = note.updated_at !== note.created_at;

  const { details } = note;
  const vitals = details?.vitals;

  return (
    <div className="p-5">
      {/* Note Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              {details.chief_complaint || 'Clinical Examination'}
            </span>
            {vitals?.blood_pressure && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-mono">
                BP: {vitals.blood_pressure}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Encounter: {createdFormatted}</span>
            {note.doctor?.name && (
              <>
                <span>•</span>
                <span>Doctor: {note.doctor.name}</span>
              </>
            )}
            {isEdited && (
              <>
                <span>•</span>
                <span className="italic text-slate-400">Edited {updatedFormatted}</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
        >
          Edit Note
        </button>
      </div>

      {/* SOAP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        <div className="bg-slate-50/60 p-3 rounded border border-slate-100">
          <span className="font-bold text-blue-700 block mb-1">Subjective (S)</span>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {details.subjective || <span className="text-slate-400 italic">None recorded</span>}
          </p>
        </div>

        <div className="bg-slate-50/60 p-3 rounded border border-slate-100">
          <span className="font-bold text-emerald-700 block mb-1">Objective (O)</span>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {details.objective || <span className="text-slate-400 italic">None recorded</span>}
          </p>
        </div>

        <div className="bg-slate-50/60 p-3 rounded border border-slate-100">
          <span className="font-bold text-amber-700 block mb-1">Assessment (A)</span>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {details.assessment || <span className="text-slate-400 italic">None recorded</span>}
          </p>
        </div>

        <div className="bg-slate-50/60 p-3 rounded border border-slate-100">
          <span className="font-bold text-purple-700 block mb-1">Plan (P)</span>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {details.plan || <span className="text-slate-400 italic">None recorded</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Note Edit Form
// ============================================================================
const NoteEditForm: React.FC<{
  note: VisitNote;
  patientId: string;
  onCancel: () => void;
}> = ({ note, patientId, onCancel }) => {
  const updateMutation = useUpdateVisitNote(patientId);

  // Initialize state once from props on mount (no useEffect)
  const [chiefComplaint, setChiefComplaint] = useState(note.details?.chief_complaint || '');
  const [subjective, setSubjective] = useState(note.details?.subjective || '');
  const [objective, setObjective] = useState(note.details?.objective || '');
  const [assessment, setAssessment] = useState(note.details?.assessment || '');
  const [plan, setPlan] = useState(note.details?.plan || '');
  const [bp, setBp] = useState(note.details?.vitals?.blood_pressure || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const updatedDetails: VisitNoteDetails = {
      ...note.details,
      chief_complaint: chiefComplaint.trim() || undefined,
      subjective: subjective.trim() || undefined,
      objective: objective.trim() || undefined,
      assessment: assessment.trim() || undefined,
      plan: plan.trim() || undefined,
      vitals: bp ? { ...note.details?.vitals, blood_pressure: bp } : undefined,
    };

    try {
      await updateMutation.mutateAsync({
        id: note.id,
        details: updatedDetails,
      });
      onCancel();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  return (
    <form onSubmit={handleUpdate} className="p-5 bg-slate-50/50 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Edit Encounter Note
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-xs text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Chief Complaint
          </label>
          <input
            type="text"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Blood Pressure
          </label>
          <input
            type="text"
            value={bp}
            onChange={(e) => setBp(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-blue-700 mb-1">
            Subjective (S)
          </label>
          <textarea
            rows={3}
            value={subjective}
            onChange={(e) => setSubjective(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-emerald-700 mb-1">
            Objective (O)
          </label>
          <textarea
            rows={3}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-amber-700 mb-1">
            Assessment (A)
          </label>
          <textarea
            rows={3}
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-purple-700 mb-1">
            Plan (P)
          </label>
          <textarea
            rows={3}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </form>
  );
};