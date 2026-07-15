import type { GameCategory } from "../constants";

export type GameSource = "internal" | "external";

export interface GameMetadata {
  id: string;
  providerId: string;
  source: GameSource;
  name: string;
  category: GameCategory;
  type?: string;
  image: string;
  thumbnail?: string;
  rtp?: number;
  volatility?: "low" | "medium" | "high";
  supportsDemo: boolean;
  supportsReal: boolean;
  supportsFavorite: boolean;
  tags: string[];
  popularity: number;
  featured: boolean;
}

export interface LaunchResult {
  url?: string;
  embed?: "iframe" | "redirect" | "internal";
  sessionId?: string;
}
