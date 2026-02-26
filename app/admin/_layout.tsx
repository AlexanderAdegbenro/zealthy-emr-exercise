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

/** Admin stack: no auth gate so staff can open portal without logging in (per product requirement). */
export default function AdminLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen
        name="index"
        options={{ title: "Patient Directory" }}
      />
      <Stack.Screen
        name="patient/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </Stack>
  );
}