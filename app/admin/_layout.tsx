import { Stack } from "expo-router";

export default function AdminLayout() {
  // The prompt explicitly says NO AUTH required for the admin section.
  // So we purposely DO NOT put a redirect check here.

  return <Stack />;
}
