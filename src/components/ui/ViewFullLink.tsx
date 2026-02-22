import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/src/theme/colors.js";

interface ViewFullLinkProps {
  label: string;
  onPress: () => void;
}

/**
 * Link-style button for "View full 90-day schedule" / "View full 90-day refills".
 * Light blue background, text on left, arrow on the right.
 */
export function ViewFullLink({ label, onPress }: ViewFullLinkProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.cerulean[50],
        borderWidth: 0,
        padding: 16,
        marginHorizontal: -24,
        marginBottom: -24,
        marginTop: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <Text
        style={{ color: colors.cerulean[500], fontWeight: "700", fontSize: 16 }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={colors.cerulean[500]} />
    </TouchableOpacity>
  );
}
