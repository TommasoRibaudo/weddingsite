This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# TODO
  # Generate hashes (run in Node REPL or a script):
  node -e "const b=require('bcryptjs'); console.log(b.hashSync('yourpassword', 10))"

  SESSION_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
  GUEST_PASSWORD_HASH=<bcrypt hash>
  ADMIN_PASSWORD_HASH=<bcrypt hash>
  NEXT_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
  SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
  GOOGLE_MYMAPS_GIFTS_EMBED_URL=<Google My Maps embed URL, e.g. https://www.google.com/maps/d/embed?mid=...>

  La Luxe Script font: place the .woff2 file at public/fonts/la-luxe-script.woff2. Until then, Great Vibes (Google
  Fonts) is the active fallback.

## Supabase setup

Run `supabase/schema.sql` in the Supabase SQL editor. It creates the app tables:

- `gifts`
- `photos`
- `comments`
- `menu_responses`

It also creates/updates the private `wedding-photos` storage bucket used by the gallery.

## Testing

Automated tests cover the practical baseline:

```bash
npm run test
npm run test:watch
npm run test:e2e
npm run test:all
```

- `npm run test` runs Vitest unit and component tests with mocked session, Supabase, and Next.js server helpers.
- `npm run test:e2e` runs Playwright smoke tests and starts the Next.js dev server automatically. If `TEST_GUEST_PASSWORD` and `TEST_ADMIN_PASSWORD` are set, the broader authenticated E2E suite is enabled too.
- Full Supabase-backed flows such as real photo uploads, gift reservations, and admin moderation remain covered by `MANUAL_TESTS.md`.
