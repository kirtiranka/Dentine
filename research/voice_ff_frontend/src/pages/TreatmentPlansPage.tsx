import React, { useMemo } from 'react';
import {
  Stethoscope,
  Plus,
//   Trash2,
//   GitBranch,
//   Layers,
  ChevronDown,
  ChevronRight,
  Search,
//   CheckCircle2,
  FileText,
//   X,
} from 'lucide-react';

import type { TreatmentPlan, TreatmentPlanNode } from '../types/treatments';
import { TreatmentPlanModal } from '../components/TreatmentPlanModal';
import { useAppStore } from '../store/useAppStore';

// ── CDT DENTAL CODES & STANDARD FEES DATABASE ───────────────────────────────
export interface DentalProcedureRef {
  code: string;
  name: string;
  category: 'Diagnostic' | 'Preventive' | 'Restorative' | 'Endodontics' | 'Periodontics' | 'Implant' | 'Prosthodontics' | 'Oral Surgery';
  standardCost: number;
  requiresTooth: boolean;
}

// const CDT_PROCEDURE_DB: DentalProcedureRef[] = [
//   { code: 'D0120', name: 'Periodic Oral Evaluation', category: 'Diagnostic', standardCost: 75, requiresTooth: false },
//   { code: 'D0150', name: 'Comprehensive Oral Evaluation', category: 'Diagnostic', standardCost: 135, requiresTooth: false },
//   { code: 'D0210', name: 'Complete Intraoral Radiographic Series (FMX)', category: 'Diagnostic', standardCost: 175, requiresTooth: false },
//   { code: 'D1110', name: 'Adult Prophylaxis (Cleaning)', category: 'Preventive', standardCost: 120, requiresTooth: false },
//   { code: 'D1206', name: 'Topical Fluoride Varnish Application', category: 'Preventive', standardCost: 55, requiresTooth: false },
//   { code: 'D2391', name: 'Resin Composite - 1 Surface, Posterior', category: 'Restorative', standardCost: 230, requiresTooth: true },
//   { code: 'D2392', name: 'Resin Composite - 2 Surfaces, Posterior', category: 'Restorative', standardCost: 295, requiresTooth: true },
//   { code: 'D2393', name: 'Resin Composite - 3 Surfaces, Posterior', category: 'Restorative', standardCost: 360, requiresTooth: true },
//   { code: 'D2740', name: 'Crown - Porcelain/Ceramic Substrate', category: 'Restorative', standardCost: 1420, requiresTooth: true },
//   { code: 'D2950', name: 'Core Buildup, Including Any Pins', category: 'Restorative', standardCost: 310, requiresTooth: true },
//   { code: 'D3330', name: 'Endodontic Therapy - Molar (Root Canal)', category: 'Endodontics', standardCost: 1350, requiresTooth: true },
//   { code: 'D4341', name: 'Periodontal Scaling & Root Planing - Per Quad', category: 'Periodontics', standardCost: 320, requiresTooth: false },
//   { code: 'D6010', name: 'Surgical Placement of Endosteal Implant Body', category: 'Implant', standardCost: 2450, requiresTooth: true },
//   { code: 'D6058', name: 'Abutment Supported Porcelain/Ceramic Crown', category: 'Implant', standardCost: 1650, requiresTooth: true },
//   { code: 'D6245', name: 'Pontic - Porcelain/Ceramic (3-Unit Bridge)', category: 'Prosthodontics', standardCost: 1350, requiresTooth: true },
//   { code: 'D7140', name: 'Extraction, Erupted Tooth or Exposed Root', category: 'Oral Surgery', standardCost: 240, requiresTooth: true },
//   { code: 'D7210', name: 'Surgical Removal of Erupted Tooth', category: 'Oral Surgery', standardCost: 390, requiresTooth: true },
// ];

