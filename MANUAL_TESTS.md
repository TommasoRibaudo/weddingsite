# Manual Test Checklist

This checklist covers the full wedding site functionality described in the PRD and specs.

## Pre-Test Setup

- Run the app locally or use the deployed Vercel URL.
- Confirm Supabase has:
  - `gifts` table seeded with available and reserved gifts.
  - `photos` and `comments` tables created.
  - `wedding-photos` storage bucket created.
- Prepare:
  - Guest password.
  - Admin password.
  - One small valid image.
  - One non-image file.
  - One image over 10 MB.
  - At least two browser sessions, preferably normal and incognito.

## 1. Guest Gate / Session

- Visit `/home`, `/gifts`, and `/gallery` while logged out.
  - Expected: each redirects to `/`.
- On `/`, enter the wrong guest password.
  - Expected: inline error appears.
- Enter the correct guest password.
  - Expected: advances to name step.
- Submit an empty name.
  - Expected: inline validation error.
- Submit a valid name.
  - Expected: redirects to `/home`.
- Refresh `/home`.
  - Expected: session persists.
- Use the logout button.
  - Expected: returns to `/`, protected pages redirect again.
- Test on mobile width around 375px.
  - Expected: gate card, inputs, and button fit without horizontal scroll.

## 2. Home / Event Info

- Visit `/home` as a guest.
  - Expected: hero, date, ceremony/reception info, venue, dress code, schedule, and directions render.
- Check all schedule items are visible.
- Click "Get Directions."
  - Expected: opens the configured map URL in a new tab.
- If `additionalNotes` is empty:
  - Expected: no notes section appears.
- Resize/check at 375px, 390px, 768px, 1280px, and 1536px.
  - Expected: no horizontal scroll, timeline aligns, details stack on mobile and become columns on desktop.

## 3. Gift Registry

- Visit `/gifts` as a guest.
  - Expected: gifts load with name, description, price, image or placeholder, and external link where present.
- Click an external gift link.
  - Expected: opens in a new tab.
- Reserve an available gift.
  - Expected: button disables while pending, then gift becomes "Reserved."
- Refresh the page.
  - Expected: reservation persists.
- Confirm regular guests cannot see `reserved_by`.
  - Expected: only "Reserved" is visible.
- In a second browser/session, try reserving the same gift at nearly the same time.
  - Expected: only one succeeds; the other sees "Already reserved."
- Test a gift with no image.
  - Expected: placeholder displays cleanly.
- Test mobile at 375px.
  - Expected: one-column cards, reserve button easy to tap.

## 4. Gallery Locked State

- Set gallery window so current time is before `gallery.opensAt`.
- Visit `/gallery` as a guest.
  - Expected: locked placeholder appears.
- Confirm there is no upload zone, photo grid, modal access, or comment UI.
- Attempt direct upload to `POST /api/gallery/upload` while outside the window.
  - Expected: non-admin receives 403.
- Attempt direct comment submission outside the window.
  - Expected: non-admin receives "Gallery not open" or equivalent error.

## 5. Gallery Open State

- Set `gallery.opensAt` in the past and `gallery.closesAt` in the future.
- Visit `/gallery` as a guest.
  - Expected: upload zone and photo feed appear.
- Upload a valid image.
  - Expected: upload succeeds, image appears in feed without full page reload or after refresh.
- Upload multiple valid images.
  - Expected: files upload sequentially and appear newest first.
- Upload a non-image file.
  - Expected: error shown; file is not stored.
- Upload an image over 10 MB.
  - Expected: error shown; file is not stored.
- Upload more than the allowed rate, for example 6 images in one minute.
  - Expected: rate-limit error appears.
- Confirm thumbnails load quickly and look compressed.
- Confirm uploaded images do not show EXIF-sensitive behavior if applicable.
- Test mobile upload.
  - Expected: tap-to-browse works; camera capture is offered where supported.

## 6. Gallery Feed / Modal / Comments

- Click a photo thumbnail.
  - Expected: modal opens with full image.
- Press `Escape`.
  - Expected: modal closes.
- Reopen modal and use left/right arrow keys.
  - Expected: navigates between photos.
- Click outside or close button.
  - Expected: modal closes.
- Confirm modal shows uploader name and timestamp.
- Post a valid comment.
  - Expected: comment appears in the thread.
