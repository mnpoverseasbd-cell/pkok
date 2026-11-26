import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GameConfig = {
  id: string;
  game_key: string;
  name: string;
  is_enabled: boolean;
  min_bet: number;
  max_bet: number;
  house_edge: number;
  config: Record<string, any>;
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  id: "",
  game_key: "",
  name: "",
  is_enabled: true,
  min_bet: 10,
  max_bet: 10000,
  house_edge: 0.02,
  config: { win_rate_pct: 50, payout_multiplier: 1, max_payout_mult: 0 },
};

const activeGameConfigs = new Map<string, GameConfig>();

export function getCurrentGameKeyFromUrl(): string {
  if (typeof window === "undefined") return "";
  const m = window.location.pathname.match(/\/games\/([^/?#]+)/);
  return m ? m[1] : "";
}

export function getActiveGameConfig(gameKey?: string): GameConfig | undefined {
  const key = gameKey || getCurrentGameKeyFromUrl();
  if (!key) return undefined;
  return activeGameConfigs.get(key);
}

export function useGameConfig(gameKey: string) {
  return useQuery({
    queryKey: ["game_config", gameKey],
    queryFn: async (): Promise<GameConfig> => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        return { ...DEFAULT_GAME_CONFIG, game_key: gameKey, name: gameKey };
      }

      const { data, error } = await supabase
        .from("game_configs")
        .select("*")
        .eq("game_key", gameKey)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: disabled, error: statusError } = await supabase
          .from("feature_flags")
          .select("flag_key")
          .eq("flag_key", `game.disabled.${gameKey}`)
          .maybeSingle();
        if (statusError) throw statusError;

        const fallback = {
          ...DEFAULT_GAME_CONFIG,
          game_key: gameKey,
          name: gameKey,
          is_enabled: !disabled,
        };
        activeGameConfigs.set(gameKey, fallback);
        return fallback;
      }
      const normalized: GameConfig = {
        ...data,
        min_bet: Number(data.min_bet),
        max_bet: Number(data.max_bet),
        house_edge: Number(data.house_edge),
        config: (data.config as any) ?? {},
      };
      activeGameConfigs.set(gameKey, normalized);
      return normalized;
    },
    staleTime: 5_000,
  });
}

export const GameConfigContext = createContext<GameConfig>(DEFAULT_GAME_CONFIG);

export function useGameConfigCtx() {
  return useContext(GameConfigContext);
}
