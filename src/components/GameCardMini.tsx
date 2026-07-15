import { Heart, Play } from "lucide-react";
import type { GameMetadata } from "@/core/types";

export function GameCardMini({
  game,
  onPlay,
  onToggleFav,
  isFav,
  onRemove,
}: {
  game: GameMetadata;
  onPlay?: (g: GameMetadata) => void;
  onToggleFav?: (g: GameMetadata) => void;
  isFav?: boolean;
  onRemove?: (g: GameMetadata) => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-[var(--neon-gold)] hover:shadow-[0_0_25px_rgba(255,214,54,0.35)]">
      <img
        src={game.image}
        alt={game.name}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      {onToggleFav && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(game);
          }}
          aria-label="favorite"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-[var(--neon-pink)] text-[var(--neon-pink)]" : ""}`} />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(game);
          }}
          className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur hover:bg-black/80"
        >
          Remove
        </button>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className="truncate text-xs font-bold text-white sm:text-sm">{game.name}</div>
        <div className="truncate text-[10px] text-white/60">{game.providerId}</div>
        <button
          type="button"
          onClick={() => onPlay?.(game)}
          className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-md bg-gold-button py-1.5 text-[11px] font-black text-[var(--background)] opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Play className="h-3 w-3 fill-current" /> PLAY
        </button>
      </div>
    </div>
  );
}
