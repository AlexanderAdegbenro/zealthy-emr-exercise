import React from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";
import colors from "@/src/theme/colors.js";
import { ViewFullLink } from "@/src/components/ui/ViewFullLink";
import { StatusPill } from "@/src/components/ui/StatusPill";
import { haptics } from "@/src/utils/haptics";
import { platformShadow } from "@/src/utils/shadows";
import { usePatientDashboard, DashboardAppointment, DashboardPrescription } from "../../src/hooks/patient/usePatientDashboard";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

function within48Hours(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = Date.now();
  const ms = d.getTime() - now;
  return ms > 0 && ms <= FORTY_EIGHT_HOURS_MS;
}

export default function PatientDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { profile, appointments, prescriptions, isLoading, isRefetching, error, refetch } = usePatientDashboard();

  const onRefresh = () => {
    haptics.selection();
    refetch();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-papaya_whip-900 justify-center items-center" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ActivityIndicator size="large" color={colors.cerulean[500]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-papaya_whip-900">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 40 + insets.bottom, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.cerulean[500]} />
        }
      >
        <View
          className="bg-cerulean-600 rounded-b-[48px] pt-16 pb-12 px-8 flex-row items-center justify-between"
          style={[headerShadow, { paddingTop: insets.top + 20, marginHorizontal: -24 }]}
        >
          <View className="flex-1 mr-4">
            <Text className="text-white text-4xl font-black tracking-tighter" numberOfLines={1}>
              Hi, {profile?.first_name || "Patient"}
            </Text>
            <Text className="text-white text-lg font-bold opacity-90 mt-1" numberOfLines={1}>
              Your summary for the week
            </Text>
          </View>
          <TouchableOpacity className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center border border-white/10" activeOpacity={0.8}>
            <Ionicons name="person" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {error ? (
          <View className="bg-primary_scarlet-900/20 p-4 rounded-[32px] border border-papaya_whip-800 mb-4 mt-4" style={cardShadow}>
            <Text className="text-primary_scarlet-500 font-medium">{error}</Text>
          </View>
        ) : null}

        <Text className="text-slate-900 font-bold text-xl mb-4 mt-8 px-2">Your Schedule</Text>
        <View className="bg-white rounded-[32px] p-6 mb-4" style={cardShadow}>
          {appointments.length > 0 ? (
            <>
              <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-3">Upcoming Appointments</Text>
              {appointments.map((apt: DashboardAppointment) => {
                const isUrgent = within48Hours(apt.first_appointment_date);
                return (
                  <View key={apt.id} className="mb-6 last:mb-0">
                    <View className="flex-row items-center flex-wrap gap-2 mb-2">
                      <Text className="text-xl font-bold text-cerulean-100 flex-1">
                        {new Date(apt.first_appointment_date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                      </Text>
                      {isUrgent && (
                        <View className="bg-bright_amber-500 rounded-full px-4 py-1.5 shadow-sm">
                          <Text className="text-white font-bold text-xs uppercase">Urgent</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xl font-bold text-cerulean-100 mb-2">{apt.provider_name}</Text>
                    {apt.status && <StatusPill label={apt.status} variant="info" />}
                  </View>
                );
              })}
            </>
          ) : (
            <View className="bg-cerulean-50 rounded-[24px] py-8 px-6 items-center">
              <View className="w-14 h-14 rounded-2xl bg-cerulean-900/40 items-center justify-center mb-3">
                <Feather name="calendar" size={28} color={colors.cerulean[400]} />
              </View>
              <Text className="text-cerulean-500 font-semibold text-center">You&apos;re all set for this week!</Text>
            </View>
          )}
          <ViewFullLink label="View full 90-day schedule" onPress={() => router.push("/(patient)/appointments")} />
        </View>

        <Text className="text-slate-900 font-bold text-xl mb-4 mt-8 px-2">Refills Due</Text>
        <View className="bg-white rounded-[32px] p-6 mb-4" style={cardShadow}>
          {prescriptions.length > 0 ? (
            <>
              {prescriptions.map((rx: DashboardPrescription) => {
                const medName = rx.medications?.name ?? "Medication";
                return (
                  <View key={rx.id} className="mb-6 last:mb-0">
                    <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-1">Medication</Text>
                    <Text className="text-xl font-bold text-cerulean-100 mb-2">{medName}</Text>
                    <View className="flex-row items-center justify-between">
                      <View className="bg-turquoise_surf-500 rounded-full px-4 py-2 shadow-sm">
                        <Text className="text-white font-semibold text-sm">{rx.dosage}</Text>
                      </View>
                      <Text className="text-sm font-semibold text-cerulean-100">
                        {new Date(rx.refill_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
              <Text className="text-cerulean-500 font-semibold text-center">You&apos;re all set for this week!</Text>
            </View>
          )}
          <ViewFullLink label="View full 90-day refills" onPress={() => router.push("/(patient)/medications")} />
        </View>

        <View className="items-center py-8" style={{ paddingBottom: insets.bottom + 24 }}>
          <TouchableOpacity onPress={() => { haptics.medium(); supabase.auth.signOut(); }} className="py-3 rounded-2xl">
            <Text className="text-primary_scarlet-500 font-bold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ scrollView: { flex: 1 } });
const headerShadow = platformShadow({ color: colors.cerulean[900], offsetY: 16, blur: 24, opacity: 0.4, elevation: 20 });
const cardShadow = platformShadow({ color: colors.cerulean[400], offsetY: 12, blur: 24, opacity: 0.12, elevation: 12 });
