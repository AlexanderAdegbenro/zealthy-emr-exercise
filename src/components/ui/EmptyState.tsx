import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <View className="border-2 border-dashed border-cerulean-100 rounded-3xl p-10 items-center justify-center">
      {icon && (
        <View className="mb-4">
          <Ionicons name={icon} size={48} color="#9ccddc" />
        </View>
      )}
      <Text className="text-cerulean-300 font-medium text-center">
        {message}
      </Text>
    </View>
  );
}
