import React from 'react';
import type { TreatmentPlan } from '../types/treatments';
import { TreatmentNode } from './TreatmentNode';
import type { PlanAction , TreatmentPlanAnd} from '../types/treatments';


function applyPlanAction(
  root: TreatmentPlanAnd,
  action: PlanAction
): TreatmentPlanAnd {
  // Deep clone or recursive shallow-copy along path
  const clone = structuredClone(root);

  if (action.type === 'modify') {
    if (action.path.length === 0) return action.value;
    
    let current: any = clone;
    for (let i = 1; i < action.path.length - 1; i++) {
      const segment = action.path[i];
      current = typeof segment === 'number' ? current.items[segment] : current[segment];
    }
    const lastKey = action.path[action.path.length - 1];
    if (typeof lastKey === 'number') {
      current.items[lastKey] = action.value;
    } else {
      current[lastKey] = action.value;
    }
  } 
  else if (action.type === 'add') {
    let current: any = clone;
    for (let i = 1; i < action.path.length; i++) {
      const segment = action.path[i];
      current = typeof segment === 'number' ? current.items[segment] : current[segment];
    }
    current.items = [...(current.items || []), action.item];
  } 
  else if (action.type === 'delete') {
    if (action.path.length === 0) return clone;
    
    let current: any = clone;
    for (let i = 1; i < action.path.length - 1; i++) {
      const segment = action.path[i];
      current = typeof segment === 'number' ? current.items[segment] : current[segment];
    }
    const deleteIndex = action.path[action.path.length - 1] as number;
    current.items = current.items.filter((_: any, idx: number) => idx !== deleteIndex);
  }

  return clone;
}


interface TreatmentPlanModalProps {
  isOpen: boolean;
  plan: TreatmentPlan; // Controlled initial value from caller
  handlePlanChange: (updatedPlan: TreatmentPlan) => void;
  onClose: () => void;
  onSave: (updatedPlan: TreatmentPlan) => void; // Overwrites caller's plan
}

export const TreatmentPlanModal: React.FC<TreatmentPlanModalProps> = ({
  isOpen,
  plan,
  handlePlanChange,
  onClose,
  onSave,
}) => {
  const draft = plan;

  if (!isOpen) return null;

  // Single central handler for all additions, modifications, and deletions
  const handleChanges = (action: PlanAction) => {
    if (typeof action.path[0] !== 'number' && 'value' in action){
        handlePlanChange({...plan, [action.path[0]]: action.value})
    }
    handlePlanChange({...plan, plan: applyPlanAction(plan.plan, action)});
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
    {/* ── HEADER ──────────────────────────────────────────────────────────── */}
    <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <span>Edit Treatment Plan</span>
          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded">
            {draft.status}
          </span>
        </h2>
        <p className="text-xs text-zinc-400">
          Configure patient details, diagnoses, and nested procedure branches.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-zinc-800 transition"
      >
        ✕ Close
      </button>
    </div>

    {/* ── FORM BODY ───────────────────────────────────────────────────────── */}
    <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* ── TOP METADATA CARD: Patient Name, Diagnosis, Root Notes ─────────── */}
      <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Patient Name */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Patient Name *
            </label>
            <input
              type="text"
              required
              value={draft.patientName}
              onChange={(e) =>
                handleChanges({ type: 'modify', path: ['patientName'], value: e.target.value })
              }
              placeholder="e.g. Eleanor Vance"
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Diagnosis */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Diagnosis / Clinical Findings
            </label>
            <input
              type="text"
              value={draft.diagnoses || ''}
              onChange={(e) =>
                handleChanges({ type: 'modify', path: ['diagnoses'], value: e.target.value })
              }
              placeholder="e.g. Irreversible pulpitis tooth #19, generalized moderate periodontitis"
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>
      </div>

      {/* ── RECURSIVE TREE: ROOT PLAN AND / OR NODES ────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Logical Plan Tree (Procedures & Alternatives)
        </h3>
        <TreatmentNode node={draft.plan} path={[0]} onChange={handleChanges} />
      </div>

      {/* ── MODAL FOOTER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <span className="text-[11px] text-zinc-500 font-mono">
          ID: {draft.id} • Created: {draft.createdAt}
        </span>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition shadow-md shadow-emerald-950"
          >
            Save Changes
          </button>
        </div>
      </div>
    </form>
  </div>
</div>
  );
};