import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  access: boolean;
  guestName: string;
  isAdmin: boolean;
  passwordVerified: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'wedding_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