// ── RECURSIVE COST CALCULATION (MIN & MAX RANGE FOR OR BRANCHES) ────────────
function calculatePlanCostRange(node: TreatmentPlanNode): { min: number; max: number } {
  if (!('aggregation_type' in node)) {
    // Atom Node
    const cost = node.cost || 0;
    return { min: cost, max: cost };
  }

  if (node.items.length === 0) {
    return { min: 0, max: 0 };
  }

  if (node.aggregation_type === 'AND') {
    // All items are mandatory: sum mins and sum maxes
    return node.items.reduce(
      (acc, item) => {
        const itemRange = calculatePlanCostRange(item);
        return {
          min: acc.min + itemRange.min,
          max: acc.max + itemRange.max,
        };
      },
      { min: 0, max: 0 }
    );
  }

  if (node.aggregation_type === 'OR') {
    // Alternative items: min is lowest option, max is highest option
    const itemRanges = node.items.map(calculatePlanCostRange);
    const mins = itemRanges.map((r) => r.min);
    const maxs = itemRanges.map((r) => r.max);
    return {
      min: Math.min(...mins),
      max: Math.max(...maxs),
    };
  }

  return { min: 0, max: 0 };
}

// Format cost string nicely (e.g. "$1,250" or "$1,250 - $2,800")
function formatCostRange(range: { min: number; max: number }): string {
  if (range.min === range.max) {
    return `$${range.min.toLocaleString()}`;
  }
  return `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`;
}


const DUMMY_PLAN: TreatmentPlan = {
    id:'dummy_plan',
    patientName: 'Patient Name',
    createdAt: '',
    status: 'Draft',
    diagnoses: 'Diagnosis',
    plan: {

        aggregation_type: 'AND',
        notes: 'Notes',
        items:[]
    }
}


// ── RECURSIVE VISUAL DISPLAY TREE COMPONENT ─────────────────────────────────
const RecursivePlanVisualizer: React.FC<{ node: TreatmentPlanNode; depth?: number }> = ({
  node,
  depth = 0,
}) => {
  if (!('aggregation_type' in node)) {
    // Atom Node Display
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-semibold text-zinc-100 flex items-center space-x-2">
              <span>{node.procedure}</span>
              {node.tooth_numbers && node.tooth_numbers.length > 0 && (
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  #{node.tooth_numbers.join(', #')}
                </span>
              )}
            </div>
            {node.notes && <p className="text-[11px] text-zinc-400 mt-0.5">{node.notes}</p>}
          </div>
        </div>
        <div className="font-mono font-semibold text-emerald-400 text-xs">
          ${node.cost?.toLocaleString()}
        </div>
      </div>
    );
  }

  const isOr = node.aggregation_type === 'OR';

  return (
    <div
      className={`rounded-2xl p-3.5 space-y-3 border ${
        isOr
          ? 'bg-amber-950/10 border-amber-800/40'
          : depth === 0
          ? 'bg-transparent border-transparent p-0'
          : 'bg-zinc-900/40 border-zinc-800'
      }`}
    >
      {/* Group Header */}
      {depth > 0 && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                isOr
                  ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
              }`}
            >
              {isOr ? 'OR (ALTERNATIVE CHOICES)' : 'AND (REQUIRED GROUP)'}
            </span>
            {node.notes && <span className="text-zinc-300 text-xs italic">{node.notes}</span>}
          </div>
          <span className="font-mono text-zinc-400 text-[11px]">
            {formatCostRange(calculatePlanCostRange(node))}
          </span>
        </div>
      )}

      {/* Children Items */}
      <div className="space-y-2.5">
        {node.items.map((item, idx) => (
          <div key={idx} className="relative">
            {isOr && (
              <div className="text-[10px] font-mono text-amber-400/80 mb-1 pl-1">
                OPTION {String.fromCharCode(65 + idx)}:
              </div>
            )}
            <RecursivePlanVisualizer node={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to format date as 'YYYY-MM-DD • hh:mm AM/PM'
const formatCreatedAt = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${year}-${month}-${day} • ${time}`;
};


