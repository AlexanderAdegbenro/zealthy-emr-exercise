import { Platform, Alert } from "react-native";

/**
 * Cross-platform alert: uses window.alert on web, React Native Alert on iOS/Android.
 */
export function zealthyAlert(title: string, message: string): void {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
