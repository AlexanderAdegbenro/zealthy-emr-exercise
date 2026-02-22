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
import { StatusPill } from "@/src/components/ui/StatusPill";

type AppointmentRow = { id: string; first_appointment_date: string; provider_name?: string; status?: string | null; repeat_schedule?: string };
type Section = { title: string; data: AppointmentRow[] };

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

function within48Hours(isoDate: string): boolean {
  const ms = new Date(isoDate).getTime() - Date.now();
  return ms > 0 && ms <= FORTY_EIGHT_HOURS_MS;
}

function get90DayRange(): string {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 90);
  const startMonth = now.toLocaleDateString(undefined, { month: "short" });
  const endMonth = end.toLocaleDateString(undefined, { month: "short" });
  return `${startMonth} - ${endMonth} ${now.getFullYear()}`;
}

function groupAppointmentsByMonth(appointments: AppointmentRow[]): Section[] {
  const byMonth = new Map<string, AppointmentRow[]>();
  for (const apt of appointments) {
    const d = new Date(apt.first_appointment_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(apt);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_, data]) => ({ 
      title: new Date(data[0].first_appointment_date).toLocaleDateString(undefined, { month: "long", year: "numeric" }), 
      data 
    }));
}

export default function PatientFullSchedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFullSchedule() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", user.id)
          .order("first_appointment_date", { ascending: true });

        if (error) throw error;

        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
        const now = new Date();

        const filtered = (data ?? []).filter((apt: AppointmentRow) => {
          const aptDate = new Date(apt.first_appointment_date);
          return aptDate >= now && aptDate <= ninetyDaysFromNow;
        });

        setAppointments(filtered);
      } catch (err) {
        console.error("Schedule Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFullSchedule();
  }, [user?.id]);

  const sections = useMemo(() => groupAppointmentsByMonth(appointments), [appointments]);

  const renderHeader = () => (
    <View
      className="relative bg-cerulean-600 rounded-b-[40px] px-6 pb-10 items-center"
      style={{ paddingTop: insets.top + 20, ...styles.headerShadow }}
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
        <Text className="text-white text-3xl font-black tracking-tight text-center">90-Day Schedule</Text>
        <Text className="text-white text-lg font-semibold text-center mt-1">{get90DayRange()}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-papaya_whip-900 justify-center items-center">
        <ActivityIndicator color={colors.cerulean[500]} size="large" />
        <Text className="mt-4 text-cerulean-500 font-bold uppercase tracking-widest text-xs">Loading Care Plan</Text>
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
          <View className="px-6 pt-12">
            <EmptyState message="No appointments scheduled for the next 90 days." icon="calendar-outline" />
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-cerulean-100 font-black text-xs uppercase tracking-[2px] mt-10 mb-4 px-6">
            {title}
          </Text>
        )}
        renderItem={({ item: apt }) => {
          const isUrgent = within48Hours(apt.first_appointment_date);
          const dateObj = new Date(apt.first_appointment_date);
          
          return (
            <View className="px-6">
              <MedicalCard>
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-1">
                      Appointment Date
                    </Text>
                    <Text className="text-2xl font-black text-cerulean-100">
                      {dateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </Text>
                    <Text className="text-slate-600 font-semibold">
                      {dateObj.toLocaleDateString(undefined, { weekday: 'long' })}
                    </Text>
                  </View>
                  
                  {isUrgent && (
                    <View className="bg-bright_amber-500 rounded-full px-3 py-1 shadow-sm">
                      <Text className="text-white text-[10px] font-black uppercase">Urgent</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center gap-2 pt-4 border-t border-slate-50">
                  <Feather name="user" size={14} color={colors.cerulean[400]} />
                  <Text className="text-base font-bold text-slate-700 flex-1">
                    {apt.provider_name || "Assigned Provider"}
                  </Text>
                  {apt.status && <StatusPill label={apt.status} variant="info" />}
                </View>

                {apt.repeat_schedule && apt.repeat_schedule !== "none" && (
                  <View className="mt-3 flex-row items-center bg-cerulean-50 self-start px-3 py-1 rounded-lg">
                    <Feather name="refresh-cw" size={10} color={colors.turquoise_surf[600]} />
                    <Text className="text-turquoise_surf-600 text-[10px] font-bold uppercase ml-1">
                      {apt.repeat_schedule} Cycle
                    </Text>
                  </View>
                )}
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