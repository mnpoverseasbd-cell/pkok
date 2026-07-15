import type { ProviderAdapter } from "./ProviderAdapter";
import { evolutionAdapter } from "./evolution";
import { pragmaticAdapter } from "./pragmatic";
import { spribeAdapter } from "./spribe";
import { pgSoftAdapter } from "./pgsoft";
import { hacksawAdapter } from "./hacksaw";

export type { ProviderAdapter } from "./ProviderAdapter";

export const providerRegistry: Record<string, ProviderAdapter> = {
  evolution: evolutionAdapter,
  pragmatic: pragmaticAdapter,
  spribe: spribeAdapter,
  pgsoft: pgSoftAdapter,
  hacksaw: hacksawAdapter,
};

export const listEnabledProviders = () =>
  Object.values(providerRegistry).filter((p) => p.info.enabled);

export const listAllProviders = () => Object.values(providerRegistry);
