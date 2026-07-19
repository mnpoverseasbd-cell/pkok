import { gameRegistry } from "@/game-engine";
import type { InternalGame } from "./InternalGame";
import { RouteInternalGame } from "./base";
import type { GameMetadata } from "@/core/types";
import type { GameCategory } from "@/core/constants";

// Reuse existing artwork — new visual assets are out of scope.
import imgDice from "@/assets/game-dice.jpg";
import imgAviator from "@/assets/game-aviator.jpg";
import imgCrash from "@/assets/game-crash.jpg";
import imgDragon from "@/assets/game-dragon.jpg";
import imgFortune from "@/assets/game-fortune.jpg";
import imgRoulette from "@/assets/game-roulette.jpg";
import imgSlot1 from "@/assets/game-slot1.jpg";
import imgPharaoh from "@/assets/game-pharaoh.jpg";
import imgPoker from "@/assets/game-poker.jpg";
import imgCandy from "@/assets/game-candy.jpg";
import imgBaccarat from "@/assets/game-baccarat.jpg";

type Seed = {
  slug: string;
  name: string;
  category: GameCategory;
  image: string;
  tags?: string[];
  featured?: boolean;
  popularity?: number;
};

const SEEDS: Seed[] = [
  // ---------- Existing internal games ----------
  { slug: "dice", name: "Lucky Dice", category: "table", image: imgDice, tags: ["classic"], popularity: 80 },
  { slug: "crash", name: "Crash", category: "crash", image: imgCrash, tags: ["hot"], featured: true, popularity: 98 },
  { slug: "mines", name: "Mines", category: "table", image: imgDragon, tags: ["risk"], popularity: 88 },
  { slug: "plinko", name: "Plinko", category: "table", image: imgSlot1, tags: ["classic"], popularity: 82 },
  { slug: "wheel", name: "Wheel of Fortune", category: "table", image: imgRoulette, tags: ["classic"], popularity: 70 },
  { slug: "limbo", name: "Limbo", category: "crash", image: imgAviator, tags: ["risk"], popularity: 75 },
  { slug: "coinflip", name: "Coin Flip", category: "table", image: imgFortune, tags: ["classic"], popularity: 65 },

  // ---------- New games ----------
  { slug: "chicken-road", name: "Chicken Road", category: "crash", image: imgAviator, tags: ["new", "risk"], featured: true, popularity: 90 },
  { slug: "tower", name: "Tower — Royal Step", category: "table", image: imgPharaoh, tags: ["new"], featured: true, popularity: 85 },
  { slug: "lucky-card", name: "Lucky Card", category: "poker", image: imgPoker, tags: ["new"], popularity: 72 },
  { slug: "shell-game", name: "Shell Game", category: "table", image: imgBaccarat, tags: ["new"], popularity: 68 },
  { slug: "scratch-card", name: "Scratch Card", category: "lottery", image: imgCandy, tags: ["new"], popularity: 74 },
  { slug: "keno", name: "Keno", category: "lottery", image: imgSlot1, tags: ["new"], popularity: 78 },
  { slug: "hi-lo", name: "Hi-Lo", category: "poker", image: imgPoker, tags: ["new", "classic"], popularity: 76 },
  { slug: "color-prediction", name: "Color Prediction", category: "table", image: imgRoulette, tags: ["new", "hot"], featured: true, popularity: 92 },
  { slug: "andar-bahar", name: "Andar Bahar", category: "table", image: imgBaccarat, tags: ["new", "hot", "cards"], featured: true, popularity: 95 },
  { slug: "dragon-tiger", name: "Dragon Tiger", category: "table", image: imgPoker, tags: ["new", "hot", "cards"], featured: true, popularity: 94 },
  { slug: "teen-patti", name: "Teen Patti", category: "poker", image: imgPoker, tags: ["new", "hot", "cards", "bd"], featured: true, popularity: 96 },
  { slug: "seven-up-down", name: "7 Up 7 Down", category: "table", image: imgDice, tags: ["new", "hot", "dice", "bd"], featured: true, popularity: 93 },
  { slug: "baccarat", name: "Baccarat", category: "table", image: imgBaccarat, tags: ["new", "hot", "cards", "classic"], featured: true, popularity: 91 },
  { slug: "sic-bo", name: "Sic Bo", category: "table", image: imgDice, tags: ["new", "hot", "dice"], featured: true, popularity: 89 },
  { slug: "roulette", name: "Roulette", category: "table", image: imgRoulette, tags: ["new", "hot", "classic"], featured: true, popularity: 97 },

];

function metaFrom(seed: Seed): GameMetadata {
  return {
    id: `internal:${seed.slug}`,
    providerId: "internal",
    source: "internal",
    name: seed.name,
    category: seed.category,
    image: seed.image,
    thumbnail: seed.image,
    supportsDemo: true,
    supportsReal: true,
    supportsFavorite: true,
    tags: seed.tags ?? [],
    popularity: seed.popularity ?? 50,
    featured: !!seed.featured,
  };
}

const internalGames: InternalGame[] = SEEDS.map(
  (s) => new RouteInternalGame(metaFrom(s), `/games/${s.slug}`),
);

// Register immediately so consumers of gameRegistry work without an init step.
gameRegistry.registerMany(internalGames);

export function registerInternalGames() {
  // Idempotent: re-registration is safe (registry warns and overwrites).
  gameRegistry.registerMany(internalGames);
}

export function listInternalGames(): GameMetadata[] {
  return internalGames.map((g) => g.getMetadata());
}

/** Map catalog game id → playable route (used by lobby/favorites to launch). */
export function internalGameRoute(id: string): string | undefined {
  const seed = SEEDS.find((s) => `internal:${s.slug}` === id);
  return seed ? `/games/${seed.slug}` : undefined;
}
