<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Security invariants

- Authenticated profile writes are column-limited to contact and display fields; wallet and VIP values remain database-controlled because browser requests are untrusted.
- Public leaderboards use board-scoped pseudonyms and a caller-only self marker because usernames can contain private phone numbers.
- Public payout hooks verify the server-held service key before privileged actions because public API routes bypass site sign-in.
- Protected TanStack server functions attach the current browser session token globally, then validate it server-side to preserve the user's RLS identity.
