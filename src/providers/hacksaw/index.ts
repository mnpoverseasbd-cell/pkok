import { PlaceholderAdapter } from "../_base/PlaceholderAdapter";
import type { ProviderInfo } from "@/core/types";

class HacksawAdapter extends PlaceholderAdapter {
  readonly info: ProviderInfo = {
    id: "hacksaw",
    name: "Hacksaw Gaming",
    enabled: false,
    supportsLiveDealer: false,
    supportsSlots: true,
  };
}

export const hacksawAdapter = new HacksawAdapter();