- Submit an empty comment.
  - Expected: validation error.
- Submit a comment over 500 characters.
  - Expected: rejected or trimmed according to implementation.
- Confirm comments are associated with the correct photo.
- Test mobile at 375px.
  - Expected: modal stacks image and comments; close button is tappable.

## 7. Gallery Pagination

- Seed or upload more than 24 photos.
- Visit `/gallery`.
  - Expected: first page loads newest first.
- Click "Load more."
  - Expected: next set of photos appends.
- Continue until fewer than page size remains.
  - Expected: "Load more" disappears.

## 8. Admin Login / Session

- Visit `/tomma/bobba` while logged out.
  - Expected: redirects to `/tomma/bobba/login`.
- Enter wrong admin password.
  - Expected: inline error.
- Enter correct admin password.
  - Expected: redirects to `/tomma/bobba`.
- Visit `/home`, `/gifts`, and `/gallery` as admin.
  - Expected: admin can access guest routes.
- Log out from admin.
  - Expected: admin session cleared and `/tomma/bobba` redirects to `/tomma/bobba/login`.

## 9. Admin Gifts

- Visit `/tomma/bobba`.
  - Expected: gift list appears with status, reserver names, reserved timestamps, and actions.
- Reserve a gift as a guest, then view admin.
  - Expected: admin sees who reserved it.
- Click "Un-reserve."
  - Expected: gift becomes available in `/tomma/bobba` and `/gifts`.
- If "Add gift" is implemented:
  - Submit with empty name.
    - Expected: validation error.
  - Submit valid gift details.
    - Expected: new gift appears in `/tomma/bobba` and `/gifts`.

## 10. Admin Photo / Comment Moderation

- As admin, confirm dashboard shows photos with uploader names and timestamps.
- Delete an individual comment.
  - Expected: comment disappears from `/tomma/bobba` and `/gallery`.
- Delete a photo.
  - Expected: confirmation appears.
- Confirm deletion.
  - Expected: photo disappears from admin dashboard and gallery.
- Verify the photo's comments are also gone.
- Verify Supabase Storage no longer contains the deleted original/thumbnail objects.
- Try direct admin actions without admin session.
  - Expected: action returns unauthorized/error and does not mutate data.

## 11. Admin Gallery Bypass

- Set gallery window to closed.
- Log in as admin.
- Visit `/gallery`.
  - Expected: admin can still see gallery controls.
- Upload a photo as admin.
  - Expected: succeeds outside normal window.
- Post a comment as admin.
  - Expected: succeeds outside normal window.

## 12. Privacy / Security Checks

- Inspect rendered guest `/gifts` HTML or UI.
  - Expected: reserver names are not present for non-admin guests.
- Confirm passwords are not visible in browser source or client JS.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser.
- Check `/robots.txt`.
  - Expected: contains `Disallow: /`.
- Check response headers.
  - Expected: `X-Robots-Tag: noindex, nofollow`.
- Confirm page metadata includes `noindex, nofollow`.

## 13. Responsive / Visual Polish

Test `/`, `/home`, `/gifts`, `/gallery`, `/tomma/bobba/login`, and `/tomma/bobba` at:

- 375px
- 390px
- 768px
- 1280px
- 1536px

Expected across all pages:

- No horizontal scroll.
- Text does not overflow containers.
- Buttons are at least 44px tall/tappable.
- Focus rings are visible when tabbing.
- Layout does not jump during image/font load.
- Script font is only used for display titles.
- Body/UI text uses Crimson Pro.
- Links are green, not browser-default blue.
- Error messages are red and readable.

## 14. Production Launch Checks

- Run production build successfully.
- Deploy to Vercel.
- Test the full guest flow on the live URL:
  - Gate -> name -> home -> gifts -> gallery.
- Test the admin flow on the live URL:
  - Admin login -> dashboard -> delete/unreserve actions.
- Test on at least one real phone.
- Temporarily open the gallery window in production, test photo upload, then reset the real `opensAt` / `closesAt`.
- Confirm final wedding content is correct:
  - Couple names.
  - Date.
  - Times.
  - Venue.
  - Address.
  - Map URL.
  - Dress code.
  - Schedule.
  - Gallery open/close UTC times.
  - Gift list.
