import type { GameMetadata, LaunchResult } from "@/core/types";
import type { LaunchContext } from "@/game-engine/Game";
import { InternalGame } from "./InternalGame";

/**
 * Generic internal game whose UI lives at a TanStack route.
 * Launch simply returns the route path; the caller navigates.
 */
export class RouteInternalGame extends InternalGame {
  constructor(
    readonly metadata: GameMetadata,
    private readonly routePath: string,
  ) {
    super();
  }

  async launch(_ctx: LaunchContext): Promise<LaunchResult> {
    return { embed: "internal", url: this.routePath };
  }
}
