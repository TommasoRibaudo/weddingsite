# Spec 01 — Scaffold, Session Gate, Base Theme

## Goal
Bootstrap a Next.js 14 (App Router) project wired to Supabase, implement the password + name session gate, establish the design system (palette, fonts, layout shell), and configure robots/noindex.

---

## 1. Project bootstrap

```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Install additional dependencies:
```
npm install @supabase/supabase-js @supabase/ssr iron-session sharp
```

Directory layout after scaffold:
```
src/
  app/
    (guest)/          # route group — all require guest session
      home/
      gifts/
      gallery/
    admin/
    api/
      auth/
        login/
        logout/
      admin/
        login/
        logout/
    layout.tsx        # root layout (fonts, global CSS)
    page.tsx          # gate page (/)
    robots.ts
  components/
  lib/
    supabase/
    session.ts
  middleware.ts
public/
  fonts/              # self-hosted La Luxe Script files
```

---

## 2. Environment variables

Required in `.env.local` (never committed):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never exposed to client
GUEST_PASSWORD_HASH=            # bcrypt hash of the shared guest password
ADMIN_PASSWORD_HASH=            # bcrypt hash of the admin password
SESSION_SECRET=                 # ≥32-char random string for iron-session
```

Add `bcryptjs` (`npm install bcryptjs @types/bcryptjs`) for password comparison.  
Passwords are **never** stored in plaintext anywhere in the codebase.

---

## 3. Session design

Use **iron-session** with a signed, encrypted HTTP-only cookie.

Session shape:
```ts
interface SessionData {
  access: boolean;      // true = valid guest session
  guestName: string;    // self-declared display name
  isAdmin: boolean;     // true = valid admin session
}
```

`src/lib/session.ts`:
```ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'wedding_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
```

---

## 4. Middleware

`src/middleware.ts` — runs on every request, redirects unauthenticated guests:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

const GUEST_ROUTES = ['/home', '/gifts', '/gallery'];
const ADMIN_ROUTES = ['/admin'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req.cookies, sessionOptions);

  const { pathname } = req.nextUrl;

  if (GUEST_ROUTES.some(r => pathname.startsWith(r))) {
    if (!session.access) return NextResponse.redirect(new URL('/', req.url));
  }

  if (ADMIN_ROUTES.some(r => pathname.startsWith(r)) && pathname !== '/admin/login') {
    if (!session.isAdmin) return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/home/:path*', '/gifts/:path*', '/gallery/:path*', '/admin/:path*'],
};
```

---

## 5. Gate page — `/`

**`src/app/page.tsx`** — server component that checks session and redirects if already logged in; otherwise renders the gate UI.

Two-step flow:
1. **Step 1 — password.** Single password input + submit. On success (via server action), store nothing yet, set a short-lived `passwordVerified` flag in session, advance to step 2.
2. **Step 2 — name.** Text input for display name (required, trimmed, max 50 chars). On submit, write `{ access: true, guestName }` to session, redirect to `/home`.

Server actions in `src/app/actions/auth.ts`:

```ts
'use server';
import { compareSync } from 'bcryptjs';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function verifyPassword(formData: FormData) {
  const password = formData.get('password') as string;
  const valid = compareSync(password, process.env.GUEST_PASSWORD_HASH!);
  if (!valid) return { error: 'Incorrect password.' };
  const session = await getSession();
  session.passwordVerified = true;
  await session.save();
  return { ok: true };
}

export async function setGuestName(formData: FormData) {
  const session = await getSession();
  if (!session.passwordVerified) redirect('/');
  const name = (formData.get('name') as string)?.trim().slice(0, 50);
  if (!name) return { error: 'Please enter your name.' };
  session.access = true;
  session.guestName = name;
  session.passwordVerified = false;
  await session.save();
  redirect('/home');
}
```

Gate UI requirements:
- Centered card, full-viewport height, white background.
- La Luxe Script heading: couple's names or "You're invited".
- Crimson Pro body text for labels and error messages.
- Password input: `type="password"`, autocomplete="current-password".
- Name input (step 2): autocomplete="name", placeholder "Your name".
- Button styled with green `#386b40`, white text, rounded.
- Inline error display (no page reload required — use React state + server action result).
- Mobile-first: card takes 90% width on mobile, max-w-md on desktop.

