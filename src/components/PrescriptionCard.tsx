import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PrescriptionCardProps {
  medicationName: string;
  dosage: string;
  quantity?: number | string;
  refillDate: string;
  refillSchedule?: string;
  instructions?: string;
  onDelete?: () => void;
}

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.1,
  shadowRadius: 25,
  elevation: 12,
};

export function PrescriptionCard({
  medicationName,
  dosage,
  quantity,
  refillDate,
  refillSchedule,
  instructions,
  onDelete,
}: PrescriptionCardProps) {
  const refillFormatted = new Date(refillDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const subParts = [quantity ? `Qty: ${quantity}` : null, refillSchedule].filter(Boolean);
  const refillLine = `Refill ${refillFormatted}`;
  const subtext = [...subParts, refillLine].filter(Boolean).join(" • ");

  return (
    <View
      className="relative bg-white p-6 rounded-[30px] border border-papaya_whip-800 mb-4"
      style={cardShadow}
    >
      {onDelete ? (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="absolute top-3 right-3 z-10 flex-row items-center gap-1.5"
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={14} color="#dd1c1a" />
          <Text className="text-primary_scarlet-500 font-bold text-xs">Remove</Text>
        </TouchableOpacity>
      ) : null}
      <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">
        Refill due
      </Text>
      <View className="bg-turquoise_surf-500 rounded-full px-4 py-2 self-start mb-2">
        <Text className="text-white font-semibold text-sm">{medicationName} – {dosage}</Text>
      </View>
      <Text className="text-slate-900 font-medium text-base mt-1">{subtext}</Text>
      {instructions ? (
        <Text className="text-slate-900 font-medium mt-0.5 text-sm" numberOfLines={2}>
          {instructions}
        </Text>
      ) : null}
    </View>
  );
}
