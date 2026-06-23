# Spec 04 — Photo Feed (`/gallery`)

## Goal
Build the photo gallery: time-gated uploads, a paginated masonry/grid feed, per-photo comments, and all abuse-mitigation rules. The gallery is locked outside the configured window; admins bypass the gate.

---

## 1. Database schema

```sql
CREATE TABLE photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path  text NOT NULL,           -- path inside the Supabase Storage bucket
  thumbnail_path text,                   -- path to the compressed thumbnail
  uploaded_by   text NOT NULL,           -- guest display name
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id   uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) <= 500),
  author     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON comments (photo_id);

-- RLS: public read, no direct client writes (all writes via service-role server actions)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "public read comments" ON comments FOR SELECT USING (true);
```

---

## 2. Supabase Storage bucket

Create a bucket named `wedding-photos` in the Supabase dashboard:
- **Public:** No (private bucket; URLs are signed).
- Set the bucket's file size limit to **10 MB**.
- Set allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`.

Two "folders" within the bucket (logical paths):
- `originals/<photo-id>` — full resolution (after server-side compression, see §5).
- `thumbnails/<photo-id>` — compressed thumbnail for feed grid.

---

## 3. Time-gate configuration

Add to `src/lib/wedding-config.ts` (from Spec 02):
```ts
export const gallery = {
  opensAt:  '2026-09-12T14:00:00Z',   // UTC — 2 hours before ceremony (adjust at launch)
  closesAt: '2026-09-14T23:59:59Z',   // UTC — close after the next day
};
```

Helper `src/lib/gallery-window.ts`:
```ts
import { gallery } from './wedding-config';

export function galleryIsOpen(): boolean {
  const now = Date.now();
  return now >= new Date(gallery.opensAt).getTime() &&
         now <= new Date(gallery.closesAt).getTime();
}
```

---

## 4. Page structure

`src/app/(guest)/gallery/page.tsx` — server component:

```
if session.isAdmin OR galleryIsOpen():
  render <GalleryOpen session={session} />
else:
  render <GalleryLocked />
```

### 4.1 `<GalleryLocked />`
- Centered card, full viewport.
- La Luxe Script: "Gallery opens on our wedding day".
- Crimson Pro: wedding date + approximate time (formatted from `gallery.opensAt`).
- Green divider, optional small heart/floral ornament.
- No upload control, no photo grid.

### 4.2 `<GalleryOpen />`
- Upload section at the top (see §5).
- Photo feed grid below (see §6).

---

## 5. Photo upload

### 5.1 Upload route — `POST /api/gallery/upload`

Route handler at `src/app/api/gallery/upload/route.ts`. All validation and storage happen here; no client-side uploads to Supabase directly.

Steps:
1. Read session → reject if no `session.access`.
2. Check `galleryIsOpen()` OR `session.isAdmin` → reject with 403 if outside window.
3. **Rate limit**: maintain a simple in-memory Map `{ sessionId → uploadTimestamps[] }`. Allow max **5 uploads per minute per session**. Return 429 if exceeded. (For a wedding scale this is sufficient; no Redis needed.)
4. Parse `multipart/form-data`: extract file from `FormData`.
5. Validate MIME type (check both `Content-Type` header and magic bytes — `npm install file-type`). Reject anything not `image/{jpeg,png,webp,heic}` → 400.
6. Validate file size ≤ 10 MB → 400 if too large.
7. **Server-side resize/compress** using `sharp`:
   - Generate thumbnail: resize to max 800×800, `jpeg` quality 75, strip EXIF (`keepMetadata: false`).
   - Generate original: resize to max 2400×2400 (keeps reasonable resolution), `jpeg` quality 85, strip EXIF.
   - Use `sharp` from the input buffer — never write temp files to disk.
8. Generate a UUID for the photo.
9. Upload both blobs to Supabase Storage via `adminSupabase.storage.from('wedding-photos').upload(...)`.
10. Insert a row into `photos` table via `adminSupabase`.
11. Return `{ ok: true, photoId }`.

```ts
// Pseudocode structure
export async function POST(req: Request) {
  const session = await getSession();
  if (!session.access) return Response.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!galleryIsOpen() && !session.isAdmin)
    return Response.json({ error: 'Gallery not open' }, { status: 403 });

  // rate limit check ...

  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // validate ...
  // compress with sharp ...
  // upload to storage ...
  // insert DB row ...

  return Response.json({ ok: true, photoId });
}
```

### 5.2 Upload UI — `src/components/gallery/UploadZone.tsx` — client component

- Drag-and-drop zone (`onDragOver`, `onDrop`) + click-to-browse fallback (`<input type="file" accept="image/*" capture="environment">`).
- The `capture="environment"` attribute on mobile opens the camera directly — desirable for wedding day.
- Show selected file preview (thumbnail via `URL.createObjectURL`).
- Submit button: calls the upload API route with `fetch` + `FormData`.
- Progress indicator during upload (indeterminate spinner or progress bar).
- On success: clear the zone, trigger a feed refresh (via router refresh or state update).
- On error: display the server's error message inline.
- Multiple files: allow selecting multiple (`multiple` attribute), upload sequentially.
- Max visible file size warning: show a note "Max 10 MB per photo" below the zone.

---

## 6. Photo feed

### 6.1 Feed data fetching

`src/app/(guest)/gallery/page.tsx` fetches the initial page server-side:
```ts
const PAGE_SIZE = 24;
const { data: photos } = await adminSupabase
  .from('photos')
  .select('id, storage_path, thumbnail_path, uploaded_by, created_at')
  .order('created_at', { ascending: false })
  .range(0, PAGE_SIZE - 1);
