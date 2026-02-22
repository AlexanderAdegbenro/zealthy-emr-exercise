import { z } from "zod";

export const NewPatientSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters."),
  last_name: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters for testing."),
});

export const AppointmentSchema = z.object({
  provider_name: z.string().min(2, "Provider name is required."),
  first_appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  repeat_schedule: z.enum(["none", "weekly", "monthly"]),
});

export const PrescriptionSchema = z.object({
  medication_id: z.string().uuid("Invalid medication ID."),
  dosage: z.string().min(1, "Dosage is required."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  frequency: z.string().min(1, "Frequency is required (e.g., 'Once daily')."),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  instructions: z.string().optional(),
});

export type NewPatientFormValues = z.infer<typeof NewPatientSchema>;
export type AppointmentFormValues = z.infer<typeof AppointmentSchema>;
export type PrescriptionFormValues = z.infer<typeof PrescriptionSchema>;
