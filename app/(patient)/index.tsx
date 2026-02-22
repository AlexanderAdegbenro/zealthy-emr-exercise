import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthProvider";
import { supabase } from "@/src/lib/supabase";
import colors from "@/src/theme/colors.js";
import { ViewFullLink } from "@/src/components/ui/ViewFullLink";
import { StatusPill } from "@/src/components/ui/StatusPill";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

type Appointment = {
  id: string;
  provider_name: string;
  first_appointment_date: string;
  status: string | null;
};

type Prescription = {
  id: string;
  dosage: string;
  refill_date: string;
  refill_schedule: string;
  medications: { name: string } | null;
};

type Profile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

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

function within48Hours(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = Date.now();
  const ms = d.getTime() - now;
  return ms > 0 && ms <= FORTY_EIGHT_HOURS_MS;
}

export default function PatientDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, aptRes, rxRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", user.id)
          .single(),
        supabase
          .from("appointments")
          .select("id, provider_name, first_appointment_date, status")
          .eq("patient_id", user.id),
        supabase
          .from("prescriptions")
          .select("id, dosage, refill_date, refill_schedule, medications(name)")
          .eq("patient_id", user.id),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (aptRes.error) throw aptRes.error;
      if (rxRes.error) throw rxRes.error;

      setProfile((profileRes.data ?? null) as Profile | null);
      const allApts = (aptRes.data ?? []) as Appointment[];
      const allRx = (rxRes.data ?? []) as Prescription[];

      const upcomingApts = allApts
        .filter((a) => upcomingInNext7Days(a.first_appointment_date))
        .sort((a, b) => new Date(a.first_appointment_date).getTime() - new Date(b.first_appointment_date).getTime())
        .slice(0, 2);
      setAppointments(upcomingApts);
      setPrescriptions(allRx.filter((r) => refillInNext14Days(r.refill_date)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <View
        className="flex-1 bg-papaya_whip-900 justify-center items-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ActivityIndicator size="large" color={colors.cerulean[500]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-papaya_whip-900">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: 40 + insets.bottom,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.cerulean[500]]} />
        }
      >
        <View
          className="bg-cerulean-600 rounded-b-[48px] pt-16 pb-12 px-8 flex-row items-center justify-between"
          style={[styles.headerShadow, { paddingTop: insets.top + 20, marginHorizontal: -24 }]}
          accessible
          accessibilityRole="header"
        >
          <View className="flex-1 mr-4">
            <Text className="text-white text-4xl font-black tracking-tighter" numberOfLines={1}>
              Hi, {profile?.first_name || "Patient"}
            </Text>
            <Text className="text-white text-lg font-bold opacity-90 mt-1" numberOfLines={1}>
              Your summary for the week
            </Text>
          </View>
          <TouchableOpacity
            className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center border border-white/10"
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {error ? (
          <View className="bg-primary_scarlet-900/20 p-4 rounded-[32px] border border-papaya_whip-800 mb-4 mt-4" style={styles.cardShadow}>
            <Text className="text-primary_scarlet-500 font-medium">{error}</Text>
          </View>
        ) : null}

        <Text className="text-slate-900 font-bold text-xl mb-4 mt-8 px-2">Your Schedule</Text>
        <View
          className="bg-white rounded-[32px] p-6 mb-4"
          style={styles.cardShadow}
        >
          {appointments.length > 0 ? (
            <>
              <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-3">
                Upcoming Appointments
              </Text>
              {appointments.map((apt) => {
                const isUrgent = within48Hours(apt.first_appointment_date);
                return (
                  <View key={apt.id} className="mb-6 last:mb-0">
                    <View className="flex-row items-center flex-wrap gap-2 mb-2">
                      <Text className="text-xl font-bold text-cerulean-100 flex-1">
                        {new Date(apt.first_appointment_date).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                      {isUrgent ? (
                        <View className="bg-bright_amber-500 rounded-full px-4 py-1.5 shadow-sm">
                          <Text className="text-white font-bold text-xs uppercase">Urgent</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-xl font-bold text-cerulean-100 mb-2">{apt.provider_name}</Text>
                    {apt.status ? (
                      <StatusPill label={apt.status} variant="info" />
                    ) : null}
                  </View>
                );
              })}
            </>
          ) : (
            <View className="bg-cerulean-50 rounded-[24px] py-8 px-6 items-center">
              <View className="w-14 h-14 rounded-2xl bg-cerulean-900/40 items-center justify-center mb-3">
                <Feather name="calendar" size={28} color={colors.cerulean[400]} />
              </View>
              <Text className="text-cerulean-500 font-semibold text-center">
                {"You're"} all set for this week!
              </Text>
            </View>
          )}
          <ViewFullLink
            label="View full 90-day schedule"
            onPress={() => router.push("/(patient)/appointments")}
          />
        </View>

        <Text className="text-slate-900 font-bold text-xl mb-4 mt-8 px-2">Refills Due</Text>
        <View
          className="bg-white rounded-[32px] p-6 mb-4"
          style={styles.cardShadow}
        >
          {prescriptions.length > 0 ? (
            <>
              {prescriptions.map((rx) => {
                const medName = (rx.medications as { name: string } | null)?.name ?? "Medication";
                return (
                  <View key={rx.id} className="mb-6 last:mb-0">
                    <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-1">Medication</Text>
                    <Text className="text-xl font-bold text-cerulean-100 mb-2">{medName}</Text>
                    <View className="flex-row items-center justify-between">
                      <View className="bg-turquoise_surf-500 rounded-full px-4 py-2 shadow-sm">
                        <Text className="text-white font-semibold text-sm">{rx.dosage}</Text>
                      </View>
                      <Text className="text-sm font-semibold text-cerulean-100">
                          {new Date(rx.refill_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <View className="bg-cerulean-50 rounded-[24px] py-8 px-6 items-center">
              <View className="w-14 h-14 rounded-2xl bg-cerulean-900/40 items-center justify-center mb-3">
                <Feather name="check-circle" size={28} color={colors.cerulean[400]} />
              </View>
              <Text className="text-cerulean-500 font-semibold text-center">
                {"You're"} all set for this week!
              </Text>
            </View>
          )}
          <ViewFullLink
            label="View full 90-day refills"
            onPress={() => router.push("/(patient)/medications")}
          />
        </View>

        <View className="items-center py-8" style={{ paddingBottom: insets.bottom + 24 }}>
          <TouchableOpacity
            onPress={() => supabase.auth.signOut()}
            className="py-3 rounded-2xl"
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            activeOpacity={0.8}
          >
            <Text className="text-primary_scarlet-500 font-bold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerShadow: {
    shadowColor: colors.cerulean[900],
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  cardShadow: {
    shadowColor: "#06536c",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
});
