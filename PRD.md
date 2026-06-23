# Wedding Website — Product Requirements Document

## 1. Overview

A private, password-protected wedding website for guests. It provides event information, a gift registry with reservation tracking, and a live photo feed for the wedding day where guests can post, view, and comment on photos. Built to be visually polished, low-cost, and reasonably private.

**Stack:** Next.js (App Router) frontend, Supabase (Postgres + Storage), deployed on Vercel. Target hosting cost: ~$0 on free tiers for typical wedding scale.

**Build agent:** Claude Code.

---

## 2. Goals & non-goals

### Goals
- Keep the site off public search engines and casual access, gated by a shared password.
- Capture each guest's name on entry (for photo/comment attribution), without per-guest accounts.
- Present event details (date, time, location, dress code) beautifully.
- Let guests browse a gift list and reserve a gift, with reserved gifts visibly marked as taken.
- On the wedding day, let guests upload photos to a shared feed, view others' photos, and comment.
- Give the couple (admins) the ability to delete any photo or comment.

### Non-goals
- **No RSVP handling** — managed elsewhere.
- No real per-user authentication or security guarantees (see §4).
- No payments, no shipping logic, no gift purchasing inside the site.
- No real-time chat or DMs.

---

## 3. User roles

| Role | How identified | Capabilities |
|------|---------------|--------------|
| **Guest** | Enters shared password + their name | View all pages, reserve gifts, upload photos, comment |
| **Admin (couple)** | Separate admin password / route | Everything a guest can do, plus delete any photo or comment, un-reserve gifts |

---

## 4. Access & security model (read this carefully)

The site uses **security by obscurity, not real security.** A single shared password is checked server-side; on success the guest enters their display name, and a signed cookie/session stores `{ access: true, guestName }`.

Implications the build must account for:
- Anyone with the link + password gets full access. This is acceptable for a wedding but means the **photo feed is open to spam/abuse** from anyone who has the password. Mitigations: admin delete, file-size/type limits, rate limiting on uploads (see §7).
- Guest name is **self-declared and unverified** — guests can type any name. Acceptable; it's for friendly attribution, not identity.
- Password check must happen **server-side** (API route / server action), never shipped to the client bundle.
- Set `robots.txt` + `noindex` headers to keep the site out of search engines.
- Admin access is a **separate, stronger password** on an `/admin` route, also checked server-side, stored as its own session flag.

Passwords are stored as environment variables (hashed comparison preferred), not in the database or client code.

---

## 5. Pages / routes

1. **`/` — Gate.** Password field → on success, name field → sets session → redirects to `/home`.
2. **`/home` — Event info.** Date, time, venue, dress code, map/directions, schedule. (Requires session.)
3. **`/gifts` — Gift registry.** List of gifts with reserve buttons. (Requires session.)
4. **`/gallery` — Photo feed.** Upload, view, comment. (Requires session.)
5. **`/admin` — Admin panel.** Login + moderation tools. (Requires admin session.)

All guest routes redirect to `/` if no valid session.

---

## 6. Feature: Gift registry

### Behavior
- Couple defines a list of gifts ahead of time (seeded in DB or via admin panel).
- Each gift shows: name, optional image, optional description, optional price/link to where to buy, and **reservation status**.
- A guest clicks **Reserve** → gift is marked **"Reserved"** and visibly shown as taken to everyone. **Other guests see only "Reserved" — never who reserved it.** The reserving guest's name is stored but visible to **admin only**.
- A guest can reserve multiple gifts. A reserved gift cannot be reserved again.
- Admin can un-reserve a gift (e.g., guest changed mind).

### Data model — `gifts`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `name` | text | |
| `description` | text nullable | |
| `image_url` | text nullable | |
| `external_link` | text nullable | where to buy |
| `price` | numeric nullable | display only |
| `reserved_by` | text nullable | guest name; null = available |
| `reserved_at` | timestamptz nullable | |
| `created_at` | timestamptz | |

### Concurrency
Reservation must be **atomic** — a conditional update (`UPDATE ... WHERE id = ? AND reserved_by IS NULL`) so two guests can't reserve the same gift simultaneously. If the update affects 0 rows, show "already taken."

### Edge cases
- Double-click / two guests at once → handled by atomic update above.
- Refresh after reserve → status persists from DB.

---

## 7. Feature: Photo feed (wedding day)

### Behavior
- The gallery is **time-gated**: uploads, viewing, and comments are **fully locked until the wedding day.** Before that day, the page shows a friendly "The gallery opens on our wedding day 💚" placeholder — no photos, no comments, no upload control.
- The open window is defined by an admin-configurable start/end datetime (e.g., opens 00:00 on the wedding day, closes a set number of hours/days after). This is the **primary control for "only people at the wedding post"** — the password restricts *who* has access; the time window restricts *when*. (Replaces any location/geofencing approach, which is unreliable indoors and trivially spoofed — see §11 note.)
- Within the open window: guests upload one or more photos. Each photo is stored in Supabase Storage; metadata in DB.
- Feed shows all photos newest-first, with uploader name and timestamp.
- Any guest can comment on any photo. Comments show commenter name + timestamp.
- "Guests post, only we delete" — **no approval queue.** Photos appear instantly. Only admin can delete photos or comments.

