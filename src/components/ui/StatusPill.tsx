import React from "react";
import { View, Text } from "react-native";
import { platformShadow } from "@/src/utils/shadows";

export type StatusPillVariant = "info" | "warning" | "success" | "default";

export interface StatusPillProps {
  label: string;
  variant?: StatusPillVariant;
}

const variantStyles: Record<StatusPillVariant, string> = {
  info: "bg-cerulean-300",
  warning: "bg-bright_amber-300",
  success: "bg-emerald-500",
  default: "bg-papaya_whip-400",
};

const textStyles: Record<StatusPillVariant, string> = {
  info: "text-white",
  warning: "text-bright_amber-900",
  success: "text-white",
  default: "text-papaya_whip-100",
};

const pillStyle = {
  ...platformShadow({ color: "#000000", offsetY: 1, blur: 2, opacity: 0.08, elevation: 2 }),
  borderWidth: 0,
};

/**
 * Small badge for statuses (e.g. 'Weekly', 'Urgent').
 */
export function StatusPill({ label, variant = "default" }: StatusPillProps) {
  return (
    <View
      className={`self-start rounded-full px-2.5 py-1 border-0 ${variantStyles[variant]}`}
      style={pillStyle}
    >
      <Text className={`text-xs font-semibold ${textStyles[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
