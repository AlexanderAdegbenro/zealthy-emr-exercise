import { Redirect, Stack } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthProvider";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/theme/colors.js";

export default function PatientLayout() {
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View 
        className="flex-1 justify-center items-center bg-papaya_whip-900"
        accessibilityRole="progressbar"
        accessibilityLabel="Verifying session"
      >
        <View className="items-center">
          <View className="bg-cerulean-100 p-4 rounded-3xl mb-6">
            <Feather name="shield" size={32} color={colors.cerulean[600]} />
          </View>
          
          <ActivityIndicator size="small" color={colors.cerulean[600]} />
          
          <Text className="mt-4 text-cerulean-800 font-bold text-sm tracking-widest uppercase opacity-60">
            Securing Connection
          </Text>
        </View>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      animation: 'fade',
    }} />
  );
}