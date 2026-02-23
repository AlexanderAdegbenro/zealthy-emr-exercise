import { Platform } from "react-native";
import type { ViewStyle } from "react-native";

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

interface ShadowOptions {
  color: string;
  offsetX?: number;
  offsetY?: number;
  blur: number;
  opacity: number;
  elevation?: number;
}

/**
 * Returns cross-platform shadow styles.
 * On web: CSS `boxShadow`. On native: `shadow*` + `elevation`.
 */
export function platformShadow({
  color,
  offsetX = 0,
  offsetY = 0,
  blur,
  opacity,
  elevation = 0,
}: ShadowOptions): ViewStyle {
  if (Platform.OS === "web") {
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${hexToRgba(color, opacity)}`,
    } as ViewStyle;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}
