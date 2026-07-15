import type { GameMetadata } from "@/core/types";
import type { GameCategory } from "@/core/constants";
import { listInternalGames } from "@/internal-games/registry";
import { listAllProviders } from "@/providers";

/**
 * Unified game catalog. Merges internal games and every registered
 * provider's static catalog into one list the UI can consume without
 * knowing the source.
 */
export const catalogService = {
  all(): GameMetadata[] {
    const internal = listInternalGames();
    const external = listAllProviders().flatMap((p) => p.listGames());
    return [...internal, ...external];
  },

  byCategory(category: GameCategory): GameMetadata[] {
    return this.all().filter((g) => g.category === category);
  },

  byProvider(providerId: string): GameMetadata[] {
    return this.all().filter((g) => g.providerId === providerId);
  },

  featured(): GameMetadata[] {
    return this.all().filter((g) => g.featured);
  },

  search(query: string): GameMetadata[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.all().filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q)),
    );
  },

  byId(id: string): GameMetadata | undefined {
    return this.all().find((g) => g.id === id);
  },
};
