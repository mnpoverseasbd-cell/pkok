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
  config: {},
};

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
          .from("disabled_game_configs")
          .select("game_key")
          .eq("game_key", gameKey)
          .maybeSingle();
        if (statusError) throw statusError;

        return {
          ...DEFAULT_GAME_CONFIG,
          game_key: gameKey,
          name: gameKey,
          is_enabled: !disabled,
        };
      }
      return {
        ...data,
        min_bet: Number(data.min_bet),
        max_bet: Number(data.max_bet),
        house_edge: Number(data.house_edge),
        config: (data.config as any) ?? {},
      };
    },
    staleTime: 30_000,
  });
}

export const GameConfigContext = createContext<GameConfig>(DEFAULT_GAME_CONFIG);

export function useGameConfigCtx() {
  return useContext(GameConfigContext);
}
