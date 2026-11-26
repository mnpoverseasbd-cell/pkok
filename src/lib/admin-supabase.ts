import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function getEnv(viteKey: string, serverKey: string): string {
  const fromImportMeta =
    typeof import.meta !== "undefined"
      ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[viteKey])
      : undefined;
  if (fromImportMeta) return fromImportMeta;
  if (typeof process !== "undefined" && process.env) {
    return process.env[viteKey] || process.env[serverKey] || "";
  }
  return "";
}

function isNewSupabaseApiKey(key: string): boolean {
  return key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
}

function createSupabaseFetch(apiKey: string): typeof fetch {
  return async (input, init) => {
    const baseHeaders =
      init?.headers ?? (input instanceof Request ? input.headers : undefined);
    const headers = new Headers(baseHeaders);
    if (isNewSupabaseApiKey(apiKey) && headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    if (apiKey) {
      headers.set("apikey", apiKey);
    }
    return fetch(input, { ...init, headers });
  };
}

let _adminSupabase: SupabaseClient<Database> | null = null;

function getAdminSupabaseClient(): SupabaseClient<Database> {
  if (_adminSupabase) return _adminSupabase;
  const supabaseUrl = getEnv("VITE_SUPABASE_URL", "SUPABASE_URL");
  const supabaseKey = getEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY");

  _adminSupabase = createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      fetch: createSupabaseFetch(supabaseKey),
    },
    auth: {
      storageKey: "pkok-admin-portal-auth",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return _adminSupabase;
}

/**
 * Isolated Supabase client for the standalone Admin Portal (`/admin`).
 * Uses a dedicated localStorage key (`pkok-admin-portal-auth`) so logging in
 * or out as a customer on the main site never overwrites or clears the admin session.
 */
export const adminSupabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getAdminSupabaseClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
