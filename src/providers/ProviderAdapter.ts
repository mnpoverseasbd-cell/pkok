import type { Game, LaunchContext } from "@/game-engine/Game";
import type { GameMetadata, LaunchResult, ProviderInfo } from "@/core/types";

/**
 * Interface every external gaming provider must implement.
 * Placeholder adapters throw NotImplementedError for every runtime method
 * until real credentials + SDK are wired via a server function.
 */
export interface ProviderAdapter {
  readonly info: ProviderInfo;

  /** Static catalog the provider exposes (safe for SSR, no secrets). */
  listGames(): GameMetadata[];

  /** Build a Game object bound to this adapter for a given metadata id. */
  buildGame(metadata: GameMetadata): Game;

  // ---- Runtime methods (require credentials — implement per provider) ----
  createPlayer(userId: string): Promise<{ providerUserId: string }>;
  launchGame(gameId: string, ctx: LaunchContext): Promise<LaunchResult>;
  getBalance(userId: string): Promise<{ amount: number; currency: string }>;
  syncTransaction(payload: unknown): Promise<void>;
  handleWebhook(payload: unknown, signature?: string): Promise<Response>;
  authenticate(): Promise<{ token: string; expiresAt: number }>;
}
