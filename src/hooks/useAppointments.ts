import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { AppointmentInput } from "../services/adminService";

export const useAppointments = (patientId: string) => {
  return useQuery({
    queryKey: ["appointments", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .order("first_appointment_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: AppointmentInput) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: appointmentData.patient_id,
          provider_name: appointmentData.provider_name,
          first_appointment_date: appointmentData.first_appointment_date,
          repeat_schedule: appointmentData.repeat_schedule,
          status: appointmentData.status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the appointments query for the specific patient
      queryClient.invalidateQueries({ 
        queryKey: ["appointments", variables.patient_id] 
      });
    },
  });
};
