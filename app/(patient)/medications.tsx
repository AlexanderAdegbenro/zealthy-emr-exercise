import React, { useCallback } from "react";
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import colors from "@/src/theme/colors.js";
import { platformShadow } from "@/src/utils/shadows";
import { get90DayRange } from "@/src/utils/dateHelpers";
import { usePatientPrescriptions, PrescriptionRow, PrescriptionSection } from "@/src/hooks/patient/usePatientPrescriptions";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { MedicalCard } from "@/src/components/ui/MedicalCard";

export default function PatientMedicationsSchedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sections, isLoading, error } = usePatientPrescriptions();

  const renderHeader = useCallback(() => (
    <View
      className="relative bg-cerulean-600 rounded-b-[48px] px-8 pb-12 items-center"
      style={[headerShadow, { paddingTop: insets.top + 20 }]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ position: "absolute", left: 16, top: insets.top, zIndex: 10, padding: 8 }}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View className="pt-12 items-center w-full">
        <Text className="text-white text-3xl font-black tracking-tighter text-center">Your 90-Day Refills</Text>
        <Text className="text-white text-lg font-bold opacity-90 mt-1 text-center">{get90DayRange()}</Text>
      </View>
    </View>
  ), [insets.top, router]);

  const renderItem = useCallback(({ item: rx }: { item: PrescriptionRow }) => {
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
              <Text className="text-slate-400 font-bold text-xs ml-1">Qty: {rx.quantity || "--"}</Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="refresh-cw" size={12} color="#94a3b8" />
              <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">
                Refill {refillDate}
              </Text>
            </View>
          </View>
        </MedicalCard>
      </View>
    );
  }, []);

  const renderSectionHeader = useCallback(({ section: { title } }: { section: PrescriptionSection }) => (
    <Text className="text-cerulean-100 font-black text-xs uppercase tracking-[2px] mt-10 mb-4 px-8">
      {title}
    </Text>
  ), []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-papaya_whip-900 justify-center items-center">
        <ActivityIndicator color={colors.cerulean[500]} size="large" />
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
          <View className="px-8 pt-12">
            <EmptyState message="No active prescriptions" icon="medkit-outline" />
          </View>
        }
      />
    </View>
  );
}

const headerShadow = platformShadow({ color: colors.cerulean[900], offsetY: 10, blur: 20, opacity: 0.2, elevation: 15 });
