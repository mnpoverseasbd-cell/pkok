import { NotImplementedError } from "@/core/errors";
import type { Game, LaunchContext } from "@/game-engine/Game";
import type { GameMetadata, LaunchResult, ProviderInfo } from "@/core/types";
import type { ProviderAdapter } from "../ProviderAdapter";

/**
 * Base placeholder adapter. Concrete providers extend this and override
 * once real integration lands. Every runtime method throws until wired.
 */
export abstract class PlaceholderAdapter implements ProviderAdapter {
  abstract readonly info: ProviderInfo;

  listGames(): GameMetadata[] {
    return [];
  }

  buildGame(metadata: GameMetadata): Game {
    const providerId = this.info.id;
    return {
      id: metadata.id,
      getMetadata: () => metadata,
      supportsDemo: () => metadata.supportsDemo,
      supportsReal: () => metadata.supportsReal,
      supportsFavorite: () => metadata.supportsFavorite,
      launch: async (_ctx: LaunchContext): Promise<LaunchResult> => {
        throw new NotImplementedError(`${providerId}.launch (${metadata.id})`);
      },
      close: async () => {
        throw new NotImplementedError(`${providerId}.close`);
      },
    };
  }

  async createPlayer(_userId: string) {
    throw new NotImplementedError(`${this.info.id}.createPlayer`);
    return { providerUserId: "" };
  }
  async launchGame(_gameId: string, _ctx: LaunchContext): Promise<LaunchResult> {
    throw new NotImplementedError(`${this.info.id}.launchGame`);
  }
  async getBalance(_userId: string) {
    throw new NotImplementedError(`${this.info.id}.getBalance`);
    return { amount: 0, currency: "BDT" };
  }
  async syncTransaction(_payload: unknown) {
    throw new NotImplementedError(`${this.info.id}.syncTransaction`);
  }
  async handleWebhook(_payload: unknown, _signature?: string): Promise<Response> {
    throw new NotImplementedError(`${this.info.id}.handleWebhook`);
  }
  async authenticate() {
    throw new NotImplementedError(`${this.info.id}.authenticate`);
    return { token: "", expiresAt: 0 };
  }
}
