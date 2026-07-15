# Providers

Each external gaming provider gets its own folder implementing
`ProviderAdapter` from `src/providers/ProviderAdapter.ts`.

## Add a new provider

1. Create `src/providers/<name>/index.ts` extending `PlaceholderAdapter`.
2. Override `listGames()` with the static catalog (safe for client).
3. When wiring credentials, implement `launchGame`, `getBalance`,
   `syncTransaction`, `handleWebhook`, `authenticate` inside a TanStack
   server function or server route so provider secrets never reach the
   client bundle.
4. Register the adapter in `src/providers/index.ts`.

Runtime methods must call `walletService` for any balance mutation —
never touch Supabase transactions directly.