---

## 6. Logout

`POST /api/auth/logout` — route handler that destroys the session and redirects to `/`.  
A "Log out" link in the nav (see §8) calls this.

---

## 7. Design system — Tailwind config

Extend `tailwind.config.ts`:
```ts
theme: {
  extend: {
    colors: {
      green: {
        DEFAULT: '#386b40',
        light: '#5a9463',
        muted: '#e8f0e9',   // sage tint for backgrounds
        pale: '#f2f7f2',    // near-white tint
      },
      cream: '#faf8f5',     // warm off-white page background
      greige: '#e8e4dc',    // neutral dividers / borders
    },
    fontFamily: {
      display: ['La Luxe Script', 'cursive'],
      body: ['Crimson Pro', 'Georgia', 'serif'],
    },
  },
},
```

Global CSS (`src/app/globals.css`):
- Import Crimson Pro from Google Fonts: `@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');`
- Self-host La Luxe Script via `@font-face` pointing to `/fonts/la-luxe-script.woff2`.  
  **Confirm the font license before self-hosting.** If La Luxe Script is unavailable, fall back to `'Great Vibes'` from Google Fonts until the file is sourced.
- Set `body { @apply font-body text-gray-800 bg-cream; }`
- Set `font-display: swap` on the `@font-face` rule.

Type scale (Tailwind classes to use consistently):
| Role | Class |
|------|-------|
| Script hero | `font-display text-5xl md:text-7xl` |
| Script section title | `font-display text-3xl md:text-4xl` |
| Heading (body font) | `font-body font-semibold text-xl md:text-2xl` |
| Body | `font-body text-base md:text-lg` |
| Caption / label | `font-body text-sm` |

---

## 8. Layout shell

`src/app/(guest)/layout.tsx` — shared layout for all guest routes:
- Sticky top nav: logo/monogram left, nav links (`Home`, `Gifts`, `Gallery`) right, plus `Log out` button far right.
- On mobile: hamburger → slide-in drawer with same links.
- Footer: minimal, just couple's names + year.
- Nav links styled with Crimson Pro, active link underlined in green.
- Background: `bg-cream`.

---

## 9. robots.ts + noindex

`src/app/robots.ts`:
```ts
export default function robots() {
  return { rules: { userAgent: '*', disallow: '/' } };
}
```

Add to root layout `<head>`:
```html
<meta name="robots" content="noindex, nofollow" />
```

Also add `X-Robots-Tag: noindex` header in `next.config.ts`:
```ts
headers: async () => [{
  source: '/(.*)',
  headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
}]
```

---

## 10. Supabase client helpers

`src/lib/supabase/client.ts` — browser client (for client components):
```ts
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

`src/lib/supabase/server.ts` — server client (for server components / actions / route handlers):
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } },
  );
}
```

`src/lib/supabase/admin.ts` — service-role client (bypasses RLS, server-only):
```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
export const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
```

---

## 11. Acceptance criteria

- [ ] `npm run dev` starts with no errors.
- [ ] Visiting `/home`, `/gifts`, `/gallery` without a session redirects to `/`.
- [ ] Wrong password shows inline error; right password advances to name step.
- [ ] Submitting a name sets session and lands on `/home`.
- [ ] Refreshing `/home` stays on `/home` (session persists).
- [ ] Logging out destroys session and redirects to `/`.
- [ ] `curl -s https://<domain>/robots.txt` contains `Disallow: /`.
- [ ] Response headers include `X-Robots-Tag: noindex, nofollow`.
- [ ] La Luxe Script (or fallback) renders visibly on the gate page heading.
- [ ] Crimson Pro renders for body text.
- [ ] Mobile viewport (375px): gate card, nav, footer all usable without horizontal scroll.
