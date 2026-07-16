import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  id: string;
  flag_key: string;
  enabled: boolean;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

async function fetchFlags(): Promise<Record<string, FeatureFlag>> {
  const { data, error } = await supabase.from("feature_flags").select("*");
  if (error) throw error;
  const map: Record<string, FeatureFlag> = {};
  (data ?? []).forEach((f: any) => {
    map[f.flag_key] = f as FeatureFlag;
  });
  return map;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["feature_flags"],
    queryFn: fetchFlags,
    staleTime: 60_000,
  });
}

export function useFeatureFlag(key: string, fallback = false): boolean {
  const { data } = useFeatureFlags();
  return data?.[key]?.enabled ?? fallback;
}
