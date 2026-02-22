import "@/global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/src/context/AuthProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import colors from "@/src/theme/colors.js";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.papaya_whip[900] },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
