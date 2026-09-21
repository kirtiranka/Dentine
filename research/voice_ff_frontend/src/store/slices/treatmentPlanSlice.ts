import type { StateCreator } from "zustand";
import type {
  TreatmentPlanSlice,
  TreatmentPlan,
  FlatDraftState,
  TreatmentPlanAnd,
  TreatmentPlanAtom,
  TreatmentPlanOr,
} from "../../types/treatments";
import type {
  AppStore,
  GeminiToolCall,
  ToolExecutionResult,
} from "../../types/index";

// ── Date Formatter: YYYY-MM-DD • hh:mm AM/PM ────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatCreatedAt = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${year}-${month}-${day} • ${time}`;
};

// ── Default Dummy / Blank Plan ──────────────────────────────────────────────
export const DUMMY_PLAN: TreatmentPlan = {
  id: "",
  patientName: "",
  createdAt: "",
  status: "Draft",
  diagnoses: "",
  plan: {
    aggregation_type: "AND",
    notes: "",
    items: [
      {
        procedure: "",
        tooth_numbers: [],
        cost: undefined,
        notes: "",
      },
    ],
  },
};

// ── Initial Mock Plans ──────────────────────────────────────────────────────
export const INITIAL_PLANS: TreatmentPlan[] = [
  {
    id: "tp-101",
    patientName: "Eleanor Vance",
    createdAt: "2026-09-18 • 10:45 AM",
    status: "Presented",
    diagnoses:
      "Irreversible pulpitis tooth #19, moderate localized periodontitis",
    plan: {
      aggregation_type: "AND",
      notes: "Phase 1 Urgent Care & Restorative Options",
      items: [
        {
          procedure: "D1110 - Adult Prophylaxis",
          tooth_numbers: [],
          cost: 110,
          notes: "Full mouth routine hygiene",
        },
        {
          aggregation_type: "OR",
          notes: "Tooth #19 Restorative Alternatives",
          items: [
            {
              aggregation_type: "AND",
              notes: "Option A: Endodontic Preservation",
              items: [
                {
                  procedure: "D3330 - Endodontic Therapy (Molar)",
                  tooth_numbers: [19],
                  cost: 1250,
                },
                {
                  procedure: "D2740 - Porcelain/Ceramic Crown",
                  tooth_numbers: [19],
                  cost: 1350,
                },
              ],
            },
            {
              aggregation_type: "AND",
              notes: "Option B: Extraction & Implant",
              items: [
                {
                  procedure: "D7140 - Extraction",
                  tooth_numbers: [19],
                  cost: 195,
                },
                {
                  procedure: "D6010 - Implant Surgical Placement",
                  tooth_numbers: [19],
                  cost: 2400,
                },
              ],
            },
          ],
        },
      ],
    },
  },
];

// src/utils/planCompiler.ts

/**
 * Pure compiler: Recursively transforms flat draft nodes into the strict TreatmentPlan
 */
