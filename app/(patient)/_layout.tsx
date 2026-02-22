import { Redirect, Stack } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthProvider";

export default function PatientLayout() {
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center bg-white"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        accessibilityRole="progressbar"
        accessibilityLabel="Verifying session"
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-500 text-base">
          Verifying Session...
        </Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
