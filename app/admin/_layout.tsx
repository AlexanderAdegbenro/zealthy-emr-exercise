import { Stack } from "expo-router";
import colors from "@/src/theme/colors.js";

const headerOptions = {
  headerStyle: { backgroundColor: colors.papaya_whip[900] },
  headerShadowVisible: false,
  headerTintColor: colors.cerulean[500],
  headerTitleStyle: {
    fontWeight: "900" as const,
    fontSize: 20,
    color: colors.cerulean[100],
  },
  contentStyle: { backgroundColor: colors.papaya_whip[900] },
  headerBackTitleVisible: false,
};

export default function AdminLayout() {
  // Authentication check is purposefully omitted per requirements.
  
  return (
    <Stack screenOptions={headerOptions}>
      {/* Search/Directory Screen */}
      <Stack.Screen
        name="index"
        options={{
          title: "Patient Directory",
        }}
      />
      
      {/* Detail Screen */}
      <Stack.Screen
        name="patient/[id]"
        options={{
          headerShown: false, // We'll use our custom deep-radius header here
          animation: "slide_from_right", // High-end transition feel
        }}
      />
    </Stack>
  );
}