# Architecture Overview

```
UI (routes, components)
   │
   ▼
hooks/                thin wrappers around services (TanStack Query)
   │
   ▼
services/             business logic — provider-agnostic
   │
   ▼
repositories/         Supabase data access (typed)
```

Games flow:

```
UI  →  game-engine (Game interface, gameRegistry)
              │
   ┌──────────┴──────────┐
   ▼                     ▼
internal-games/       providers/<name>  (adapter → PlaceholderAdapter)
```

Rules:
- UI never imports supabase directly; use hooks → services → repositories.
- UI never branches on `providerId === "internal"`. Consume `Game` only.
- Providers never touch `supabase.transactions`; they call `walletService`.
- Provider secrets live in server-side env only (see `.env.example`).
