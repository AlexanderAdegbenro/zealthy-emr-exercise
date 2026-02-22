import React from "react";
import { View, Text } from "react-native";

export interface PatientBannerProps {
  name: string;
  subtitle?: string;
  /** Top inset (e.g. from useSafeAreaInsets().top) so banner can extend under status bar. */
  safeAreaTop?: number;
}

/**
 * Cohesive header for patient profiles and dashboards.
 */
export function PatientBanner({ name, subtitle, safeAreaTop = 0 }: PatientBannerProps) {
  return (
    <View
      className="bg-cerulean-600 p-6 rounded-b-3xl mb-4 shadow-md items-center"
      style={safeAreaTop > 0 ? { paddingTop: safeAreaTop + 16 } : undefined}
    >
      <Text className="text-white text-xl font-bold text-center" numberOfLines={1}>
        {name}
      </Text>
      {subtitle != null && subtitle !== "" && (
        <Text
          className="text-white/90 text-sm mt-1 text-center"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
