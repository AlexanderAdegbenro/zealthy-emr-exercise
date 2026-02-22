import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PrescriptionCardProps {
  medicationName: string;
  dosage: string;
  quantity: number | string;
  refillDate: string;
  refillSchedule?: string;
  instructions?: string;
}

export function PrescriptionCard({
  medicationName,
  dosage,
  quantity,
  refillDate,
  refillSchedule,
}: PrescriptionCardProps) {
  return (
    <View
      className="bg-white p-5 rounded-2xl border border-cerulean-100 mb-3"
      style={styles.cardShadow}
    >
      {/* Header: Medication Name */}
      <View className="mb-3">
        <Text className="text-cerulean-700 font-bold text-lg">
          {medicationName}
        </Text>
      </View>

      {/* Metadata Badges: Dosage & Quantity */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="bg-cerulean-50 px-3 py-1 rounded-full border border-cerulean-100">
          <Text className="text-cerulean-700 text-xs font-bold">
            {dosage}
          </Text>
        </View>
        <View className="bg-cerulean-50 px-3 py-1 rounded-full border border-cerulean-100">
          <Text className="text-cerulean-700 text-xs font-bold">
            Qty: {quantity}
          </Text>
        </View>
      </View>

      {/* Status Row: Refill Schedule & Date */}
      <View className="flex-row items-center justify-between border-t border-slate-100 pt-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <Text className="text-slate-500 text-xs font-medium">
            Refill Schedule
          </Text>
        </View>
        <Text className="text-cerulean-600 text-xs font-bold">
          {new Date(refillDate).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
