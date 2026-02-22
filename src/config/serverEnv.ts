/**
 * Server-only env (for API routes). Do not import from client code.
 * Reads SUPABASE_SERVICE_ROLE_KEY and EXPO_PUBLIC_SUPABASE_URL from .env.
 */
export function getServerEnv(): {
  supabaseUrl: string;
  serviceRoleKey: string;
} | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) return null;
  return { supabaseUrl, serviceRoleKey };
}
