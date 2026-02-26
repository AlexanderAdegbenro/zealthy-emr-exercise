import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthProvider";
import { Database } from "@/src/lib/database.types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export interface DashboardProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
}

export interface DashboardAppointment {
  id: string;
  provider_name: string;
  first_appointment_date: string;
  status: string | null;
}

export interface DashboardPrescription {
  id: string;
  dosage: string;
  refill_date: string;
  refill_schedule: string;
  medications: {
    name: string;
  } | null;
}

export interface PatientDashboardData {
  profile: DashboardProfile | null;
  appointments: DashboardAppointment[];
  prescriptions: DashboardPrescription[];
}

function upcomingInNext7Days(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  const end = new Date(now.getTime() + SEVEN_DAYS_MS);
  return d >= now && d <= end;
}

function refillInNext14Days(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  const end = new Date(now.getTime() + FOURTEEN_DAYS_MS);
  return d >= now && d <= end;
}

export const usePatientDashboard = () => {
  const { user } = useAuth();

  const { data, isLoading, error, refetch, isRefetching } = useQuery<PatientDashboardData>({
    queryKey: ["patient-dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No authenticated user");

      const [profileRes, aptRes, rxRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, email").eq("id", user.id).single(),
        supabase.from("appointments").select("id, provider_name, first_appointment_date, status").eq("patient_id", user.id),
        supabase.from("prescriptions").select("id, dosage, refill_date, refill_schedule, medications(name)").eq("patient_id", user.id),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (aptRes.error) throw aptRes.error;
      if (rxRes.error) throw rxRes.error;

      const upcomingApts = (aptRes.data || [])
        .filter((a) => upcomingInNext7Days(a.first_appointment_date))
        .sort((a, b) => new Date(a.first_appointment_date).getTime() - new Date(b.first_appointment_date).getTime())
        .slice(0, 2) as DashboardAppointment[];

      const upcomingRx = (rxRes.data || []).filter((r) => refillInNext14Days(r.refill_date)) as unknown as DashboardPrescription[];

      return {
        profile: profileRes.data,
        appointments: upcomingApts,
        prescriptions: upcomingRx,
      };
    },
    enabled: !!user?.id,
  });

  return {
    profile: data?.profile ?? null,
    appointments: data?.appointments ?? [],
    prescriptions: data?.prescriptions ?? [],
    isLoading,
    isRefetching,
    error: error ? (error as Error).message : null,
    refetch,
  };
};
