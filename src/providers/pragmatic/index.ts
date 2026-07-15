import { PlaceholderAdapter } from "../_base/PlaceholderAdapter";
import type { ProviderInfo } from "@/core/types";

class PragmaticAdapter extends PlaceholderAdapter {
  readonly info: ProviderInfo = {
    id: "pragmatic",
    name: "Pragmatic Play",
    enabled: false,
    supportsLiveDealer: true,
    supportsSlots: true,
  };
}

export const pragmaticAdapter = new PragmaticAdapter();
