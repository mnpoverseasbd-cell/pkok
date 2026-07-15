import type { Game, LaunchContext } from "@/game-engine/Game";
import type { GameMetadata, LaunchResult } from "@/core/types";

/**
 * Base class for games built in-house. Concrete internal games extend this
 * and provide their own launch/close implementations.
 */
export abstract class InternalGame implements Game {
  abstract readonly metadata: GameMetadata;

  get id() {
    return this.metadata.id;
  }
  getMetadata() {
    return this.metadata;
  }
  supportsDemo() {
    return this.metadata.supportsDemo;
  }
  supportsReal() {
    return this.metadata.supportsReal;
  }
  supportsFavorite() {
    return this.metadata.supportsFavorite;
  }
  abstract launch(ctx: LaunchContext): Promise<LaunchResult>;
  async close(_sessionId?: string): Promise<void> {}
}
