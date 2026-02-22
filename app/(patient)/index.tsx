import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthProvider";
import { supabase } from "../../src/lib/supabase";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

function inNext7Days(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  const end = new Date(now.getTime() + SEVEN_DAYS_MS);
  return d >= now && d <= end;
}

export default function PatientDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [aptRes, rxRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, provider_name, first_appointment_date, status")
          .eq("patient_id", user.id),
        supabase
          .from("prescriptions")
          .select("id, dosage, refill_date, refill_schedule, medications(name)")
          .eq("patient_id", user.id),
      ]);

      if (aptRes.error) throw aptRes.error;
      if (rxRes.error) throw rxRes.error;

      const allApts = (aptRes.data ?? []) as Appointment[];
      const allRx = (rxRes.data ?? []) as Prescription[];

      setAppointments(allApts.filter((a) => inNext7Days(a.first_appointment_date)));
      setPrescriptions(allRx.filter((r) => inNext7Days(r.refill_date)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View
        className="flex-1 bg-slate-50 justify-center items-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ActivityIndicator size="large" color="#086788" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Splash - full width with rounded bottom */}
      <View
        className="bg-cerulean-600 pb-10 pt-6 px-6 rounded-b-[40px] mb-8"
        style={{ paddingTop: insets.top + 24, marginHorizontal: -24 }}
        accessible={true}
        accessibilityRole="header"
      >
        <Text className="text-3xl font-bold text-white">Welcome Back</Text>
        <Text className="text-white/90 mt-1 text-base">Next 7 days at a glance</Text>
      </View>

      {error ? (
        <View className="bg-primary_scarlet-900/20 p-4 rounded-xl border border-primary_scarlet-500 mb-4">
          <Text className="text-primary_scarlet-500 font-medium">{error}</Text>
        </View>
      ) : null}

      {/* 7-Day time pill */}
      <View className="flex-row items-center mb-5">
        <View className="bg-turquoise_surf-100 px-4 py-2 rounded-full flex-row items-center">
          <Ionicons name="time-outline" size={18} color="#036980" />
          <Text className="text-turquoise_surf-700 font-semibold text-sm ml-2">Within 7 Days</Text>
        </View>
      </View>

      <View className="gap-y-8">
        {/* Appointments Section */}
        <View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-cerulean-700 font-bold text-base">Appointments</Text>
            <TouchableOpacity
              onPress={() => router.push("/(patient)/appointments")}
              className="bg-cerulean-900/50 px-3 py-1.5 rounded-lg"
              activeOpacity={0.8}
            >
              <Text className="text-cerulean-600 font-semibold text-sm">View 3-Month →</Text>
            </TouchableOpacity>
          </View>

          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <View
                key={apt.id}
                className="bg-white p-5 rounded-2xl border border-cerulean-900/40 mb-4"
                style={styles.cardShadow}
              >
                <Text className="text-cerulean-700 font-bold text-base">
                  {new Date(apt.first_appointment_date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text className="text-slate-400 mt-1">{apt.provider_name}</Text>
                {apt.status ? (
                  <Text className="text-slate-400 text-sm mt-1">{apt.status}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <View className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-8 items-center mb-4">
              <View className="w-14 h-14 rounded-2xl bg-slate-200 items-center justify-center mb-3">
                <Ionicons name="calendar-outline" size={28} color="#64748b" />
              </View>
              <Text className="text-slate-500 font-medium text-center">
                No appointments in the next 7 days.
              </Text>
            </View>
          )}
        </View>

        {/* Prescriptions / Refills Section */}
        <View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-cerulean-700 font-bold text-base">Refills Due</Text>
            <TouchableOpacity
              onPress={() => router.push("/(patient)/medications")}
              className="bg-cerulean-900/50 px-3 py-1.5 rounded-lg"
              activeOpacity={0.8}
            >
              <Text className="text-cerulean-600 font-semibold text-sm">View 3-Month →</Text>
            </TouchableOpacity>
          </View>

          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => (
              <View
                key={rx.id}
                className="bg-white p-5 rounded-2xl border border-cerulean-900/40 mb-4"
                style={styles.cardShadow}
              >
                <Text className="text-cerulean-700 font-bold text-base">
                  {(rx.medications as { name: string } | null)?.name ?? "Medication"}
                </Text>
                <Text className="text-slate-400 mt-1">
                  {rx.dosage} · Refill {new Date(rx.refill_date).toLocaleDateString()}
                </Text>
                {rx.refill_schedule ? (
                  <Text className="text-slate-400 text-sm mt-1">{rx.refill_schedule}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <View className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-8 items-center mb-4">
              <View className="w-14 h-14 rounded-2xl bg-slate-200 items-center justify-center mb-3">
                <Ionicons name="medkit-outline" size={28} color="#64748b" />
              </View>
              <Text className="text-slate-500 font-medium text-center">
                No refills due in the next 7 days.
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => supabase.auth.signOut()}
        className="mt-12 py-4 items-center"
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        activeOpacity={0.8}
      >
        <Text className="text-primary_scarlet-500 font-bold">Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});