function compileFlatDraftToTreatmentPlan(
  draft: FlatDraftState,
  status: "Draft" | "Presented" | "Accepted" | "Completed" = "Draft",
): TreatmentPlan {
  if (!draft.root) {
    throw new Error("Cannot compile plan: createRootPlan was never called.");
  }

  const { rootId, patientName, diagnoses, notes } = draft.root;
  const allNodes = Object.values(draft.nodes);

  // Recursive resolver
  function buildChildren(
    parentId: string,
  ): Array<TreatmentPlanAtom | TreatmentPlanAnd | TreatmentPlanOr> {
    const directChildren = allNodes.filter((n) => n.parentId === parentId);

    return directChildren.map((node) => {
      if (node.kind === "ATOM") {
        const atom: TreatmentPlanAtom = {
          procedure: node.procedure,
          tooth_numbers: node.toothNumbers,
          cost: node.cost,
          notes: node.notes,
        };
        return atom;
      }

      if (node.aggregationType === "OR") {
        const orBranch: TreatmentPlanOr = {
          aggregation_type: "OR",
          notes: node.notes,
          items: buildChildren(node.id) as Array<
            TreatmentPlanAtom | TreatmentPlanAnd
          >,
        };
        return orBranch;
      }

      const andBranch: TreatmentPlanAnd = {
        aggregation_type: "AND",
        notes: node.notes,
        items: buildChildren(node.id) as Array<
          TreatmentPlanAtom | TreatmentPlanOr
        >,
      };
      return andBranch;
    });
  }

  // Root is always TreatmentPlanAnd
  const rootPlanAnd: TreatmentPlanAnd = {
    aggregation_type: "AND",
    notes,
    items: buildChildren(rootId) as Array<TreatmentPlanAtom | TreatmentPlanOr>,
  };

  return {
    id: crypto.randomUUID(),
    patientName,
    diagnoses,
    status,
    createdAt: new Date().toLocaleString("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    }),
    plan: rootPlanAnd,
  };
}

export const createTreatmentPlanSlice: StateCreator<
  AppStore,
  [],
  [],
  TreatmentPlanSlice
> = (set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  plans: INITIAL_PLANS,
  draftPlan: structuredClone(DUMMY_PLAN),
  isModalOpen: false,
  searchQuery: "",
  filterStatus: "All",
  expandedPlanId: "tp-101",

  // ── Basic Setters ─────────────────────────────────────────────────────────
  setPlans: (plans) => set({ plans }),

  setDraftPlan: (updater) =>
    set((state) => ({
      draftPlan:
        typeof updater === "function" ? updater(state.draftPlan) : updater,
    })),

  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setExpandedPlanId: (expandedPlanId) => set({ expandedPlanId }),

  // ── LLM Context Prompt Generator ──────────────────────────────────────────
  getTreatmentPlanPrompt: () => {
    return `
    You are at the treatment plan page. 
    Use the context and tools provided to create new treatment plans according to the requirements.
    Emit all tool calls in 1 turn.

    PLAN VISIBLE TO DOCTOR
    ${JSON.stringify(get().draftPlan)}

    YOUR DRAFT
    ${JSON.stringify(get().flatDraft)}

    `.trim();
  },


  getTreatmentPlanTools: () => {
    return [
  {
    name: 'createRootPlan',
    description:
      'Initializes the root treatment plan container and patient metadata. All subsequent nodes attach to this root (or nested sub-branches).',
    parameters: {
      type: 'OBJECT',
      properties: {
        rootId: {
          type: 'STRING',
          description:
            'A unique identifier for the root node. Typically "root" or a 3-word slug like "root-master-plan". Defaults to "root".',
        },
        patientName: {
          type: 'STRING',
          description: 'The full name of the patient (e.g. "Eleanor Vance").',
        },
        diagnoses: {
          type: 'STRING',
          description: 'Clinical findings or diagnoses (e.g. "Localized severe periodontitis, tooth #19 pulpitis").',
        },
        notes: {
          type: 'STRING',
          description: 'High-level case overview or phase sequencing strategy.',
        },
      },
      required: ['patientName'],
    },
  },
  {
    name: 'createAtom',
    description:
      'Creates a concrete, atomic dental procedure node (procedure code/name, teeth, cost, notes) and attaches it to a parent AND or OR branch.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: {
          type: 'STRING',
          description:
            'A unique 3-word slug identifier for this atomic procedure (e.g. "molar-ceramic-crown", "lower-hygiene-scaling").',
        },
        parentId: {
          type: 'STRING',
          description:
            'The id of the parent branch this procedure belongs to (either the rootId or an AND/OR branch id).',
        },
        procedure: {
          type: 'STRING',
          description: 'CDT code or clinical procedure description (e.g. "D2740 - Porcelain/Ceramic Crown").',
        },
        toothNumbers: {
          type: 'ARRAY',
          items: { type: 'INTEGER' },
          description: 'List of tooth numbers involved (1-32). Pass [] if generalized or whole mouth.',
        },
        cost: {
          type: 'NUMBER',
          description: 'Estimated standard fee in dollars.',
        },
        notes: {
          type: 'STRING',
          description: 'Specific clinical notes for this procedure (e.g. "Shade A2, Zirconia").',
        },
      },
      required: ['id', 'parentId', 'procedure'],
    },
  },
  {
    name: 'createAndOr',
    description:
      'Creates an empty logical branch node (AND = all required; OR = mutually exclusive alternatives) to group sub-procedures or choices.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: {
          type: 'STRING',
          description:
            'A unique 3-word slug identifier for this branch (e.g. "tooth-nineteen-choices", "phase-one-urgent").',
        },
        parentId: {
          type: 'STRING',
          description:
            'The id of the parent branch this branch is nested inside (rootId or another AND/OR branch id).',
        },
        aggregationType: {
          type: 'STRING',
          enum: ['AND', 'OR'],
          description:
            'AND = All items within this branch must be performed. OR = The patient chooses between the alternative options inside this branch.',
        },
        notes: {
          type: 'STRING',
          description: 'Branch description (e.g. "Tooth #19 Restorative Alternatives" or "Option A: Endodontic Care").',
        },
      },
      required: ['id', 'parentId', 'aggregationType'],
    },
  },
  {
    name: 'completeCreation',
    description:
      'Finalizes the treatment plan construction. Validates the graph, compiles all nodes into the recursive TreatmentPlan structure, and commits it to the EMR.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          enum: ['Draft', 'Presented', 'Accepted'],
          description: 'The clinical status to assign to the completed plan. Defaults to "Draft".',
        },
        summary: {
          type: 'STRING',
          description: 'A brief verbal explanation of the assembled plan to speak back to the clinician.',
        },
      },
    },
  },
];
  },

  flatDraft: {
    root: null,
    nodes: {},
  },

  resetFlatDraft: () => {
    set({
      flatDraft: { root: null, nodes: {} },
    });
  },

  applyTreatmentPlanTools: (toolCalls: GeminiToolCall[]) => {
    const results: ToolExecutionResult[] = [];

    for (const call of toolCalls) {
      const { name, args } = call;

      try {
        switch (name) {
          // ── Tool 1: createRootPlan ───────────────────────────────────────
          case "createRootPlan": {
            const rootId = args.rootId || "root";
            set((state) => ({
              flatDraft: {
                ...state.flatDraft,
                root: {
                  rootId,
                  patientName: args.patientName,
                  diagnoses: args.diagnoses || "",
                  notes: args.notes || "",
                },
              },
            }));

            results.push({
              toolName: name,
              status: "success",
              message: `Initialized root plan for "${args.patientName}" (Root ID: "${rootId}")`,
            });
            break;
          }

          // ── Tool 2: createAtom ───────────────────────────────────────────
          case "createAtom": {
            const id = args.id;
            set((state) => ({
              flatDraft: {
                ...state.flatDraft,
                nodes: {
                  ...state.flatDraft.nodes,
                  [id]: {
                    kind: "ATOM",
                    id,
                    parentId: args.parentId,
                    procedure: args.procedure,
                    toothNumbers: args.toothNumbers || [],
                    cost: args.cost,
                    notes: args.notes,
                  },
                },
              },
            }));

            results.push({
              toolName: name,
              status: "success",
              message: `Created procedure atom "${args.procedure}" [${id}] under parent [${args.parentId}]`,
            });
            break;
          }

          // ── Tool 3: createAndOr ──────────────────────────────────────────
          case "createAndOr": {
            const id = args.id;
            set((state) => ({
              flatDraft: {
                ...state.flatDraft,
                nodes: {
                  ...state.flatDraft.nodes,
                  [id]: {
                    kind: "AND_OR",
                    id,
                    parentId: args.parentId,
                    aggregationType: args.aggregationType,
                    notes: args.notes,
                  },
                },
              },
            }));

            results.push({
              toolName: name,
              status: "success",
              message: `Created ${args.aggregationType} branch [${id}] under parent [${args.parentId}]`,
            });
            break;
          }

          // ── Tool 4: completeCreation ─────────────────────────────────────
          case "completeCreation": {
            const currentDraft = get().flatDraft;
            const compiledPlan = compileFlatDraftToTreatmentPlan(
              currentDraft,
              args.status || "Draft",
            );

            // Add compiled plan to EMR list and expand it in UI
            get().setIsModalOpen(true);
            get().setDraftPlan(compiledPlan);
            get().resetFlatDraft();

            results.push({
              toolName: name,
              status: "success",
              message: `Successfully assembled and saved treatment plan for "${compiledPlan.patientName}".`,
              result: { planId: compiledPlan.id },
            });
            break;
          }

          default:
            results.push({
              toolName: name,
              status: "error",
              message: `Unknown treatment tool: "${name}"`,
            });
            break;
        }
      } catch (err: any) {
        results.push({
          toolName: name,
          status: "error",
          message: `Failed executing ${name}: ${err.message}`,
        });
      }
    }

    return results;
  },
});