```

### 6.2 Signed URLs

Thumbnails are served via signed URLs (bucket is private). Generate signed URLs in a server action or route handler:

`GET /api/gallery/signed-url?path=<storage_path>` — returns a 1-hour signed URL. Client components call this to get displayable image URLs.

Alternatively, generate a batch of signed URLs server-side in the page component and pass them as props to avoid per-image round trips.

### 6.3 Feed grid UI — `src/components/gallery/PhotoGrid.tsx` — client component

- CSS grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2`.
- Each thumbnail: `aspect-square`, `object-cover`, rounded corners, hover scale effect.
- Clicking a thumbnail opens `<PhotoModal />`.
- "Load more" button at the bottom — fetches next page via a server action and appends to local state.
- If fewer than `PAGE_SIZE` results returned, hide "Load more".

### 6.4 Photo modal — `src/components/gallery/PhotoModal.tsx` — client component

- Full-screen overlay / dialog (`role="dialog"`, `aria-modal`).
- Left: full image (signed URL, full resolution, `max-h-[80vh] object-contain`).
- Right (or below on mobile): uploader name, timestamp, comment thread.
- Close button (×) or click outside to dismiss.
- Keyboard: `Escape` closes, `←` / `→` navigate between photos.

### 6.5 Comments — `src/components/gallery/CommentThread.tsx` — client component

Display:
- List of comments: `author` (Crimson Pro semibold), timestamp (relative via `Intl.RelativeTimeFormat` or `date-fns`), `body`.
- Newest first or oldest first — **oldest first** preferred (conversational order).
- Max visible: show all if ≤ 10; paginate/expand if more.

Post a comment form:
- Single textarea (max 500 chars), submit button.
- Server action `postComment(photoId, body)`:
  1. Validate session.
  2. Check `galleryIsOpen()` OR `session.isAdmin`.
  3. Sanitize/trim body; reject empty or >500 chars.
  4. Insert via `adminSupabase`.
  5. `revalidatePath('/gallery')` — or use optimistic update.
- Show comment immediately (optimistic) before server confirms.

---

## 7. Server actions — `src/app/actions/gallery.ts`

```ts
'use server';
import { getSession } from '@/lib/session';
import { adminSupabase } from '@/lib/supabase/admin';
import { galleryIsOpen } from '@/lib/gallery-window';
import { revalidatePath } from 'next/cache';

export async function postComment(photoId: string, body: string) {
  const session = await getSession();
  if (!session.access) return { error: 'Not authenticated.' };
  if (!galleryIsOpen() && !session.isAdmin) return { error: 'Gallery not open.' };

  const trimmed = body.trim().slice(0, 500);
  if (!trimmed) return { error: 'Comment cannot be empty.' };

  const { error } = await adminSupabase.from('comments').insert({
    photo_id: photoId,
    body: trimmed,
    author: session.guestName,
  });

  if (error) return { error: 'Failed to post comment.' };
  revalidatePath('/gallery');
  return { ok: true };
}

export async function getPhotosPage(page: number) {
  const PAGE_SIZE = 24;
  const { data } = await adminSupabase
    .from('photos')
    .select('id, thumbnail_path, uploaded_by, created_at')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  return data ?? [];
}
```

---

## 8. Signed URL generation helper

`src/app/actions/gallery.ts` (add):
```ts
export async function getSignedUrl(path: string, expiresIn = 3600) {
  const { data } = await adminSupabase.storage
    .from('wedding-photos')
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function getSignedUrls(paths: string[], expiresIn = 3600) {
  const { data } = await adminSupabase.storage
    .from('wedding-photos')
    .createSignedUrls(paths, expiresIn);
  return Object.fromEntries((data ?? []).map(d => [d.path, d.signedUrl]));
}
```

---

## 9. Acceptance criteria

- [ ] Before `gallery.opensAt`: `/gallery` shows the locked placeholder, no feed or upload control visible.
- [ ] Upload API (`POST /api/gallery/upload`) returns 403 if called directly outside the window (by a non-admin session).
- [ ] After `gallery.opensAt`: upload zone visible; selecting a photo and submitting shows the new photo in the feed without a full page reload.
- [ ] Non-image file upload returns an error and is not stored.
- [ ] File >10 MB returns an error.
- [ ] Uploaded photos appear in the grid, newest first.
- [ ] Clicking a thumbnail opens the modal with the full image.
- [ ] Modal shows existing comments for the photo.
- [ ] Posting a comment adds it to the thread (optimistic or near-real-time).
- [ ] Admin session can upload and comment at any time (before `opensAt`).
- [ ] "Load more" fetches the next page of photos.
- [ ] `Escape` closes the modal; arrow keys navigate photos.
- [ ] Mobile (375px): grid shows 2 columns, upload zone is usable, camera capture works.
- [ ] Thumbnails load quickly (≤200 KB each after compression).
