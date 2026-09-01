import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { initialPatients, initialAppointments } from "../data/mockData";
import type {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
} from "../types/patient";
import type {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../types/appointment";
import type { ActiveTab } from "../types/view-state";

export interface DentineState {
  // Navigation & View State
  activeTab: ActiveTab;
  selectedPatientId: string | null;
  setActiveTab: (tab: ActiveTab) => void;
  selectPatient: (id: string | null) => void;

  // Patient State & Actions
  patients: Patient[];
  addPatient: (input: CreatePatientInput) => Patient;
  updatePatient: (id: string, input: UpdatePatientInput) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;

  // Appointment State & Actions
  appointments: Appointment[];
  addAppointment: (input: CreateAppointmentInput) => Appointment;
  updateAppointment: (id: string, input: UpdateAppointmentInput) => void;
  deleteAppointment: (id: string) => void;

  // Helper action to reset store back to initial mock data
  resetToDefaults: () => void;
}

export const useDentineStore = create<DentineState>()(
  persist(
    (set, get) => ({
      // Navigation Defaults
      activeTab: "finder" as ActiveTab,
      selectedPatientId: null,

      setActiveTab: (tab: ActiveTab): void => {
        set({ activeTab: tab });
      },

      selectPatient: (id: string | null): void => {
        set({
          selectedPatientId: id,
          activeTab: id
            ? ("patient-view" as ActiveTab)
            : ("finder" as ActiveTab),
        });
      },

      // Patient Collection
      patients: initialPatients,

      addPatient: (input: CreatePatientInput): Patient => {
        const timestamp: string = new Date().toISOString();
        const newPatient: Patient = {
          ...input,
          id: `pat-${Date.now()}`,
          medicalAlerts: input.medicalAlerts ?? [],
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        set((state: DentineState) => ({
          patients: [newPatient, ...state.patients],
          selectedPatientId: newPatient.id,
          activeTab: "patient-view" as ActiveTab,
        }));

        return newPatient;
      },

      updatePatient: (id: string, input: UpdatePatientInput): void => {
        const timestamp: string = new Date().toISOString();
        set((state: DentineState) => {
          const updatedPatients: Patient[] = state.patients.map(
            (p: Patient): Patient =>
              p.id === id ? { ...p, ...input, updatedAt: timestamp } : p,
          );

          // Keep denormalized patientName sync'd on calendar appointments
          const updatedPatient: Patient | undefined = updatedPatients.find(
            (p: Patient): boolean => p.id === id,
          );
          const updatedAppointments: Appointment[] = state.appointments.map(
            (apt: Appointment): Appointment => {
              if (apt.patientId === id && updatedPatient) {
                return {
                  ...apt,
                  patientName: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
                };
              }
              return apt;
            },
          );

          return {
            patients: updatedPatients,
            appointments: updatedAppointments,
          };
        });
      },

      deletePatient: (id: string): void => {
        set((state: DentineState) => ({
          patients: state.patients.filter((p: Patient): boolean => p.id !== id),
          appointments: state.appointments.filter(
            (apt: Appointment): boolean => apt.patientId !== id,
          ),
          selectedPatientId:
            state.selectedPatientId === id ? null : state.selectedPatientId,
          activeTab:
            state.selectedPatientId === id
              ? ("finder" as ActiveTab)
              : state.activeTab,
        }));
      },

      getPatientById: (id: string): Patient | undefined =>
        get().patients.find((p: Patient): boolean => p.id === id),

      // Appointment Collection
      appointments: initialAppointments,

      addAppointment: (input: CreateAppointmentInput): Appointment => {
        const newAppointment: Appointment = {
          ...input,
          id: `apt-${Date.now()}`,
        };

        set((state: DentineState) => ({
          appointments: [...state.appointments, newAppointment],
        }));

        return newAppointment;
      },

      updateAppointment: (id: string, input: UpdateAppointmentInput): void => {
        set((state: DentineState) => ({
          appointments: state.appointments.map(
            (apt: Appointment): Appointment =>
              apt.id === id ? { ...apt, ...input } : apt,
          ),
        }));
      },

      deleteAppointment: (id: string): void => {
        set((state: DentineState) => ({
          appointments: state.appointments.filter(
            (apt: Appointment): boolean => apt.id !== id,
          ),
        }));
      },

      resetToDefaults: (): void => {
        set({
          patients: initialPatients,
          appointments: initialAppointments,
          selectedPatientId: null,
          activeTab: "finder" as ActiveTab,
        });
      },
    }),
    {
      name: "dentine_storage", // Key used in localStorage
      storage: createJSONStorage(() => localStorage),
      // Optionally choose which parts of state to persist:
      partialize: (state: DentineState) => ({
        patients: state.patients,
        appointments: state.appointments,
        selectedPatientId: state.selectedPatientId,
        activeTab: state.activeTab,
      }),
    },
  ),
);
