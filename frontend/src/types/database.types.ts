export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_log: {
        Row: {
          action: string
          actor_id: string | null
          clinic_id: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          patient_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          clinic_id: string
          created_at?: string
          details?: Json
          entity_id: string
          entity_type: string
          id?: string
          patient_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          clinic_id?: string
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_log_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string | null
          end_time: string
          id: string
          notes: string | null
          operatory_number: number
          patient_id: string
          start_time: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id?: string | null
          end_time: string
          id?: string
          notes?: string | null
          operatory_number?: number
          patient_id: string
          start_time: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          operatory_number?: number
          patient_id?: string
          start_time?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          name: string
          patient_id: string
          storage_path: string
          type: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          name: string
          patient_id: string
          storage_path: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          name?: string
          patient_id?: string
          storage_path?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      employee: {
        Row: {
          clinic_id: string
          created_at: string
          details: Json
          id: string
          name: string
          role: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          details?: Json
          id?: string
          name: string
          role?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          details?: Json
          id?: string
          name?: string
          role?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          num_days: number
          patient_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          num_days: number
          patient_id: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          num_days?: number
          patient_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice: {
        Row: {
          clinic_id: string
          created_at: string
          details: Json
          id: string
          patient_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          details?: Json
          id?: string
          patient_id: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          details?: Json
          id?: string
          patient_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      lab: {
        Row: {
          address: string | null
          clinic_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_procedure: {
        Row: {
          clinic_id: string
          cost: number
          created_at: string
          estimated_turnaround_days: number
          id: string
          lab_id: string
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          cost?: number
          created_at?: string
          estimated_turnaround_days?: number
          id?: string
          lab_id: string
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          cost?: number
          created_at?: string
          estimated_turnaround_days?: number
          id?: string
          lab_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_procedure_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_procedure_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "lab"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_test: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string | null
          id: string
          lab_procedure_id: string
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          lab_procedure_id: string
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          lab_procedure_id?: string
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_test_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_test_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_test_lab_procedure_id_fkey"
            columns: ["lab_procedure_id"]
            isOneToOne: false
            referencedRelation: "lab_procedure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_test_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      patient: {
        Row: {
          clinic_id: string
          created_at: string
          details: Json
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          details?: Json
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          details?: Json
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          id: string
          invoice_id: string | null
          patient_id: string
          payment_method: string
          transaction_ref: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          clinic_id: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          patient_id: string
          payment_method: string
          transaction_ref?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          patient_id?: string
          payment_method?: string
          transaction_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription: {
        Row: {
          clinic_id: string
          created_at: string
          details: Json
          doctor_id: string | null
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          details?: Json
          doctor_id?: string | null
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          details?: Json
          doctor_id?: string | null
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure: {
        Row: {
          clinic_id: string
          cost: number
          created_at: string
          id: string
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          cost?: number
          created_at?: string
          id?: string
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          cost?: number
          created_at?: string
          id?: string
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder: {
        Row: {
          asof_datetime: string
          clinic_id: string
          created_at: string
          details: Json
          due_at: string
          employee_id: string | null
          id: string
          remind_in_days: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          asof_datetime: string
          clinic_id: string
          created_at?: string
          details?: Json
          due_at: string
          employee_id?: string | null
          id?: string
          remind_in_days?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          asof_datetime?: string
          clinic_id?: string
          created_at?: string
          details?: Json
          due_at?: string
          employee_id?: string | null
          id?: string
          remind_in_days?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plan: {
        Row: {
          clinic_id: string
          created_at: string
          details: Json
          doctor_id: string | null
          id: string
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          details?: Json
          doctor_id?: string | null
          id?: string
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          details?: Json
          doctor_id?: string | null
          id?: string
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_note: {
        Row: {
          clinic_id: string
          created_at: string
          details: Json
          doctor_id: string | null
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          details?: Json
          doctor_id?: string | null
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          details?: Json
          doctor_id?: string | null
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_note_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_note_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_note_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
