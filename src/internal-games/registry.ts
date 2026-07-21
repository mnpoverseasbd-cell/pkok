import { gameRegistry } from "@/game-engine";
import type { InternalGame } from "./InternalGame";
import { RouteInternalGame } from "./base";
import type { GameMetadata } from "@/core/types";
import type { GameCategory } from "@/core/constants";


// Game-specific thumbnails — one unique image per game.
import imgDice from "@/assets/thumbs/dice.jpg";
import imgCrash from "@/assets/thumbs/crash.jpg";
import imgMines from "@/assets/thumbs/mines.jpg";
import imgPlinko from "@/assets/thumbs/plinko.jpg";
import imgWheel from "@/assets/thumbs/wheel.jpg";
import imgLimbo from "@/assets/thumbs/limbo.jpg";
import imgCoinflip from "@/assets/thumbs/coinflip.jpg";
import imgChickenRoad from "@/assets/thumbs/chicken-road.jpg";
import imgTower from "@/assets/thumbs/tower.jpg";
import imgLuckyCard from "@/assets/thumbs/lucky-card.jpg";
import imgShellGame from "@/assets/thumbs/shell-game.jpg";
import imgScratchCard from "@/assets/thumbs/scratch-card.jpg";
import imgKeno from "@/assets/thumbs/keno.jpg";
import imgHiLo from "@/assets/thumbs/hi-lo.jpg";
import imgColorPrediction from "@/assets/thumbs/color-prediction.jpg";
import imgAndarBahar from "@/assets/thumbs/andar-bahar.jpg";
import imgDragonTiger from "@/assets/thumbs/dragon-tiger.jpg";
import imgTeenPatti from "@/assets/thumbs/teen-patti.jpg";
import imgSevenUpDown from "@/assets/thumbs/seven-up-down.jpg";
import imgBaccarat from "@/assets/thumbs/baccarat.jpg";
import imgSicBo from "@/assets/thumbs/sic-bo.jpg";
import imgRoulette from "@/assets/thumbs/roulette.jpg";
import imgBlackjack from "@/assets/thumbs/blackjack.jpg";
import img32Cards from "@/assets/thumbs/32-cards.jpg";
import imgVideoPoker from "@/assets/thumbs/video-poker.jpg";
import imgSlots from "@/assets/thumbs/slots.jpg";
import imgBingo from "@/assets/thumbs/bingo.jpg";
import imgMatka from "@/assets/thumbs/matka.jpg";
import imgFishShooter from "@/assets/thumbs/fish-shooter.jpg";
import imgMegaways from "@/assets/thumbs/megaways.jpg";
import imgAviatrix from "@/assets/thumbs/aviatrix.jpg";
import imgDragonFishing from "@/assets/thumbs/dragon-fishing.jpg";
import imgPenalty from "@/assets/thumbs/penalty.jpg";
import imgCricket from "@/assets/thumbs/cricket.jpg";
import imgLudo from "@/assets/thumbs/ludo.jpg";
import imgCarrom from "@/assets/thumbs/carrom.jpg";
import imgFanTan from "@/assets/thumbs/fan-tan.jpg";
import imgBalloon from "@/assets/thumbs/balloon.jpg";
import imgDragonPhoenix from "@/assets/thumbs/dragon-phoenix.jpg";
import imgWingo from "@/assets/thumbs/wingo.jpg";
import imgAviatorX2 from "@/assets/thumbs/aviator-x2.jpg";
import imgJhandiMunda from "@/assets/thumbs/jhandi-munda.jpg";


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
  { slug: "blackjack", name: "Blackjack", category: "table", image: imgPoker, tags: ["new", "hot", "cards", "classic"], featured: true, popularity: 98 },
  { slug: "32-cards", name: "32 Cards", category: "table", image: imgBaccarat, tags: ["new", "hot", "cards", "bd", "classic"], featured: true, popularity: 95 },
  { slug: "video-poker", name: "Video Poker · Jacks or Better", category: "poker", image: imgPoker, tags: ["new", "hot", "cards", "classic"], featured: true, popularity: 90 },
  { slug: "slots", name: "Cosmic Fortune Slots", category: "slots", image: imgSlot1, tags: ["new", "hot", "slots", "classic"], featured: true, popularity: 99 },
  { slug: "bingo", name: "Bingo 75", category: "lottery", image: imgFortune, tags: ["new", "hot", "lottery", "classic"], featured: true, popularity: 88 },
  { slug: "matka", name: "Matka King", category: "lottery", image: imgFortune, tags: ["new", "hot", "lottery", "bd", "classic"], featured: true, popularity: 97 },
  { slug: "fish-shooter", name: "Fish Shooter · Cast Net", category: "fishing", image: imgDragon, tags: ["new", "hot", "fishing", "arcade"], featured: true, popularity: 92 },
  { slug: "megaways", name: "Fruit Slots · Megaways", category: "slots", image: imgCandy, tags: ["new", "hot", "slots", "megaways"], featured: true, popularity: 96 },
  { slug: "aviatrix", name: "Aviatrix · Multi-Race", category: "crash", image: imgAviator, tags: ["new", "hot", "crash", "race"], featured: true, popularity: 95 },
  { slug: "dragon-fishing", name: "Dragon Fortune Fishing", category: "fishing", image: imgDragon, tags: ["new", "hot", "fishing", "arcade"], featured: true, popularity: 94 },
  { slug: "penalty", name: "Penalty Shootout · Golden Boot", category: "table", image: imgFortune, tags: ["new", "hot", "sports", "bd"], featured: true, popularity: 93 },
  { slug: "cricket", name: "Cricket Star · Six-Over Chase", category: "crash", image: imgAviator, tags: ["new", "hot", "sports", "bd", "crash"], featured: true, popularity: 97 },
  { slug: "ludo", name: "Ludo Dash · Race to 57", category: "crash", image: imgDice, tags: ["new", "hot", "dice", "bd", "crash"], featured: true, popularity: 96 },
  { slug: "carrom", name: "Carrom Strike · Pocket King", category: "table", image: imgBaccarat, tags: ["new", "hot", "arcade", "bd"], featured: true, popularity: 95 },
  { slug: "fan-tan", name: "Fan-Tan · Bead Count", category: "table", image: imgFortune, tags: ["new", "hot", "arcade", "asia", "classic"], featured: true, popularity: 92 },
  { slug: "balloon", name: "Balloon · Cash or Crash", category: "crash", image: imgCandy, tags: ["new", "hot", "arcade", "crash"], featured: true, popularity: 94 },
  { slug: "dragon-phoenix", name: "Dragon vs Phoenix · Battle Wheel", category: "table", image: imgDragon, tags: ["new", "hot", "arcade", "asia", "wheel"], featured: true, popularity: 93 },
  { slug: "wingo", name: "Wingo · 3-Minute Lottery", category: "lottery", image: imgFortune, tags: ["new", "hot", "lottery", "bd", "color"], featured: true, popularity: 98 },
  { slug: "aviator-x2", name: "Aviator X2 · Duo-Plane", category: "crash", image: imgAviator, tags: ["new", "hot", "crash", "duo"], featured: true, popularity: 95 },
  { slug: "jhandi-munda", name: "Jhandi Munda · Crown & Anchor", category: "table", image: imgDice, tags: ["new", "hot", "dice", "bd", "arcade", "classic"], featured: true, popularity: 94 },


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
