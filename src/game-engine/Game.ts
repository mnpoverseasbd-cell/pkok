import type { AppUser, GameMetadata, LaunchResult } from "@/core/types";
import type { GameMode } from "@/core/constants";

export interface LaunchContext {
  user: AppUser;
  mode: GameMode;
  locale?: string;
  returnUrl?: string;
}

/**
 * Every playable game — internal or external — implements this interface.
 * The UI must never branch on provider or source; it consumes Game only.
 */
export interface Game {
  readonly id: string;
  getMetadata(): GameMetadata;
  supportsDemo(): boolean;
  supportsReal(): boolean;
  supportsFavorite(): boolean;
  launch(ctx: LaunchContext): Promise<LaunchResult>;
  close(sessionId?: string): Promise<void>;
}