// ── TREATMENT PLANS MAIN PAGE COMPONENT ──────────────────────────────────────
export const TreatmentPlansPage: React.FC = () => {
  // Local state for registered treatment plans
  const {
    plans,
    draftPlan,
    isModalOpen,
    searchQuery,
    filterStatus,
    expandedPlanId,
    setSearchQuery,
    setFilterStatus,
    setPlans,
    setDraftPlan,
    setIsModalOpen,
    setExpandedPlanId
  } = useAppStore();

  // Handle plan addition
  const handleSavePlan = (newPlan: TreatmentPlan) => {
    const actualPlan = {
        ...newPlan,
        // Preserves existing id if editing, otherwise generates a new UUID
        id: crypto.randomUUID(),
        createdAt: formatCreatedAt(),
    }
    setPlans([actualPlan, ...plans]);
    setExpandedPlanId(actualPlan.id);
  };

  const handlePlanChange = (newPlan: TreatmentPlan) => {
    setDraftPlan(newPlan);
  };

  // Filtered plans list
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchSearch =
        plan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.diagnoses?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus = filterStatus === 'All' || plan.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [plans, searchQuery, filterStatus]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* ── TOP STICKY NAVBAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                Treatment Plans
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                AND/OR Logic
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive clinical pathways, multi-step options, and CDT fee estimations
            </p>
          </div>
        </div>

        {/* Launch Modal Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>New Treatment Plan</span>
        </button>
      </header>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Top Summary Bar & Search Controls */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, tooth, or diagnosis..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-400">Status:</span>
            {['All', 'Presented', 'Accepted', 'Draft'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === status
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Existing Plans Gallery */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Registered Plans ({filteredPlans.length})
            </h2>
            <span className="text-[11px] text-zinc-500">
              Recursive AND/OR branch trees preview
            </span>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">No treatment plans found matching your filter.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-emerald-400 font-semibold hover:underline"
              >
                + Create the first plan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlans.map((plan) => {
                const costRange = calculatePlanCostRange(plan.plan);
                const isExpanded = expandedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 transition-all rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Card Header Bar */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/60">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {plan.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-zinc-100 text-sm">
                              {plan.patientName}
                            </h3>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                plan.status === 'Accepted'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : plan.status === 'Presented'
                                  ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {plan.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {plan.diagnoses || 'No diagnosis logged'}
                          </p>
                          <div className="flex items-center space-x-3 text-[10px] text-zinc-500 mt-1">
                            <span>Created: {plan.createdAt}</span>
                            <span>•</span>
                            <span>ID: #{plan.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Pricing Summary & Toggle */}
                      <div className="flex items-center justify-between md:justify-end space-x-4">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                            Estimated Investment
                          </div>
                          <div className="font-mono font-bold text-emerald-400 text-sm sm:text-base">
                            {formatCostRange(costRange)}
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                          className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition flex items-center space-x-1 text-xs"
                        >
                          <span>{isExpanded ? 'Collapse' : 'Inspect'}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Tree View */}
                    {isExpanded && (
                      <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/40 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-zinc-300 flex items-center space-x-2">
                            <span>Clinical Procedure Breakdown</span>
                            <span className="text-[10px] text-zinc-500">
                              (Mandatory steps & Patient Decision options)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400">
                            Root: TreatmentPlanAnd
                          </span>
                        </div>

                        {/* Recursive Visualizer */}
                        <RecursivePlanVisualizer node={plan.plan} />

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── CREATE TREATMENT PLAN MODAL ──────────────────────────────────── */}
      <TreatmentPlanModal
        isOpen={isModalOpen}
        plan={draftPlan}
        handlePlanChange={handlePlanChange}
        onClose={() => {setIsModalOpen(false); setDraftPlan(DUMMY_PLAN)}}
        onSave={handleSavePlan}
      />
    </div>
  );
};

export default TreatmentPlansPage;