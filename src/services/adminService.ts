import { Platform } from 'react-native';
import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type AppointmentRow = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
type PrescriptionInsert = Database['public']['Tables']['prescriptions']['Insert'];

// --- 1. TYPES & INTERFACES ---
// Defining these here ensures your data layer remains predictable
export interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface AppointmentInput {
  patient_id: string;
  provider_name: string;
  first_appointment_date: string; // ISO date
  repeat_schedule: 'none' | 'weekly' | 'monthly';
  status?: string;
}

export interface PrescriptionInput {
  patient_id: string;
  medication_id: string; // References the seeded medications table
  dosage: string;
  quantity?: number;
  frequency: string;
  start_date: string;
  instructions?: string;
}

export interface CreatePatientInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

// --- 2. ADMIN SERVICE ---
export const adminService = {
  
  /**
   * PATIENTS: Creates a new patient (auth user + profile) via service-role API.
   * Requires EXPO_PUBLIC_APP_URL (or same-origin on web) for API route.
   */
  async createPatient(data: CreatePatientInput): Promise<{ data: { id: string } | null; error: string | null }> {
    const base =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? ''
        : (process.env.EXPO_PUBLIC_APP_URL ?? 'http://localhost:8081');
    const res = await fetch(`${base}/api/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email.trim(),
        password: data.password,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.error ?? 'Failed to create patient' };
    }
    return { data: { id: json.id }, error: null };
  },

  /**
   * PATIENTS: Fetches all registered profiles that are not administrators.
   */
  async getPatients() {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('last_name', { ascending: true });
  },
// NEW: Fetch available meds for the dropdown
  async getAvailableMedications() {
    return await supabase
      .from('medications')
      .select('*')
      .order('name', { ascending: true });
  },
  /**
   * APPOINTMENTS: Logic for creating and managing patient visits.
   */
  async createAppointment(data: AppointmentInput) {
    const row: AppointmentRow = {
      patient_id: data.patient_id,
      provider_name: data.provider_name,
      first_appointment_date: data.first_appointment_date,
      repeat_schedule: data.repeat_schedule,
      ...(data.status != null && { status: data.status }),
    };
    return await supabase
      .from('appointments')
      .insert(row as never)
      .select()
      .single();
  },

  async endRecurringAppointment(appointmentId: string) {
    if (!appointmentId) throw new Error("Missing Appointment ID");
    const update: AppointmentUpdate = {
      repeat_schedule: 'none',
      end_date: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('appointments')
      .update(update as never)
      .eq('id', appointmentId);
    if (error) throw error;
    return { success: true };
  },

  /**
   * PRESCRIPTIONS: Logic for assigning medications to patients.
   */
  async addPrescription(data: PrescriptionInput) {
    const row: PrescriptionInsert = {
      patient_id: data.patient_id,
      medication_id: data.medication_id,
      dosage: data.dosage,
      quantity: data.quantity ?? 30,
      refill_date: data.start_date,
      refill_schedule: data.frequency, // mapping frequency to refill_schedule
      instructions: data.instructions,
    };
    return await supabase
      .from('prescriptions')
      .insert(row as never)
      .select()
      .single();
  },

  /**
   * PATIENT DRILL-DOWN: Fetches a single patient's full EMR history.
   * Useful for the [id].tsx screen.
   */
  async getPatientMedicalHistory(patientId: string) {
    if (!patientId) throw new Error("Missing Patient ID");

    return await supabase
      .from('profiles')
      .select(`
      *,
      appointments(
        id, 
        first_appointment_date, 
        provider_name, 
        status, 
        repeat_schedule
      ),
      prescriptions(
        id, 
        medication_id, 
        dosage, 
        quantity,
        refill_schedule, 
        refill_date,
        medications(name)
      )
    `)
      .eq('id', patientId)
      .single();
  }
};