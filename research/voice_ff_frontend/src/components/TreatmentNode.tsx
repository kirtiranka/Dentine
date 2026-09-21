import React, {useState} from 'react';
import type {
  TreatmentPlanNode,
  TreatmentPlanAtom,
  TreatmentPlanAnd,
  TreatmentPlanOr,
} from '../types/treatments';
import type { Path, PlanAction } from '../types/treatments';
import { ChevronDown } from 'lucide-react';



// ── TOOTH NUMBER SELECTOR (UNIVERSAL SYSTEM 1-32) ───────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ToothSelector: React.FC<{
  selectedTeeth: number[];
  onChange: (teeth: number[]) => void;
}> = ({ selectedTeeth, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTooth = (num: number) => {
    if (selectedTeeth.includes(num)) {
      onChange(selectedTeeth.filter((t) => t !== num));
    } else {
      onChange([...selectedTeeth, num].sort((a, b) => a - b));
    }
  };

  const upperArch = Array.from({ length: 16 }, (_, i) => i + 1); // 1 - 16
  const lowerArch = Array.from({ length: 16 }, (_, i) => 32 - i); // 32 - 17

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-700 hover:border-zinc-500 rounded-xl px-3 py-2 text-xs text-zinc-100 transition"
      >
        <span className="truncate">
          {selectedTeeth.length === 0 ? (
            <span className="text-zinc-500">None selected (Full arch/general)</span>
          ) : (
            <span className="text-emerald-400 font-mono">
              Teeth: #{selectedTeeth.join(', #')}
            </span>
          )}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-2 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 p-3.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl space-y-3">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-2">
            <span className="font-semibold text-zinc-200">Universal Tooth Selector (1-32)</span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-zinc-400 hover:text-white transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Done
              </button>
            </div>
          </div>

          {/* Upper Maxillary Arch */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Upper Maxillary Arch (1 - 16)
            </div>
            <div className="grid grid-cols-8 gap-1">
              {upperArch.map((t) => {
                const active = selectedTeeth.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTooth(t)}
                    className={`h-7 text-[11px] font-mono font-medium rounded transition flex items-center justify-center ${
                      active
                        ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-950'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lower Mandibular Arch */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Lower Mandibular Arch (32 - 17)
            </div>
            <div className="grid grid-cols-8 gap-1">
              {lowerArch.map((t) => {
                const active = selectedTeeth.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTooth(t)}
                    className={`h-7 text-[11px] font-mono font-medium rounded transition flex items-center justify-center ${
                      active
                        ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-950'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


interface TreatmentNodeProps {
  node: TreatmentPlanNode;
  path: Path;
  depth?: number;
  onChange: (action: PlanAction) => void;
}

export const TreatmentNode: React.FC<TreatmentNodeProps> = ({
  node,
  path,
  depth = 0,
  onChange,
}) => {
  const isAtom = !('aggregation_type' in node);
  const isRoot = path.length === 0;

  // ── LEAF NODE (ATOM) ──────────────────────────────────────────────────────
  if (isAtom) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
            ATOM • Path: [{path.join(', ')}]
          </span>
          <button
            type="button"
            onClick={() => onChange({ type: 'delete', path })}
            className="text-zinc-500 hover:text-rose-400 transition"
          >
            ✕ Delete
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Procedure name..."
            value={node.procedure}
            onChange={(e) =>
              onChange({ type: 'modify', path: [...path, 'procedure'], value: e.target.value })
            }
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100"
          />
          <input
            type="text"
            placeholder="Tooth #s (e.g. 18, 19)"
            value={node.tooth_numbers.join(', ')}
            onChange={(e) => {
              const nums = e.target.value
                .split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !isNaN(n));
              onChange({ type: 'modify', path: [...path, 'tooth_numbers'], value: nums });
            }}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="number"
            placeholder="Cost ($)"
            value={node.cost ?? ''}
            onChange={(e) =>
              onChange({
                type: 'modify',
                path: [...path, 'cost'],
                value: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100"
          />
          <input
            type="text"
            placeholder="Notes..."
            value={node.notes || ''}
            onChange={(e) =>
              onChange({ type: 'modify', path: [...path, 'notes'], value: e.target.value })
            }
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100"
          />
        </div>
      </div>
    );
  }

  // ── COMPOSITE NODE (AND / OR) ─────────────────────────────────────────────
  const isAnd = node.aggregation_type === 'AND';

  const handleAddAtom = () => {
    const newAtom: TreatmentPlanAtom = { procedure: '', tooth_numbers: [], notes: '' };
    onChange({ type: 'add', path, item: newAtom });
  };

  const handleAddAlternate = () => {
    if (isAnd) {
      // AND contains OR
      const newOr: TreatmentPlanOr = { aggregation_type: 'OR', items: [], notes: '' };
      onChange({ type: 'add', path, item: newOr });
    } else {
      // OR contains AND
      const newAnd: TreatmentPlanAnd = { aggregation_type: 'AND', items: [], notes: '' };
      onChange({ type: 'add', path, item: newAnd });
    }
  };

  return (
    <div
      className={`rounded-xl p-3.5 space-y-3 border ${
        isAnd
          ? 'bg-zinc-900/80 border-emerald-900/40'
          : 'bg-amber-950/10 border-amber-800/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
              isAnd
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {isAnd ? 'AND (All Mandatory)' : 'OR (Choice/Alternatives)'}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Path: [{path.join(', ')}]</span>
        </div>

        {!isRoot && (
          <button
            type="button"
            onClick={() => onChange({ type: 'delete', path })}
            className="text-zinc-500 hover:text-rose-400 text-xs transition"
          >
            ✕ Delete Branch
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder={isAnd ? 'AND sequence notes...' : 'OR alternative notes...'}
        value={node.notes || ''}
        onChange={(e) =>
          onChange({ type: 'modify', path: [...path, 'notes'], value: e.target.value })
        }
        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200"
      />

      {/* Recursive Children mapped with index appended to path */}
      <div className="space-y-2.5 pl-3 border-l-2 border-zinc-800 ml-1">
        {node.items.map((child, idx) => (
          <TreatmentNode
            key={idx}
            node={child}
            path={[...path, idx]} // 👈 [0], [0, 1], etc.
            depth={depth + 1}
            onChange={onChange}
          />
        ))}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleAddAtom}
          className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded transition"
        >
          + Add Procedure (Atom)
        </button>
        <button
          type="button"
          onClick={handleAddAlternate}
          className={`text-[11px] px-2.5 py-1 rounded border transition ${
            isAnd
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/50'
              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
          }`}
        >
          {isAnd ? '🔀 + Add OR Branch' : '📑 + Add AND Sequence'}
        </button>
      </div>
    </div>
  );
};