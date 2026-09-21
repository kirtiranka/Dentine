import type { StateCreator } from 'zustand';
import type { AppStore, OtherSlice, GeminiToolCall, ToolExecutionResult, ActiveTabName } from '../../types/index';

export const createOtherSlice: StateCreator<AppStore, [], [], OtherSlice> = (set, get) => ({
  activeTab: 'patient',

  // Fixed: set takes a partial state object, not the raw value
  setActiveTab: (tab: ActiveTabName) => {
    set({ activeTab: tab });
  },

  getActiveTabPrompt: () => {
    return get().activeTab == 'patient' ? get().getPatientPrompt() : (get().activeTab == 'lab' ? get().getLabPrompt() : get().getTreatmentPlanPrompt());
},

  getOtherDescription: () => {
    return {
      activeTab: get().activeTab,
      buttons: ['patient_tab', 'lab_tab', 'treatment_plan_tab'],
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 1. getFullPrompt: Combines role instructions, current state, & available UI
  // ───────────────────────────────────────────────────────────────────────────
  getFullPrompt: () => {
    const activePagePrompt = get().getActiveTabPrompt();
    const otherDescription = JSON.stringify(get().getOtherDescription(), null, 2);

    return `
You are an intelligent clinical voice agent embedded into the "DentEMR Studio" dental practice application.
Your role is to assist the clinician with hands-free operation: entering records, updating text inputs, submitting records, and switching views.
=== GLOBAL STATE ===
${otherDescription}

=== ACTIVE PAGE DETAILS ===
${activePagePrompt}

`.trim();
  },

  
// === OPERATING GUIDELINES ===
// - If the user dictates a patient name or asks to register a patient, populate the field and click the add button (or just directly submit).
// - If the user asks to switch between Patient and Lab views, click the corresponding navigation button.
// - Always prefer making the appropriate tool calls immediately when user intent involves modifying the UI.
// - Keep spoken conversational responses concise and friendly for a clinical workflow.

  // ───────────────────────────────────────────────────────────────────────────
  // 2. getToolsDescription: Gemini Function Declarations Schema
  // ───────────────────────────────────────────────────────────────────────────
  getToolsDescription: () => {
    // eslint-disable-next-line no-useless-assignment
    let toolsDescription = null;
    if(get().activeTab !== 'treatment_plan'){
      toolsDescription = [
        {
          name: 'enter_text_field',
          description:
            'Enters or updates the text value of an input field on the currently active page in the EMR.',
          parameters: {
            type: 'OBJECT',
            properties: {
              fieldName: {
                type: 'STRING',
                description: 'The identifier of the input field. Examples: "patient_name", "lab_name".',
              },
              value: {
                type: 'STRING',
                description: 'The text value to enter into the textbox.',
              },
            },
            required: ['fieldName', 'value'],
          },
        },
        {
          name: 'click_button',
          description:
            'Triggers a button action in the application to submit records, clear forms, or switch tabs.',
          parameters: {
            type: 'OBJECT',
            properties: {
              buttonName: {
                type: 'STRING',
                description:
                  'The action button identifier to click. Use "add_patient" or "add_lab" to submit, "clear_patient" or "clear_lab" to reset, or "switch_to_patient_tab" / "switch_to_lab_tab" to navigate.',
              },
            },
            required: ['buttonName'],
          },
        },
      ];
    }
    else{
      toolsDescription = get().getTreatmentPlanTools()
    }

    return toolsDescription;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. useTools: Interprets Gemini tool calls and invokes store actions
  // ───────────────────────────────────────────────────────────────────────────
  applyTools: (toolCalls: GeminiToolCall | GeminiToolCall[]): ToolExecutionResult[] => {
    // Standardize input into an array
    const calls = Array.isArray(toolCalls) ? toolCalls : [toolCalls];
    const results: ToolExecutionResult[] = [];

    if(get().activeTab === 'treatment_plan'){
      const tp_results = get().applyTreatmentPlanTools(calls);
      return tp_results;
    }

    for (const call of calls) {
      const { name, args } = call;

      try {
        switch (name) {
          // ── Tool 1: enter_text_field ──────────────────────────────────────
          case 'enter_text_field': {
            const field = (args?.fieldName || '').toLowerCase().trim();
            const value = String(args?.value ?? '');

            if (field.includes('patient')) {
              get().setPatientInput(value);
              results.push({
                toolName: name,
                status: 'success',
                message: `Patient input set to: "${value}"`,
                result: { field: 'patient_name', value },
              });
            } else if (field.includes('lab')) {
              get().setLabInput(value);
              results.push({
                toolName: name,
                status: 'success',
                message: `Lab input set to: "${value}"`,
                result: { field: 'lab_name', value },
              });
            } else {
              results.push({
                toolName: name,
                status: 'error',
                message: `Unknown field name: "${args?.fieldName}". Expected "patient_name" or "lab_name".`,
              });
            }
            break;
          }

          // ── Tool 2: click_button ──────────────────────────────────────────
          case 'click_button': {
            // Normalize button name (handles both "add_patient", "add-patient", and "add patient")
            const btn = (args?.buttonName || '').toLowerCase().replace(/[-_ ]/g, '');

            if (btn.includes('addpatient') || btn.includes('submitpatient')) {
              get().addPatient();
              results.push({
                toolName: name,
                status: 'success',
                message: `Clicked Add Patient. Patient created.`,
              });
            } else if (btn.includes('clearpatient') || btn.includes('resetpatient')) {
              get().clearPatientInput();
              results.push({
                toolName: name,
                status: 'success',
                message: `Cleared patient textbox.`,
              });
            } else if (btn.includes('addlab') || btn.includes('submitlab')) {
              get().addLab();
              results.push({
                toolName: name,
                status: 'success',
                message: `Clicked Add Lab. Lab order created.`,
              });
            } else if (btn.includes('clearlab') || btn.includes('resetlab')) {
              get().clearLabInput();
              results.push({
                toolName: name,
                status: 'success',
                message: `Cleared lab textbox.`,
              });
            } else if (btn.includes('patienttab') || btn.includes('topatient')) {
              get().setActiveTab('patient');
              results.push({
                toolName: name,
                status: 'success',
                message: `Navigated to Patient tab.`,
              });
            } else if (btn.includes('labtab') || btn.includes('tolab')) {
              get().setActiveTab('lab');
              results.push({
                toolName: name,
                status: 'success',
                message: `Navigated to Lab tab.`,
              });
            } else if (btn.includes('treatmentplantab')) {
              get().setActiveTab('treatment_plan');
              results.push({
                toolName: name,
                status: 'success',
                message: `Navigated to Lab tab.`,
              });
            }else {
              results.push({
                toolName: name,
                status: 'error',
                message: `Unrecognized buttonName: "${args?.buttonName}".`,
              });
            }
            break;
          }

          default:
            results.push({
              toolName: name,
              status: 'error',
              message: `Tool "${name}" is not supported.`,
            });
            break;
        }
      } catch (err: any) {
        results.push({
          toolName: name,
          status: 'error',
          message: `Execution failed: ${err?.message || 'Unknown error'}`,
        });
      }
    }

    return results;
  },
});