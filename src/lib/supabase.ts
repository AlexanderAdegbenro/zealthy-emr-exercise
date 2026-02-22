import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { SupportedStorage } from "@supabase/supabase-js";
import { ENV } from "@/src/config/env";
import { Database } from "@/src/lib/database.types";
import { zealthyAlert } from "@/src/utils/alerts";

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

// 1. Validate Environment on Boot (env.ts warns; we throw here to avoid invalid client)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase Environment Variables.");
}

// SSR-safe storage: no window during Expo Router server render (web)
const storage: SupportedStorage =
  typeof window === "undefined"
    ? {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      }
    : AsyncStorage;

// 2. Initialize Client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * KILL SWITCH LOGIC (The "Integrity Check")
 * This function should be called in your root _layout.tsx.
 * Verifies the Supabase project is reachable (valid keys, network). Does not require
 * any user data to exist; empty tables are valid. For a config-based kill switch,
 * add an app_config table and check is_active there instead.
 */
export const validateProjectIntegrity = async () => {
  try {
    // Lightweight reachability check: can we run a query? (No .single() so 0 rows is OK.)
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) {
      renderAccessDenied();
      return false;
    }
    return true;
  } catch {
    renderAccessDenied();
    return false;
  }
};

const renderAccessDenied = () => {
  zealthyAlert(
    "Maintenance Mode",
    "The demo environment is currently offline for maintenance. Please contact the developer."
  );
};