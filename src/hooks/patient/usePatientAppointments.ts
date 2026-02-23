import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthProvider";

export interface AppointmentRow {
  id: string;
  first_appointment_date: string;
  provider_name?: string;
  status?: string | null;
  repeat_schedule?: string;
}

export interface AppointmentSection {
  title: string;
  data: AppointmentRow[];
}

function groupByMonth(appointments: AppointmentRow[]): AppointmentSection[] {
  const byMonth = new Map<string, AppointmentRow[]>();
  for (const apt of appointments) {
    const d = new Date(apt.first_appointment_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(apt);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data]) => ({
      title: new Date(data[0].first_appointment_date).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
      data,
    }));
}

export const usePatientAppointments = () => {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["patient-appointments-90day", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("appointments")
        .select("id, first_appointment_date, provider_name, status, repeat_schedule")
        .eq("patient_id", user.id)
        .order("first_appointment_date", { ascending: true });

      if (error) throw error;

      const now = new Date();
      const ninetyDaysFromNow = new Date(now);
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      const filtered = (data ?? []).filter((apt) => {
        const d = new Date(apt.first_appointment_date);
        return d >= now && d <= ninetyDaysFromNow;
      }) as AppointmentRow[];

      return {
        appointments: filtered,
        sections: groupByMonth(filtered),
      };
    },
    enabled: !!user?.id,
  });

  return {
    appointments: data?.appointments ?? [],
    sections: data?.sections ?? [],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
};