### Time-gate enforcement
- The lock must be enforced **server-side** (the upload/comment API rejects requests outside the window), not just hidden in the UI — otherwise a guest could post early by hitting the endpoint directly.
- Admin can post/preview at any time (bypasses the window) for setup/testing.

### Data model — `photos`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `storage_path` | text | path in Supabase Storage bucket |
| `uploaded_by` | text | guest name |
| `created_at` | timestamptz | |

### Data model — `comments`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `photo_id` | uuid FK → photos | |
| `body` | text | |
| `author` | text | guest name |
| `created_at` | timestamptz | |

### Upload rules (abuse mitigation)
- Accept image types only (`jpeg`, `png`, `webp`, `heic`); reject others server-side.
- Max file size (e.g., 10 MB); resize/compress on upload to control storage cost.
- Rate-limit uploads per session (e.g., N per minute) to limit spam.
- Strip nothing required, but generate thumbnails for the feed to keep it fast.

### Display
- Grid or masonry of thumbnails; click to open full photo + comments.
- Lazy-load / paginate so a feed of hundreds of photos stays performant.

---

## 8. Feature: Admin / moderation

- `/admin` login (separate password).
- View photo feed and comments with **delete** controls on every item.
- Deleting a photo removes the storage object + DB row + its comments.
- Un-reserve gifts.
- (Optional) Add/edit gifts.

---

## 9. Storage & cost notes

- Supabase free tier: 1 GB file storage, 500 MB Postgres, ample for a wedding. Compress photos on upload to stay within it.
- Vercel free tier hosts the Next.js app.
- If photo volume is very high, storage is the only realistic cost; compression + thumbnails keep it minimal.

---

## 10. Design direction

Priority #1 is **polished & beautiful.** The build should use an intentional aesthetic (typography, color palette, spacing) consistent across all pages — not a default template look. Mobile-first, since most guests will use phones, especially for photo upload on the day.

### Palette
- **Primary:** white and green `#386b40`.
- Shading/tints of the green are allowed and encouraged where solid `#386b40` would be too heavy — e.g. lighter sage tints for backgrounds/surfaces, the full-strength green for accents, buttons, and headings. Keep white dominant, green as the accent, generous whitespace.
- Pick complementary neutrals (warm off-white, soft greige) and one or two tints/shades of the green for a cohesive system rather than a single flat color.

### Typography
- **Display / headings:** **La Luxe Script** — a script face, used **sparingly**: couple's names, monogram, page titles, hero moments. Never for body text or anything dense (script faces hurt legibility at small sizes and in long runs).
- **Body / UI:** **Crimson Pro** — for all readable content: paragraphs, labels, buttons, gift descriptions, comments, captions.
- Source both from a webfont host (e.g. Google Fonts serves Crimson Pro; La Luxe Script is typically self-hosted/licensed — confirm its license and host the files if needed). Set `font-display: swap` and provide a serif fallback for Crimson Pro and a cursive fallback for La Luxe Script.
- Establish a clear type scale so the script never competes with body text — large script headings, comfortably sized Crimson Pro body (~16–18px on mobile).

---

## 11. Resolved decisions

1. **Reserved gift visibility:** Other guests see only **"Reserved"** — never the reserver's name. Name stored, visible to **admin only**.
2. **Gallery before the wedding day:** **Fully locked** — no photos, no comments, no uploads before the wedding day. Time-gated open window, enforced server-side (see §7).
3. **Password:** **One single shared password** for all guests (plus a separate admin password).
4. **Theme:** **White + green `#386b40`**, with tints/shades of the green permitted where full-strength would be too heavy. White dominant, green as accent. (See §10.)
5. **Location/geofencing for posting:** **Dropped.** Browser geolocation is unreliable indoors/rural, trivially spoofed, and adds privacy friction — it would block real guests with poor signal while failing to stop a determined troll. Replaced by the **time-window gate** (§7), with the password already restricting who has access. A venue code could be added later as an optional enhancement if desired.

### Still to confirm during build
- Exact gallery open/close datetimes (wedding day start; how long after to keep uploads open).
- Any monogram/branding mark to match the invitations.

---

## 12. Build phases (suggested for Claude Code)

1. **Phase 1 — Scaffold + gate:** Next.js app, Supabase project, password+name session gate, robots noindex, base layout/theme.
2. **Phase 2 — Event info page:** static content, styled.
3. **Phase 3 — Gift registry:** schema, list UI, atomic reservation, admin un-reserve.
4. **Phase 4 — Photo feed:** storage bucket, upload + compression, feed grid, comments.
5. **Phase 5 — Admin panel:** moderation + delete.
6. **Phase 6 — Polish pass:** responsive, performance, final aesthetic.