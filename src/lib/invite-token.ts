import { randomBytes } from 'crypto';

export function generateInviteSlug(): string {
  return randomBytes(9).toString('base64url');
}
