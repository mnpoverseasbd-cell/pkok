# Roadmap

## TypeScript errors
- [x] Restore the complete Supabase schema types so all app database calls type-check.
- [x] Replace the unsupported Admin icon `title` prop with an accessible label.

## Selected security fixes
- [x] Lock profile balances, payment approvals, and tournament results to trusted database paths.
- [x] Protect role checks, notifications, signup responses, payout access, and leaderboard identities.
- [x] Verify database permissions, the nightly payout schedule, the public route denial, and the app build.
- [x] Confirm administrator accounts remain eligible for VIP payouts; add safeguards instead of exclusions.
- [x] Approve server-verified game payouts across all 42 games, with winnings paused until each game is ready.
- [ ] Enforce strict database limits and audit logging on VIP reward changes.
- [ ] Disable caller-chosen game winnings and keep game payouts paused until server verification is available.
- [ ] Enable leaked-password screening in Supabase Auth; requires the project owner/dashboard setting.
- [ ] Verify signed-in screens; Lovable cannot mint a session for this user-managed Supabase backend.