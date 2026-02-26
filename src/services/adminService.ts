import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from "@/src/lib/database.types";
import { supabase } from "@/src/lib/supabase";

type AppointmentRow = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
type PrescriptionInsert = Database['public']['Tables']['prescriptions']['Insert'];

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
  medication_id: string;
  dosage: string;
  /** Dashboard key: refill schedule (e.g. Daily, Weekly). */
  refill_schedule: string;
  /** Dashboard key: refill/start date (YYYY-MM-DD). */
  refill_date: string;
  /** Dashboard key: quantity (default 30). */
  quantity?: number;
  instructions?: string;
}

export interface CreatePatientInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export const adminService = {
  
  /**
   * PATIENTS: Creates a new patient (auth user + profile).
   * Uses a secondary client to prevent hijacking the Admin's active session.
   */
  async createPatient(data: CreatePatientInput): Promise<{ data: { id: string } | null; error: string | null }> {
    try {
      const registrationClient = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      const { data: authData, error: authError } = await registrationClient.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            first_name: data.first_name.trim(),
            last_name: data.last_name.trim(),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error('User creation failed');

      return { data: { id: authData.user.id }, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'An unexpected error occurred' };
    }
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

  async deleteAppointment(id: string) {
    if (!id) throw new Error("Missing Appointment ID");
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
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
      refill_date: data.refill_date,
      refill_schedule: data.refill_schedule,
    };
    return await supabase
      .from('prescriptions')
      .insert(row as never)
      .select()
      .single();
  },

  async deletePrescription(prescriptionId: string) {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', prescriptionId);
    if (error) throw error;
    return { success: true };
  },

  /**
   * Fetches a single patient's full EMR (profile + prescriptions with medication names).
   */
  async getPatientMedicalHistory(patientId: string) {
    if (!patientId) throw new Error("Missing Patient ID");

    return await supabase
      .from('profiles')
      .select(`
        *,
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