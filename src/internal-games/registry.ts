import { gameRegistry } from "@/game-engine";
import type { InternalGame } from "./InternalGame";

const internalGames: InternalGame[] = [
  // Register concrete internal games here as they are built.
];

export function registerInternalGames() {
  gameRegistry.registerMany(internalGames);
}

export function listInternalGames() {
  return internalGames.map((g) => g.getMetadata());
}
