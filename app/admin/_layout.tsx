import { Stack } from "expo-router";
import colors from "@/src/theme/colors.js";

const headerOptions = {
  headerStyle: { backgroundColor: "#fffcf6" },
  headerShadowVisible: false,
  headerTintColor: colors.cerulean[600],
  headerTitleStyle: { fontWeight: "700", fontSize: 18, color: colors.cerulean[600] },
  contentStyle: { backgroundColor: "#fffcf6" },
};

export default function AdminLayout() {
  // The prompt explicitly says NO AUTH required for the admin section.
  // So we purposely DO NOT put a redirect check here.

  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen
        name="patient/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
