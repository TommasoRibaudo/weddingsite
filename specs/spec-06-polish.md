# Spec 06 — Polish Pass

## Goal
Finalize the site to production quality: consistent responsive behavior across all pages, performance optimizations, accessibility basics, final aesthetic review, and pre-launch checklist. No new features — refine what's built.

---

## 1. Responsive audit (mobile-first)

Test every page at these breakpoints and fix any issues:
- **375px** (iPhone SE) — minimum supported
- **390px** (iPhone 14)
- **768px** (tablet)
- **1280px** (desktop)
- **1536px** (wide desktop)

Checklist per page:

### `/` Gate
- [ ] Card centered vertically on all breakpoints, no overflow.
- [ ] Password and name inputs full-width inside card, with proper padding.
- [ ] Submit button full-width on mobile, auto-width on desktop.

### `/home`
- [ ] Hero script text scales gracefully — clamp font size so it never overflows its container (`clamp(2rem, 8vw, 5rem)`).
- [ ] Details strip: 1-col on mobile, 3-col on desktop.
- [ ] Timeline: connector line visible and aligned on all widths.
- [ ] "Get Directions" button tappable (min 44px height).

### `/gifts`
- [ ] Grid: 1-col mobile, 2-col tablet, 3-col desktop.
- [ ] Card images don't distort — always `object-cover`.
- [ ] Reserve button: full-width inside card on mobile.
- [ ] Price/link text doesn't overflow card bounds.

### `/gallery`
- [ ] Locked state: text fits without overflow.
- [ ] Upload zone: drag-drop works on desktop, tap-to-browse on mobile.
- [ ] Grid: 2-col mobile, 3-col tablet, 4-col desktop.
- [ ] Modal: full-screen on mobile (no side panel — stack image above comments). Side-by-side on tablet+.
- [ ] Modal close button large enough to tap (44px).
- [ ] Comment form: textarea resize-none, full width.

### `/admin`
- [ ] Dashboard usable on a phone (admin may use it on the day).
- [ ] Photo grid thumbnails not too small to identify.
- [ ] Delete buttons clearly labeled, spaced apart enough to avoid mis-taps.

---

## 2. Performance

### Images
- All `next/image` usages have explicit `width` / `height` or `fill` with a sized container — no layout shift (CLS = 0).
- `priority` prop on hero or above-the-fold images.
- `loading="lazy"` (default) on feed thumbnails.
- Verify `sharp` is installed (`npm ls sharp`) — Next.js uses it for image optimization.

### Fonts
- `font-display: swap` confirmed on both font `@font-face` declarations.
- Google Fonts `<link>` uses `rel="preconnect"` + `rel="stylesheet"` with `display=swap` parameter.
- La Luxe Script is WOFF2 only (smallest format).

### Bundle
- Server components are the default — make sure no large client bundles are accidentally created.
- Run `next build` and check the output table: no page should exceed **500 KB** first load JS.
- The gallery photo grid uses lazy-loaded modals (dynamic import with `next/dynamic` and `ssr: false` for the modal) to keep the initial load fast.

```ts
// In PhotoGrid.tsx
import dynamic from 'next/dynamic';
const PhotoModal = dynamic(() => import('./PhotoModal'), { ssr: false });
```

---

## 3. Accessibility basics

- All interactive elements have `:focus-visible` outlines (Tailwind `focus-visible:ring-2 focus-visible:ring-green`).
- Images have meaningful `alt` text: gift images use the gift name; photo thumbnails use "Photo by [name]".
- Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to its title, and focus is trapped inside while open (use a focus-trap library or the native `<dialog>` element).
- Color contrast: green `#386b40` on white passes WCAG AA for large text (check with a contrast tool — it should be ≥4.5:1 at body size). Adjust text colors if needed.
- Form inputs have visible `<label>` elements (or `aria-label` if visually hidden).
- Error messages are associated with their inputs via `aria-describedby`.

---

## 4. Final aesthetic review

Walk through the site visually and apply these consistency checks:

### Typography
- [ ] La Luxe Script used **only** for: hero/couple names, page display titles. Never for body, labels, or buttons.
- [ ] All body text is Crimson Pro at ≥16px on mobile.
- [ ] Headings within body content are Crimson Pro semibold (not script).
- [ ] Line heights are comfortable: `leading-relaxed` (1.625) for body, `leading-tight` for headings.

### Color
- [ ] Buttons: primary = green `#386b40` bg, white text. Secondary / outlined = white bg, green border, green text.
- [ ] Links: green with underline on hover, not blue (browser default).
- [ ] Error states: red `text-red-600` — do not use green for errors.
- [ ] Page backgrounds: cream (`#faf8f5`) with white cards, not stark white backgrounds.
- [ ] No untinted gray backgrounds — use cream/greige neutrals from the design system.

