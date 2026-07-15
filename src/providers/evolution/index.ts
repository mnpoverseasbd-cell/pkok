import { PlaceholderAdapter } from "../_base/PlaceholderAdapter";
import type { ProviderInfo } from "@/core/types";

class EvolutionAdapter extends PlaceholderAdapter {
  readonly info: ProviderInfo = {
    id: "evolution",
    name: "Evolution Gaming",
    enabled: false,
    supportsLiveDealer: true,
    supportsSlots: false,
  };
}

export const evolutionAdapter = new EvolutionAdapter();
