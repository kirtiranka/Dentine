import type { GeminiToolCall, ToolExecutionResult } from "./index";

// ── 1. Leaf Node: Single Atomic Procedure ──────────────────────────────────
export interface TreatmentPlanAtom {
  procedure: string;
  tooth_numbers: number[]; // list of ints (e.g. [18, 19])
  cost?: number;           // auto-populated from DB (optional prior to lookup)
  notes?: string;
}

// ── 2. Composite Node: Conjunction (AND) ───────────────────────────────────
export interface TreatmentPlanAnd {
  aggregation_type: 'AND';
  items: Array<TreatmentPlanAtom | TreatmentPlanOr>;
  notes?: string;
}

// ── 3. Composite Node: Disjunction (OR / Options) ──────────────────────────
export interface TreatmentPlanOr {
  aggregation_type: 'OR';
  items: Array<TreatmentPlanAtom | TreatmentPlanAnd>;
  notes?: string;
}

// ── 4. Root Treatment Plan ────────────────────────────────────────────────
// export type TreatmentPlan = TreatmentPlanAnd;

export interface TreatmentPlan {
  id: string;
  patientName: string;
  createdAt: string;
  status: 'Draft' | 'Presented' | 'Accepted' | 'Completed';
  diagnoses?: string;
  plan: TreatmentPlanAnd;
}

// ── Helper Union of Any Node in the Tree ──────────────────────────────────
export type TreatmentPlanNode = TreatmentPlanAtom | TreatmentPlanAnd | TreatmentPlanOr;


export type PathSegment = number | string;
export type Path = PathSegment[];

export type PlanAction =
  | { type: 'modify'; path: Path; value: any }
  | { type: 'add'; path: Path; item: TreatmentPlanNode } // path points to the AND/OR node
  | { type: 'delete'; path: Path };


export interface FlatDraftRoot {
  rootId: string;
  patientName: string;
  diagnoses: string;
  notes: string;
}

export type FlatDraftNode =
  | {
      kind: 'ATOM';
      id: string;
      parentId: string;
      procedure: string;
      toothNumbers: number[];
      cost?: number;
      notes?: string;
    }
  | {
      kind: 'AND_OR';
      id: string;
      parentId: string;
      aggregationType: 'AND' | 'OR';
      notes?: string;
    };

export interface FlatDraftState {
  root: FlatDraftRoot | null;
  nodes: Record<string, FlatDraftNode>;
}


export interface TreatmentPlanSlice {
  // State
  plans: TreatmentPlan[];
  draftPlan: TreatmentPlan;
  isModalOpen: boolean;
  searchQuery: string;
  filterStatus: string;
  expandedPlanId: string | null;

  // Setters
  setPlans: (plans: TreatmentPlan[]) => void;
  setDraftPlan: (plan: TreatmentPlan | ((prev: TreatmentPlan) => TreatmentPlan)) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  setExpandedPlanId: (id: string | null) => void;

  // Prompt generator for LLM / OtherSlice integration
  getTreatmentPlanPrompt: () => string;
  getTreatmentPlanTools: () => any[];

  flatDraft: FlatDraftState;
  resetFlatDraft: any;
  applyTreatmentPlanTools: (toolCalls: GeminiToolCall[]) => ToolExecutionResult[];
}