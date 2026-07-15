# Internal Games

Games built by our own team. Each game is an independent module extending
`InternalGame`.

## Add a new internal game

1. Create `src/internal-games/<slug>/index.ts` that exports a class
   extending `InternalGame`.
2. Provide `metadata: GameMetadata` with a unique `id`, `providerId:
   "internal"`, category, and support flags.
3. Implement `launch(ctx)` — return `{ embed: "internal", url }` pointing
   at the route or lazy-loaded component that hosts the game UI.
4. Append the instance to `internalGames` in `registry.ts`.

Internal games call `walletService.bet/win/refund` — never Supabase
directly.
