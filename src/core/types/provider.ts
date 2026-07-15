export interface ProviderInfo {
  id: string;
  name: string;
  enabled: boolean;
  supportsLiveDealer: boolean;
  supportsSlots: boolean;
  supportsSports?: boolean;
}
