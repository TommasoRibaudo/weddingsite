# Spec 05 — Admin Panel (`/admin`)

## Goal
Build the admin area: a separate login page, and a moderation dashboard where the couple can delete photos/comments and un-reserve gifts. Admin access uses a stronger, separate password and its own session flag (`isAdmin`).

---

## 1. Admin login — `/admin/login`

`src/app/admin/login/page.tsx` — server component. If `session.isAdmin` is already true, redirect to `/admin`.

Form: single password input + submit button. No name step — admin is just a password.

Server action `src/app/actions/admin.ts`:
```ts
'use server';
import { compareSync } from 'bcryptjs';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function adminLogin(formData: FormData) {
  const password = formData.get('password') as string;
  const valid = compareSync(password, process.env.ADMIN_PASSWORD_HASH!);
  if (!valid) return { error: 'Incorrect admin password.' };

  const session = await getSession();
  session.isAdmin = true;
  session.access = true;                  // admin can also access guest routes
  session.guestName = 'Admin';
  await session.save();
  redirect('/admin');
}

export async function adminLogout() {
  const session = await getSession();
  session.isAdmin = false;
  session.access = false;
  session.guestName = '';
  await session.save();
  redirect('/admin/login');
}
```

Login page UI:
- Same visual treatment as the guest gate (centered card, couple names in script, white/green palette).
- "Admin access" label in Crimson Pro beneath the heading.
- Password input + "Log in" button.
- Inline error on failure.

---

## 2. Admin layout — `src/app/admin/layout.tsx`

Minimal layout (separate from guest layout):
- Small sticky header: "Admin Panel" label (Crimson Pro semibold) + "Log out" button.
- No guest nav links — admin is a separate context.
- Background: cream, consistent with the rest of the site.
- No footer needed.

---

## 3. Admin dashboard — `/admin`

`src/app/admin/page.tsx` — server component. Requires `session.isAdmin`; middleware already enforces this (from Spec 01 middleware).

Fetch all data server-side using the service-role client:
```ts
const [giftsRes, photosRes] = await Promise.all([
  adminSupabase.from('gifts').select('*').order('created_at'),
  adminSupabase.from('photos').select('id, storage_path, thumbnail_path, uploaded_by, created_at').order('created_at', { ascending: false }),
]);
```

Dashboard layout — tabbed or scrollable sections:
1. **Photos & Comments** tab (or section)
2. **Gifts** tab (or section)

Tabs can be simple anchor links (`#photos`, `#gifts`) or client-side tab state — keep it simple.

---

## 4. Photo moderation section

`src/components/admin/AdminPhotoGrid.tsx` — client component (needs delete interactivity):

Display the photo feed in a smaller grid (`grid-cols-3 md:grid-cols-4 gap-2`). Each thumbnail:
- Uploader name + timestamp below.
- A red "Delete photo" button (or trash icon button, `aria-label="Delete photo"`).

Clicking "Delete photo" → calls `deletePhoto(photoId)` server action after a **window.confirm** guard ("Delete this photo and all its comments?"). No undo.

Expand a photo (click thumbnail) → inline comment list with delete buttons per comment (or open the same `<PhotoModal />` with admin-mode controls injected).

`src/components/admin/AdminCommentList.tsx` — client component:
- List of all comments for a photo.
- Each comment: author, timestamp, body, red "Delete" text button.
- Calls `deleteComment(commentId)`.

---

## 5. Gift moderation section

`src/components/admin/AdminGiftList.tsx` — client component:

Table or card list of all gifts with columns:
| Column | Notes |
|--------|-------|
| Name | Gift name |
| Price | Formatted if set |
| Status | "Available" or "Reserved" badge |
| Reserved by | Reserver's name (admin-only view) |
| Reserved at | Formatted timestamp |
| Actions | "Un-reserve" button (only shown when reserved) |

"Un-reserve" calls the `unReserveGift(giftId)` action from Spec 03.

Optional (stretch): "Add gift" form inline or in a modal — `name`, `description`, `price`, `external_link`, `image_url` fields. Calls an `addGift` server action that inserts via service-role client.

---

## 6. Server actions — `src/app/actions/admin.ts` (additions)

```ts
export async function deletePhoto(photoId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  // Fetch storage paths first
  const { data: photo } = await adminSupabase
    .from('photos')
    .select('storage_path, thumbnail_path')
    .eq('id', photoId)
    .single();

  if (!photo) return { error: 'Photo not found.' };

  // Delete storage objects (best-effort; don't fail if already gone)
  const pathsToDelete = [photo.storage_path, photo.thumbnail_path].filter(Boolean);
  await adminSupabase.storage.from('wedding-photos').remove(pathsToDelete as string[]);

  // Delete DB row (ON DELETE CASCADE removes comments automatically)
  await adminSupabase.from('photos').delete().eq('id', photoId);

  revalidatePath('/gallery');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteComment(commentId: string) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  await adminSupabase.from('comments').delete().eq('id', commentId);

  revalidatePath('/gallery');
  revalidatePath('/admin');
  return { ok: true };
}

export async function addGift(formData: FormData) {
  const session = await getSession();
  if (!session.isAdmin) return { error: 'Unauthorised.' };

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Name is required.' };

  const description = (formData.get('description') as string)?.trim() || null;
  const external_link = (formData.get('external_link') as string)?.trim() || null;
  const price = formData.get('price') ? Number(formData.get('price')) : null;
  const image_url = (formData.get('image_url') as string)?.trim() || null;

  const { error } = await adminSupabase.from('gifts').insert({ name, description, external_link, price, image_url });
  if (error) return { error: 'Failed to add gift.' };

  revalidatePath('/gifts');
  revalidatePath('/admin');
  return { ok: true };
}
```

---

## 7. Security notes

- Every server action checks `session.isAdmin` first — **never skip this check**.
- The admin layout does not re-export or share components that show admin controls outside `/admin`. Admin-only controls on guest routes (e.g. gift page "un-reserve") are gated by `session.isAdmin` in the component, server action, and ideally at the API boundary.
- The admin password hash (`ADMIN_PASSWORD_HASH`) must be different from the guest password hash.

---

## 8. Acceptance criteria

- [ ] `/admin` without admin session redirects to `/admin/login`.
- [ ] Wrong admin password shows inline error; correct password grants admin session and redirects to `/admin`.
- [ ] Admin dashboard shows all photos with uploader names and timestamps.
- [ ] Deleting a photo removes it from the dashboard, the `/gallery` feed, and from Supabase Storage.
- [ ] Deleting a photo also removes all its comments (via `ON DELETE CASCADE`).
- [ ] Admin can delete an individual comment without deleting the photo.
- [ ] Gift list shows reserver names and "Un-reserve" button for reserved gifts.
- [ ] Un-reserve restores the gift to available status on `/gifts` and `/admin`.
- [ ] "Add gift" form (if implemented) saves to DB and gift appears on `/gifts`.
- [ ] Admin logout destroys admin session and returns to `/admin/login`.
- [ ] Direct `POST` to any admin action without `session.isAdmin` returns an error.
