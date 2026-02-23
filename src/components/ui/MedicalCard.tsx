import React from "react";
import { View, ViewProps } from "react-native";
import colors from "@/src/theme/colors.js";
import { platformShadow } from "@/src/utils/shadows";

export interface MedicalCardProps extends ViewProps {
  children: React.ReactNode;
}

// Very low opacity is key for 2026 design; elevation only on Android to avoid "boxy" look
const cardShadow = platformShadow({ color: colors.cerulean[300], offsetY: 15, blur: 30, opacity: 0.08, elevation: 8 });

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