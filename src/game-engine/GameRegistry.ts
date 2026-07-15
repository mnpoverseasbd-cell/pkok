import type { Game } from "./Game";

class GameRegistryImpl {
  private games = new Map<string, Game>();

  register(game: Game) {
    if (this.games.has(game.id)) {
      console.warn(`[GameRegistry] Overwriting existing game ${game.id}`);
    }
    this.games.set(game.id, game);
  }

  registerMany(games: Game[]) {
    for (const g of games) this.register(g);
  }

  get(id: string): Game | undefined {
    return this.games.get(id);
  }

  all(): Game[] {
    return Array.from(this.games.values());
  }
}

export const gameRegistry = new GameRegistryImpl();
