import React, { useEffect, useState, useMemo } from "react";
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthProvider";
import colors from "@/src/theme/colors.js";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { MedicalCard } from "@/src/components/ui/MedicalCard";

type PrescriptionRow = { 
  id: string; 
  dosage: string; 
  quantity?: number; 
  refill_date: string; 
  refill_schedule: string; 
  instructions?: string | null; 
  medications?: { name: string } | null 
};

type Section = { title: string; data: PrescriptionRow[] };

function get90DayRange(): string {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 90);
  const startMonth = now.toLocaleDateString(undefined, { month: "short" });
  const endMonth = end.toLocaleDateString(undefined, { month: "short" });
  return `${startMonth} - ${endMonth} ${now.getFullYear()}`;
}

function groupPrescriptionsByMonth(prescriptions: PrescriptionRow[]): Section[] {
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
    .map(([_, data]) => ({ 
      title: new Date(data[0].refill_date).toLocaleDateString(undefined, { month: "long", year: "numeric" }), 
      data 
    }));
}

export default function PatientMedicationsSchedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRefills() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("prescriptions")
          .select("*, medications(name)")
          .eq("patient_id", user.id)
          .order("refill_date", { ascending: true });

        if (error) throw error;

        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
        const now = new Date();

        const filtered = (data ?? []).filter((rx: PrescriptionRow) => {
          if (!rx.refill_date) return false;
          const refillDate = new Date(rx.refill_date);
          return refillDate >= now && refillDate <= ninetyDaysFromNow;
        });

        setPrescriptions(filtered);
      } catch (err) {
        console.error("Refill Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRefills();
  }, [user?.id]);

  const sections = useMemo(() => groupPrescriptionsByMonth(prescriptions), [prescriptions]);

  const renderHeader = () => (
    <View
      className="relative bg-cerulean-600 rounded-b-[48px] px-8 pb-12 items-center"
      style={[styles.headerShadow, { paddingTop: insets.top + 20 }]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{
          position: 'absolute',
          left: 16,
          top: insets.top,
          zIndex: 10,
          padding: 8,
        }}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View className="pt-12 items-center w-full">
        <Text className="text-white text-3xl font-black tracking-tighter text-center">Your 90-Day Refills</Text>
        <Text className="text-white text-lg font-bold opacity-90 mt-1 text-center">{get90DayRange()}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-papaya_whip-900 justify-center items-center">
        <ActivityIndicator color={colors.cerulean[500]} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-papaya_whip-900">
      <SectionList
        sections={sections}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="px-8 pt-12">
            <EmptyState message="No active prescriptions" icon="medkit-outline" />
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-cerulean-100 font-black text-xs uppercase tracking-[2px] mt-10 mb-4 px-8">
            {title}
          </Text>
        )}
        renderItem={({ item: rx }) => {
          const medName = rx.medications?.name || "Medication";
          const refillDate = new Date(rx.refill_date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

          return (
            <View className="px-6">
              <MedicalCard className="mb-4 relative">
                <View className="flex-row items-start justify-between mb-1">
                  <View className="flex-1 mr-4">
                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">
                      Active Prescription
                    </Text>
                    <Text className="text-2xl font-black text-slate-900">{medName}</Text>
                  </View>
                  <Text className="text-cerulean-600 font-bold text-xs uppercase tracking-widest">
                    {rx.refill_schedule}
                  </Text>
                </View>
                
                <View className="flex-row items-center mt-3">
                  <View className="bg-turquoise_surf-500 rounded-lg px-3 py-1">
                    <Text className="text-white font-bold text-xs">{rx.dosage}</Text>
                  </View>
                </View>

                {rx.instructions && (
                  <View className="mt-4 p-3 bg-slate-50 rounded-xl">
                    <Text className="text-slate-600 font-medium text-xs leading-relaxed">
                      {rx.instructions}
                    </Text>
                  </View>
                )}
                
                <View className="mt-4 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="cube-outline" size={14} color="#94a3b8" />
                    <Text className="text-slate-400 font-bold text-xs ml-1">Qty: {rx.quantity || '--'}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="refresh-cw" size={12} color="#94a3b8" />
                    <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Refill {refillDate}</Text>
                  </View>
                </View>
              </MedicalCard>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerShadow: {
    shadowColor: colors.cerulean[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
});