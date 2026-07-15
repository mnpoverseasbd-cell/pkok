export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`Not Implemented: ${feature}`);
    this.name = "NotImplementedError";
  }
}

export class ProviderError extends Error {
  constructor(public providerId: string, message: string, public cause?: unknown) {
    super(`[${providerId}] ${message}`);
    this.name = "ProviderError";
  }
}

export class WalletError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "WalletError";
  }
}
