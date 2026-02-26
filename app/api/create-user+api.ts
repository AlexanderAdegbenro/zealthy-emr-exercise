/**
 * Admin-only API: creates auth user + profile. Uses server env (SUPABASE_SERVICE_ROLE_KEY).
 */
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/src/lib/database.types";
import { getServerEnv } from "@/src/config/serverEnv";

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export async function POST(request: Request) {
  const serverEnv = getServerEnv();
  if (!serverEnv) {
    return Response.json(
      { success: false, error: "Server configuration missing: SUPABASE_SERVICE_ROLE_KEY is required." },
      { status: 500 }
    );
  }
  const { supabaseUrl, serviceRoleKey } = serverEnv;

  let body: { email?: string; password?: string; first_name?: string; last_name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const { email, password, first_name, last_name } = body;

  if (!email?.trim() || !password?.trim()) {
    return Response.json({ success: false, error: "Email and password are mandatory." }, { status: 400 });
  }

  const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: { 
        first_name: first_name?.trim() ?? null, 
        last_name: last_name?.trim() ?? null 
      },
    });

    if (authError) throw authError;
    if (!data.user?.id) throw new Error("Auth user creation failed: No ID returned.");

    const profileRow: ProfileInsert = {
      id: data.user.id,
      email: data.user.email!,
      first_name: first_name?.trim() ?? null,
      last_name: last_name?.trim() ?? null,
      is_admin: false,
      created_at: new Date().toISOString(),
    };
    // upsert with onConflict so we stay safe if auth trigger and this handler both insert
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profileRow as any, { onConflict: "id" });

    if (profileError) throw profileError;

    return Response.json({ 
      success: true, 
      id: data.user.id,
      message: "Patient record and auth credentials created successfully." 
    }, { status: 201 });

  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || "An internal server error occurred." },
      { status: err.status || 500 }
    );
  }
}