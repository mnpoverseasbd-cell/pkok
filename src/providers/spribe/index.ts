import { PlaceholderAdapter } from "../_base/PlaceholderAdapter";
import type { ProviderInfo } from "@/core/types";

class SpribeAdapter extends PlaceholderAdapter {
  readonly info: ProviderInfo = {
    id: "spribe",
    name: "Spribe",
    enabled: false,
    supportsLiveDealer: false,
    supportsSlots: true,
  };
}

export const spribeAdapter = new SpribeAdapter();
