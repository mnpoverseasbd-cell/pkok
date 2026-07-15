## Goal

Refactor the current codebase into a scalable, provider-agnostic gaming platform architecture. No third-party provider integrations — only interfaces, adapters, and placeholder services that throw `NotImplementedError` until wired up. Internal games get their own module. Wallet, auth, catalog, and game engine are unified so the UI never knows whether a game is internal or external.

## Scope

- Architecture scaffolding only — no visual redesign, no new pages, no gameplay logic.
- Existing UI (SiteShell, landing, wallet, profile, admin) keeps working.
- Supabase auth + wallet tables already exist; we wrap them in a repository/service layer rather than re-migrating.
- No new provider SDKs, no fake data generators, no mocked balances.

## Folder structure (new)

```text
src/
  core/
    types/          User, Wallet, Game, Provider, Transaction, Bonus, Promotion, Tournament
    errors/         NotImplementedError, ProviderError, WalletError
    constants/      game categories, transaction types, roles
  repositories/     Supabase data access (walletRepo, gameRepo, txnRepo, profileRepo)
  services/
    auth/           session, roles, profile
    wallet/         unified deposit/withdraw/bet/win/refund/history
    catalog/        unified game catalog (internal + external merged)
    bonus/          placeholder
    promotion/      placeholder
    favorites/      placeholder
    recently-played/ placeholder
    leaderboards/   placeholder (NotImplemented)
    tournaments/    placeholder (NotImplemented)
    notifications/  placeholder (NotImplemented)
  game-engine/
    Game.ts             abstract interface: launch/close/getMetadata/supportsDemo/supportsReal/supportsFavorite
    GameRegistry.ts     resolves a game id -> concrete Game impl (internal or provider adapter)
    LaunchContext.ts    { user, wallet, mode: 'demo'|'real', locale }
  providers/
    ProviderAdapter.ts  interface every provider implements
    evolution/          placeholder adapter (throws NotImplemented)
    pragmatic/          placeholder adapter
    spribe/             placeholder adapter
    pgsoft/             placeholder adapter
    hacksaw/            placeholder adapter
    index.ts            provider registry
  internal-games/
    InternalGame.ts     base class implementing Game
    registry.ts         registers internal games
    _example/           empty scaffold folder with README explaining how to add a game
  hooks/                useWallet, useCatalog, useGameLaunch, useRoles (thin wrappers over services)
  contexts/             existing
  store/                lightweight zustand or context for UI-only state (dropdowns, modals)
  components/ pages/ layouts/ lib/ utils/ assets/   existing, unchanged
```

State management: TanStack Query already handles server state. Add a small `zustand` store (or plain context) for UI-only state — no data duplication.

## Key interfaces

- `Game` — `id, metadata, supportsDemo(), supportsReal(), supportsFavorite(), launch(ctx), close()`.
- `ProviderAdapter` — `id, createPlayer(), launchGame(gameId, ctx), getBalance(userId), syncTransaction(txn), handleWebhook(payload), authenticate()`. All methods throw `NotImplementedError` in placeholders.
- `WalletService` — `getBalances(userId)`, `deposit`, `withdraw`, `bet`, `win`, `refund`, `history`. Wraps existing `transactions` + `profiles` tables via `walletRepo`. Provider-agnostic; providers call this, not Supabase directly.
- `CatalogService` — merges internal `registry` + provider-declared static catalogs into one `Game[]` with unified metadata (id, provider, type, category, image, thumbnail, rtp?, volatility?, demo, real, tags, popularity, featured).

## Env vars

Add placeholders to `.env.example` (not `.env`, which holds live Supabase keys):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
# Future — server-only, add via Lovable Cloud secrets when integrating
PROVIDER_API_URL=
PROVIDER_API_KEY=
PROVIDER_SECRET=
```

Frontend never reads provider secrets — those live in server functions later.

## What stays untouched

- All existing routes and components render exactly as today.
- `src/routes/wallet.tsx` keeps working; internally we swap its direct `supabase.from(...)` calls to `walletService` in a follow-up (not this pass) to keep the diff small.
- No database migration in this pass. Existing `profiles`, `user_roles`, `transactions`, `payment_methods` tables already cover wallet + roles.

## Deliverables in this pass

1. New folders + interface/type files under `src/core`, `src/game-engine`, `src/providers`, `src/internal-games`, `src/services`, `src/repositories`, `src/hooks`.
2. Repositories wrap existing Supabase tables (thin, typed).
3. `WalletService` + `CatalogService` fully implemented against existing tables.
4. All provider adapters + future-ready services (leaderboards, tournaments, notifications, webhooks, balance sync) throw `NotImplementedError` with clear TODO comments.
5. `README.md` inside `src/providers/` and `src/internal-games/` explaining how to add a provider / internal game.
6. `.env.example` documenting future env vars.

No UI changes, no new routes, no migrations.

## Follow-up passes (not now, listed so you know the path)

- Migrate `src/routes/wallet.tsx` and admin screens to call `walletService` instead of `supabase` directly.
- Add `favorites` and `recently_played` tables when we're ready to expose those features.
- Wire the first real provider adapter (likely Spribe or Pragmatic) via a TanStack server function that holds the provider secret.

Confirm and I'll implement pass 1.
