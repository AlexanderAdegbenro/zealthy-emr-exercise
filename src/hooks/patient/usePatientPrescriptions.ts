import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthProvider";

export interface PrescriptionRow {
  id: string;
  dosage: string;
  quantity?: number;
  refill_date: string;
  refill_schedule: string;
  instructions?: string | null;
  medications?: { name: string } | null;
}

export interface PrescriptionSection {
  title: string;
  data: PrescriptionRow[];
}

function groupByMonth(prescriptions: PrescriptionRow[]): PrescriptionSection[] {
  const byMonth = new Map<string, PrescriptionRow[]>();
  for (const rx of prescriptions) {
    if (!rx.refill_date) continue;
    const d = new Date(rx.refill_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(rx);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data]) => ({
      title: new Date(data[0].refill_date).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
      data,
    }));
}

export const usePatientPrescriptions = () => {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["patient-prescriptions-90day", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("prescriptions")
        .select("id, dosage, quantity, refill_date, refill_schedule, instructions, medications(name)")
        .eq("patient_id", user.id)
        .order("refill_date", { ascending: true });

      if (error) throw error;

      const now = new Date();
      const ninetyDaysFromNow = new Date(now);
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      const filtered = (data ?? []).filter((rx) => {
        if (!rx.refill_date) return false;
        const d = new Date(rx.refill_date);
        return d >= now && d <= ninetyDaysFromNow;
      }) as unknown as PrescriptionRow[];

      return {
        prescriptions: filtered,
        sections: groupByMonth(filtered),
      };
    },
    enabled: !!user?.id,
  });

  return {
    prescriptions: data?.prescriptions ?? [],
    sections: data?.sections ?? [],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
};
