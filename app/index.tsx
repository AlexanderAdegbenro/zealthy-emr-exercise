import { Redirect } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthProvider";
import colors from "@/src/theme/colors.js";

export default function Index() {
  const insets = useSafeAreaInsets();
  const { session, isAdmin, loading } = useAuth();

  // --- Wait for AuthProvider to finish checking Supabase ---
  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center bg-papaya_whip-900"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        accessibilityRole="progressbar"
        accessibilityLabel="Checking authentication"
      >
        <ActivityIndicator size="large" color={colors.cerulean[500]} />
        <Text className="mt-4 text-cerulean-400 text-base">Verifying session...</Text>
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
