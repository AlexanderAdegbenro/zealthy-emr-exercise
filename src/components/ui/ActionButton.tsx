import React from "react";
import { Pressable, Text } from "react-native";

export type ActionButtonVariant = "danger" | "primary";

export interface ActionButtonProps {
  onPress: () => void;
  label: string;
  variant?: ActionButtonVariant;
}

const variantBg: Record<ActionButtonVariant, string> = {
  danger: "bg-primary_scarlet-50",
  primary: "bg-cerulean-50",
};

const variantText: Record<ActionButtonVariant, string> = {
  danger: "text-primary_scarlet-500",
  primary: "text-cerulean-600",
};

/**
 * Button for primary/destructive actions inside cards (e.g. 'Remove', 'End Series').
 */
export function ActionButton({
  onPress,
  label,
  variant = "primary",
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={({ pressed }) =>
        `rounded-lg px-4 py-2.5 ${variantBg[variant]} ${pressed ? "opacity-80" : ""}`
      }
    >
      <Text className={`font-semibold text-sm ${variantText[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}
