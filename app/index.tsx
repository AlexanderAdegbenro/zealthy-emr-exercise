import { Redirect } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthProvider";

export default function Index() {
  const insets = useSafeAreaInsets();
  const { session, isAdmin, loading } = useAuth();

  // --- Wait for AuthProvider to finish checking Supabase ---
  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center bg-white"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        accessibilityRole="progressbar"
        accessibilityLabel="Checking authentication"
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-500 text-base">Verifying session...</Text>
      </View>
    );
  }

  // --- Traffic control ---
  if (session && isAdmin) {
    return <Redirect href="/admin" />;
  }

  if (session && !isAdmin) {
    return <Redirect href="/(patient)" />;
  }

  return <Redirect href="/login" />;
}
