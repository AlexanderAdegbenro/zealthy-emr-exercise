import React from "react";
import { View, ViewProps, Platform } from "react-native";
import colors from "@/src/theme/colors.js";

export interface MedicalCardProps extends ViewProps {
  children: React.ReactNode;
}

const cardShadow = {
  // Use a softer cerulean for the shadow so it feels "airy"
  shadowColor: colors.cerulean[300], 
  shadowOffset: { width: 0, height: 15 },
  shadowOpacity: 0.08, // Very low opacity is key for 2026 design
  shadowRadius: 30,
  ...Platform.select({
    android: {
      elevation: 8, // Android needs a lower elevation to avoid the "boxy" look
    },
  }),
};

/**
 * Modern 2026 Medical Card
 * Features: High-radius corners, tinted floating shadow, and no harsh outlines.
 */
export function MedicalCard({ children, className = "", style, ...props }: MedicalCardProps) {
  return (
    <View
      className={`bg-white rounded-[32px] p-6 mb-5 ${className}`.trim()}
      style={[
        cardShadow, 
        { 
          borderWidth: 1, 
          borderColor: colors.papaya_whip[800] 
        },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}