import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <View className="border border-papaya_whip-800 rounded-3xl p-10 items-center justify-center bg-papaya_whip-900">
      {icon && (
        <View className="mb-4">
          <Ionicons name={icon} size={48} color="#9ccddc" />
        </View>
      )}
      <Text className="text-cerulean-500 font-semibold text-center">
        {message}
      </Text>
    </View>
  );
}