### Spacing & layout
- [ ] Consistent section padding: `py-12 md:py-20` between major sections.
- [ ] Max-width containers: `max-w-4xl` for content, `max-w-6xl` for full-bleed grids.
- [ ] Cards have consistent corner radius (`rounded-2xl`) and shadow (`shadow-sm`, `hover:shadow-md`).
- [ ] Dividers/separators use `border-greige` or the green accent — no harsh black lines.

### Micro-interactions
- [ ] Button hover: slight darken (`hover:bg-green-light`) + fast transition (`transition-colors duration-150`).
- [ ] Card hover: `hover:shadow-md` + `hover:-translate-y-0.5` for gift cards.
- [ ] Photo thumbnail hover: `hover:opacity-90 hover:scale-[1.02]` within the grid cell.
- [ ] Reserve button success: brief green checkmark animation before settling into "Reserved" state.

---

## 5. Error & loading states (final check)

Audit every async operation for missing states:

| Action | Loading | Error | Empty |
|--------|---------|-------|-------|
| Gift list load | Skeleton cards (3) | "Could not load gifts. Refresh to try again." | "Gift list coming soon." |
| Reserve gift | Button disabled + spinner | Inline red message | n/a |
| Photo upload | Progress bar / spinner in upload zone | Inline error message | n/a |
| Photo feed load | Skeleton grid (8 cells) | "Could not load photos." | "No photos yet — be the first!" |
| Comment list | Subtle loading indicator | "Could not load comments." | "No comments yet." |
| Post comment | Submit button disabled | Inline error | n/a |
| Admin delete | Confirm dialog → loading → item removed | Toast error | n/a |

Skeleton cards: simple gray pulse `animate-pulse` rectangles matching the shape of the actual content.

---

## 6. Security final check

- [ ] `GUEST_PASSWORD_HASH` and `ADMIN_PASSWORD_HASH` are bcrypt hashes (not plaintext) — verify using `node -e "require('bcryptjs').hash('mypassword', 12).then(console.log)"`.
- [ ] `SESSION_SECRET` is ≥32 random characters.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not referenced in any file prefixed `NEXT_PUBLIC_` or imported in client components.
- [ ] No secrets in `next.config.ts` `env` block that would be bundled into the client.
- [ ] All server actions validate session before doing anything.
- [ ] Upload route validates MIME type server-side (magic bytes check), not just client-side `accept` attribute.
- [ ] `robots.txt` + `X-Robots-Tag` both present (confirm in production after deploy).
- [ ] Admin password is longer and stronger than the guest password (remind the user).

---

## 7. Pre-launch checklist

### Content (user must supply)
- [ ] Real couple names set in `wedding-config.ts`.
- [ ] Real wedding date, times, venue, address, map URL.
- [ ] Schedule items finalized.
- [ ] Dress code wording confirmed.
- [ ] `gallery.opensAt` and `gallery.closesAt` set to correct UTC datetimes.
- [ ] Guest password chosen and hashed: `GUEST_PASSWORD_HASH` set in Vercel env vars.
- [ ] Admin password chosen and hashed: `ADMIN_PASSWORD_HASH` set in Vercel env vars.
- [ ] `SESSION_SECRET` generated and set.
- [ ] Supabase project URL and anon key set in Vercel env vars.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in Vercel env vars (server-only, **not** public).
- [ ] Gift list seeded in Supabase (at least a few gifts before launch).
- [ ] La Luxe Script font file licensed and uploaded (or fallback confirmed acceptable).
- [ ] Monogram / branding mark finalized if used.

### Technical
- [ ] `next build` completes with no errors.
- [ ] All TypeScript errors resolved (`tsc --noEmit` passes).
- [ ] Vercel deployment succeeds.
- [ ] Visit the live URL: gate page loads, login works, `/home`, `/gifts`, `/gallery` (locked state) all render.
- [ ] `/admin/login` works; admin panel shows.
- [ ] Test reservation flow end-to-end on production.
- [ ] Test photo upload on production (gallery window temporarily opened by setting `opensAt` to a past time, then reset).
- [ ] Confirm `robots.txt` is live at `<domain>/robots.txt` and contains `Disallow: /`.
- [ ] Confirm response headers include `X-Robots-Tag: noindex` (use `curl -I <domain>`).
- [ ] Test on an actual mobile device (not just browser devtools).

---

## 8. Acceptance criteria

- [ ] `next build` produces no errors or warnings (TypeScript, ESLint).
- [ ] Lighthouse score ≥85 for Performance, ≥90 for Accessibility on `/home` (run via Chrome DevTools).
- [ ] No horizontal scroll at 375px on any page.
- [ ] No layout shift (CLS) on page load from image or font load.
- [ ] All interactive elements have visible focus rings.
- [ ] All error states are covered with user-friendly messages.
- [ ] The site looks intentional and polished — not like a default template.
