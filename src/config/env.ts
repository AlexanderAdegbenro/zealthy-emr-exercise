export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.warn("⚠️ Missing Supabase Environment Variables. Check your .env file.");
}
