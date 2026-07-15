import { PlaceholderAdapter } from "../_base/PlaceholderAdapter";
import type { ProviderInfo } from "@/core/types";

class PgSoftAdapter extends PlaceholderAdapter {
  readonly info: ProviderInfo = {
    id: "pgsoft",
    name: "PG Soft",
    enabled: false,
    supportsLiveDealer: false,
    supportsSlots: true,
  };
}

export const pgSoftAdapter = new PgSoftAdapter();
