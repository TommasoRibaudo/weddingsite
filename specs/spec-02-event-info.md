# Spec 02 — Event Info Page (`/home`)

## Goal
Build the `/home` page: a visually rich, static event-details page presenting all wedding day information. No database interaction — content is defined in code/config. Requires a valid guest session (enforced by middleware from Spec 01).

---

## 1. Content to display

All values below are **placeholders** — replace with real details before launch. Centralize them in `src/lib/wedding-config.ts` so every page that needs event data imports from one place.

```ts
// src/lib/wedding-config.ts
export const wedding = {
  coupleNames: 'Sophia & James',          // used in headings
  monogram: 'S & J',
  date: '2026-09-12',                     // ISO date string
  dateDisplay: 'Saturday, 12 September 2026',
  ceremonyTime: '3:00 PM',
  receptionTime: '5:30 PM',
  venueName: 'The Grand Estate',
  venueAddress: '123 Garden Lane, Countryside, County AB1 2CD',
  venueMapUrl: 'https://maps.google.com/?q=...',  // full Google Maps link
  dressCode: 'Black tie optional — garden party attire welcome.',
  schedule: [
    { time: '3:00 PM', event: 'Ceremony' },
    { time: '4:00 PM', event: 'Drinks Reception & Canapés' },
    { time: '5:30 PM', event: 'Wedding Breakfast' },
    { time: '8:00 PM', event: 'Evening Dancing & Celebration' },
    { time: '11:30 PM', event: 'Close' },
  ],
  additionalNotes: '',   // optional free-text block for anything else
};
```

---

## 2. Page structure

`src/app/(guest)/home/page.tsx` — server component (no client interactivity needed).

### 2.1 Hero section
- Full-width (or near-full), tall banner — `min-h-[60vh]` on desktop, `min-h-[50vh]` on mobile.
- Background: soft sage tint (`green-muted`) or a gentle gradient from `cream` to `green-pale`.
- Center-aligned content:
  - La Luxe Script: couple names in large display size.
  - Crimson Pro italic: date display string.
  - Thin green divider line below.

### 2.2 Details strip
Horizontal strip (stacks vertically on mobile) with three columns / cards:
| Column | Content |
|--------|---------|
| Ceremony | Clock icon, time, "Ceremony" label |
| Venue | Pin icon, venue name, address (2 lines) |
| Dress Code | Hanger/sparkle icon, dress code text |

Cards: white background, `rounded-xl`, subtle `shadow-sm`, green accent border-top or left stripe.

### 2.3 Schedule / timeline section
- Section heading: La Luxe Script "The Day" or "Our Day".
- Vertical timeline component:
  - Each item: time on the left (right-aligned), green dot/circle connector, event name on the right.
  - On mobile: single column, time above event.
  - Subtle `bg-green-pale` for alternate items or a continuous vertical green line.

### 2.4 Location / directions section
- Section heading: Crimson Pro semibold "Where to Find Us" or similar.
- Venue name, full address.
- A "Get Directions" button → opens `venueMapUrl` in a new tab. Styled as green outlined button.
- Optional: an embedded static map image (use a static maps API URL or a simple styled `<iframe>` of Google Maps). Mark this optional; skip if it adds complexity.

### 2.5 Additional notes (conditional)
Only render if `wedding.additionalNotes` is non-empty. Crimson Pro body text in a lightly tinted card.

---

## 3. Component breakdown

| Component | File | Notes |
|-----------|------|-------|
| `HeroSection` | `components/home/HeroSection.tsx` | Static display |
| `DetailsStrip` | `components/home/DetailsStrip.tsx` | 3-column strip |
| `DayTimeline` | `components/home/DayTimeline.tsx` | Schedule list |
| `LocationSection` | `components/home/LocationSection.tsx` | Address + map link |

All are server components (no `'use client'`).

Icons: use `lucide-react` (`npm install lucide-react`) — `Clock`, `MapPin`, `Shirt` or similar.

---

## 4. Styling notes

- Page uses the shared guest layout from Spec 01 (nav + footer already present).
- Max content width: `max-w-4xl mx-auto px-4`.
- Generous vertical spacing between sections: `py-16 md:py-24`.
- No dark backgrounds — keep white/cream/sage-tint palette throughout.
- The hero green divider: `<hr className="border-green w-24 mx-auto mt-6" />`.
- Schedule connector line: CSS `position: relative` + `::before` pseudo-element as a `2px` green vertical line, or Tailwind `border-l-2 border-green`.

---

## 5. No-JavaScript requirement
The page must render fully on the server — no client-side data fetching, no `useEffect`. All content comes from the static config object.

---

## 6. Acceptance criteria

- [ ] `/home` loads without a guest session → redirected to `/`.
- [ ] `/home` loads with a valid session → full page renders.
- [ ] Couple names appear in La Luxe Script (or fallback) in the hero.
- [ ] All schedule items render in the timeline.
- [ ] "Get Directions" link opens the correct URL in a new tab.
- [ ] Page renders correctly at 375px (mobile) with no horizontal overflow.
- [ ] Page renders correctly at 1280px (desktop) with columns/layout intact.
- [ ] `additionalNotes` section absent when the field is empty string.
