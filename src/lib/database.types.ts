export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; first_name: string | null; last_name: string | null; is_admin: boolean; created_at: string }
        Insert: { id: string; email: string; first_name?: string | null; last_name?: string | null; is_admin?: boolean; created_at?: string }
        Update: { id?: string; email?: string; first_name?: string | null; last_name?: string | null; is_admin?: boolean; created_at?: string }
      }
      medications: {
        Row: { id: string; name: string; available_dosages: string[] }
        Insert: { id?: string; name: string; available_dosages: string[] }
      }
      appointments: {
        Row: { id: string; patient_id: string; provider_name: string; first_appointment_date: string; end_date: string | null; repeat_schedule: string; status: string | null }
        Insert: { id?: string; patient_id: string; provider_name: string; first_appointment_date: string; end_date?: string | null; repeat_schedule: string; status?: string | null }
        Update: { id?: string; patient_id?: string; provider_name?: string; first_appointment_date?: string; end_date?: string | null; repeat_schedule?: string; status?: string | null }
      }
      prescriptions: {
        Row: { id: string; patient_id: string; medication_id: string; dosage: string; quantity: number; refill_date: string; refill_schedule: string }
        Insert: { id?: string; patient_id: string; medication_id: string; dosage: string; quantity: number; refill_date: string; refill_schedule: string }
        Update: { id?: string; patient_id?: string; medication_id?: string; dosage?: string; quantity?: number; refill_date?: string; refill_schedule?: string }
      }
    }
  }
}
