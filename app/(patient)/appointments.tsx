import React, { useCallback } from "react";
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import colors from "@/src/theme/colors.js";
import { platformShadow } from "@/src/utils/shadows";
import { within48Hours, get90DayRange } from "@/src/utils/dateHelpers";
import { usePatientAppointments, AppointmentRow, AppointmentSection } from "@/src/hooks/patient/usePatientAppointments";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { MedicalCard } from "@/src/components/ui/MedicalCard";
import { StatusPill } from "@/src/components/ui/StatusPill";

export default function PatientFullSchedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sections, isLoading, error } = usePatientAppointments();

  const renderHeader = useCallback(() => (
    <View
      className="relative bg-cerulean-600 rounded-b-[40px] px-6 pb-10 items-center"
      style={{ paddingTop: insets.top + 20, ...headerShadow }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ position: "absolute", left: 16, top: insets.top, zIndex: 10, padding: 8 }}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View className="pt-12 items-center w-full">
        <Text className="text-white text-3xl font-black tracking-tight text-center">90-Day Schedule</Text>
        <Text className="text-white text-lg font-semibold text-center mt-1">{get90DayRange()}</Text>
      </View>
    </View>
  ), [insets.top, router]);

  const renderItem = useCallback(({ item: apt }: { item: AppointmentRow }) => {
    const isUrgent = within48Hours(apt.first_appointment_date);
    const dateObj = new Date(apt.first_appointment_date);
    const dayMonth = dateObj.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
    const weekday = dateObj.toLocaleDateString(undefined, { weekday: "long" });

    return (
      <View className="px-6">
        <MedicalCard>
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-1">
                Appointment Date
              </Text>
              <Text className="text-2xl font-black text-cerulean-100">{dayMonth}</Text>
              <Text className="text-slate-600 font-semibold">{weekday}</Text>
            </View>
            {isUrgent && (
              <View className="bg-bright_amber-500 rounded-full px-3 py-1">
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
  }, []);

  const renderSectionHeader = useCallback(({ section: { title } }: { section: AppointmentSection }) => (
    <Text className="text-cerulean-100 font-black text-xs uppercase tracking-[2px] mt-10 mb-4 px-6">
      {title}
    </Text>
  ), []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-papaya_whip-900 justify-center items-center">
        <ActivityIndicator color={colors.cerulean[500]} size="large" />
        <Text className="mt-4 text-cerulean-500 font-bold uppercase tracking-widest text-xs">
          Loading Care Plan
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-papaya_whip-900">
      {error ? (
        <View className="px-6 pt-6">
          <Text className="text-primary_scarlet-500 font-medium text-center">{error}</Text>
        </View>
      ) : null}
      <SectionList
        sections={sections}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="px-6 pt-12">
            <EmptyState message="No appointments scheduled for the next 90 days." icon="calendar-outline" />
          </View>
        }
      />
    </View>
  );
}

const headerShadow = platformShadow({ color: colors.cerulean[900], offsetY: 10, blur: 20, opacity: 0.2, elevation: 15 });
