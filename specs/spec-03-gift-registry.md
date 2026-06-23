# Spec 03 — Gift Registry (`/gifts`)

## Goal
Build the gift registry page where guests can browse gifts and atomically reserve one. Reserved gifts are visibly marked "taken" but the reserver's name is hidden from other guests. Admins can see who reserved each gift and can un-reserve them.

---

## 1. Database schema

Run this SQL in the Supabase SQL editor to create the table:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE gifts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  image_url     text,
  external_link text,
  price         numeric(10,2),
  reserved_by   text,          -- guest display name; NULL = available
  reserved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Guests can read all gifts; cannot write directly (writes go through server actions)
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON gifts FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies for anon — all mutations go through service-role server actions
```

Seed a few example gifts via the Supabase dashboard or a seed script (`scripts/seed-gifts.ts`) before first use. The admin panel (Spec 05) will add a UI for this later.

---

## 2. Server actions — `src/app/actions/gifts.ts`

```ts
'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function reserveGift(giftId: string) {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };

  const guestName = session.guestName;

  // Atomic conditional update: only succeeds if reserved_by IS NULL
  const { data, error } = await adminSupabase
    .from('gifts')
    .update({ reserved_by: guestName, reserved_at: new Date().toISOString() })
    .eq('id', giftId)
    .is('reserved_by', null)
    .select('id');

  if (error) return { error: 'Something went wrong. Please try again.' };
  if (!data || data.length === 0) return { error: 'already_taken' };

  revalidatePath('/gifts');
  return { ok: true };
}

export async function unReserveGift(giftId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  await adminSupabase
    .from('gifts')
    .update({ reserved_by: null, reserved_at: null })
    .eq('id', giftId);

  revalidatePath('/gifts');
  revalidatePath('/admin');
  return { ok: true };
}
```

---

## 3. Data fetching

`src/app/(guest)/gifts/page.tsx` — **server component**. Fetch all gifts server-side on every request (or use Next.js revalidation — `revalidate: 60` is fine for low-traffic wedding scale):

```ts
const { data: gifts } = await adminSupabase
  .from('gifts')
  .select('id, name, description, image_url, external_link, price, reserved_by, created_at')
  .order('created_at', { ascending: true });
```

Pass `isAdmin` from session to client components so they can conditionally show extra info.

---

## 4. Page layout

`src/app/(guest)/gifts/page.tsx`:
- Page heading: La Luxe Script "Gift Registry" or "Our Wishlist".
- Sub-heading (Crimson Pro italic): short friendly note, e.g. "Your presence is our greatest gift, but if you'd like to bring something…"
- Gift grid below.

---

## 5. Gift grid

`src/components/gifts/GiftGrid.tsx` — client component (needs interactivity for reserve button):
- Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`).
- Each gift rendered as `<GiftCard />`.

`src/components/gifts/GiftCard.tsx`:
- White card, `rounded-2xl`, `shadow-sm`, hover `shadow-md` transition.
- **Image** (if `image_url`): `next/image`, `aspect-[4/3]`, `object-cover`, rounded top. If no image: placeholder with a subtle green-pale background + gift icon.
- **Body**: name (Crimson Pro semibold), price (if set, formatted as £X,XXX or currency-neutral `$`—decide format at build time), description (2-line clamp with `line-clamp-2`), external link ("View item →" opens in new tab, only if `external_link` is set).
- **Footer**: reserve control (see §6).
- Reserved state: overlay or card-level style change — reduced opacity (`opacity-60`), "Reserved" badge (green pill badge top-right).

---

## 6. Reserve button logic

`src/components/gifts/ReserveButton.tsx` — client component:

States:
| State | UI |
|-------|----|
| Available | Green "Reserve" button |
| Pending (optimistic) | Button disabled, spinner |
| Just reserved by this guest | Green "Reserved ✓" text (non-button) |
| Already taken (returned `already_taken`) | Button replaced with muted "Already reserved" text |
| Error | Small red error message below button |

Implementation notes:
- Use `useTransition` + `startTransition` to call the `reserveGift` server action.
- Show optimistic "pending" state during the transition.
- On `already_taken` error: update local state to show "Already reserved" without needing a full refresh (the `revalidatePath` will also update the server data).
- No confirmation dialog — single click reserves. The gift list reloads (via revalidation) to reflect the change for other users.
- Double-click protection: disable the button immediately on first click.

---

## 7. Admin view on `/gifts`

When the session has `isAdmin: true`:
- Each reserved gift card shows `reserved_by` name in a small label: `"Reserved by: [name]"` (italic, Crimson Pro, small text, muted color).
- An "Un-reserve" button (text link or secondary button) calls `unReserveGift`.

For non-admin guests, neither the name nor the un-reserve button is rendered — this must be enforced in the component, not just hidden with CSS.

---

## 8. Empty state

If no gifts exist in the DB yet: centered message "Gift list coming soon." in Crimson Pro italic.

---

## 9. Concurrency guarantee

The atomic `UPDATE … WHERE reserved_by IS NULL` in the server action is the sole concurrency control. No optimistic locks, no transactions needed — Postgres guarantees only one writer wins. The loser receives `data.length === 0` and gets the "already taken" response.

---

## 10. Acceptance criteria

- [ ] Gift list loads server-side; gifts display with name, price, image (where set), description.
- [ ] Clicking "Reserve" on an available gift marks it as reserved (card shows "Reserved" badge); change persists on refresh.
- [ ] Two concurrent reservations of the same gift: only one succeeds; the other sees "Already reserved."
- [ ] Reserved gifts show no reserver name to regular guests.
- [ ] Admin (`isAdmin: true` session) sees reserver name + "Un-reserve" control.
- [ ] "Un-reserve" restores the gift to available.
- [ ] External link opens in a new tab.
- [ ] Gift with no image shows placeholder gracefully.
- [ ] Mobile layout (375px): cards stack in single column, reserve button is tappable (min 44px touch target).
