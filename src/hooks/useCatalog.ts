import { useMemo } from "react";
import { catalogService } from "@/services";
import type { GameCategory } from "@/core/constants";

export function useCatalog(filter?: { category?: GameCategory; providerId?: string; featured?: boolean }) {
  return useMemo(() => {
    let games = catalogService.all();
    if (filter?.category) games = games.filter((g) => g.category === filter.category);
    if (filter?.providerId) games = games.filter((g) => g.providerId === filter.providerId);
    if (filter?.featured) games = games.filter((g) => g.featured);
    return games;
  }, [filter?.category, filter?.providerId, filter?.featured]);
}
