# Wedding Site — Implementation Specs

Six sequential specs, each self-contained enough to implement without re-reading the PRD.

| # | Spec | What it covers |
|---|------|---------------|
| 01 | [Scaffold & Gate](spec-01-scaffold.md) | Next.js + Supabase setup, iron-session, password gate, design system (fonts, colors, Tailwind), middleware, robots/noindex |
| 02 | [Event Info](spec-02-event-info.md) | `/home` static page — hero, details strip, timeline, location/directions |
| 03 | [Gift Registry](spec-03-gift-registry.md) | `/gifts` — DB schema, atomic reservation, reserve button, admin un-reserve |
| 04 | [Photo Feed](spec-04-photo-feed.md) | `/gallery` — time-gate, upload + sharp compression, paginated grid, modal, comments |
| 05 | [Admin Panel](spec-05-admin.md) | `/admin` — separate login, delete photos/comments, un-reserve gifts, add gifts |
| 06 | [Polish](spec-06-polish.md) | Responsive audit, performance, a11y, aesthetic review, pre-launch checklist |

## Build order
Implement in spec order — each spec assumes the previous is done. Specs 03–05 can be partially parallelized (the DB schemas are independent), but the session/middleware from Spec 01 must exist first.

## Shared files (created in Spec 01, used throughout)
- `src/lib/session.ts` — iron-session helpers
- `src/lib/supabase/client.ts` / `server.ts` / `admin.ts` — Supabase clients
- `src/lib/wedding-config.ts` — all event content + gallery window config (extended in Spec 02 & 04)
- `src/app/(guest)/layout.tsx` — shared guest nav/footer

## Key decisions (from PRD)
- **No per-user accounts** — shared password + self-declared name.
- **Gallery time-gated** — `gallery.opensAt` / `closesAt` in UTC, enforced server-side.
- **Reservations atomic** — `UPDATE … WHERE reserved_by IS NULL`; reserver name hidden from guests.
- **Admin bypasses time-gate** — can upload/comment at any time.
- **Palette** — white dominant, `#386b40` green accent, cream/greige neutrals.
- **Fonts** — La Luxe Script (display only), Crimson Pro (all body/UI).
