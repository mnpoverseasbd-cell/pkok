# Roadmap

## TypeScript errors
- [x] Restore the complete Supabase schema types so all app database calls type-check.
- [x] Replace the unsupported Admin icon `title` prop with an accessible label.
- [x] Clear the remaining lobby and game type-check errors before preview validation.

## Latest build failure
- [x] Restore the missing Supabase session attacher used by protected server functions.

## Selected security fixes
- [x] Lock profile balances, payment approvals, and tournament results to trusted database paths.
- [x] Protect role checks, notifications, signup responses, payout access, and leaderboard identities.
- [x] Verify database permissions, the nightly payout schedule, the public route denial, and the app build.
- [x] Confirm administrator accounts remain eligible for VIP payouts; add safeguards instead of exclusions.
- [x] Approve server-verified game payouts across all 42 games, with winnings paused until each game is ready.
- [x] Enforce tier-specific VIP reward ceilings and require an audit record before changes.
- [x] Disable browser wallet mutations and pause game wagers until server verification is available.
- [x] Prevent admins from self-funding, self-approving deposits, or claiming their own free-credit offers.
- [ ] Rotate the fixed main-admin credential; requires approval because it invalidates the current password.
- [ ] Verify phone ownership at registration; requires an OTP provider or approval to pause signups.
- [ ] Enable leaked-password screening in Supabase Auth; requires the project owner/dashboard setting.
- [ ] Verify signed-in screens; Lovable cannot mint a session for this user-managed Supabase backend.