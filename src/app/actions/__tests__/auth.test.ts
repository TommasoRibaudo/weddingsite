import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSession = {
  access: false,
  guestName: '',
  isAdmin: false,
  save: vi.fn(),
};

const from = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: { from },
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

function maybeSingleResult(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data }),
  };
}

function insertResult(error: unknown = null) {
  return {
    insert: vi.fn().mockResolvedValue({ error }),
  };
}

function updateResult() {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
}

describe('auth actions', () => {
  beforeEach(() => {
    mockSession.access = false;
    mockSession.guestName = '';
    mockSession.isAdmin = false;
    mockSession.save.mockResolvedValue(undefined);
    from.mockReset();
  });

  describe('confirmInvite', () => {
    it('rejects a missing or revoked invite token', async () => {
      from.mockReturnValueOnce(maybeSingleResult(null));
      const { confirmInvite } = await import('@/app/actions/auth');
      const formData = new FormData();
      formData.set('token', 'ghost-token');

      await expect(confirmInvite(null, formData)).resolves.toEqual({ error: 'invalid' });
      expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('logs in an invited guest and claims their profile', async () => {
      from
        .mockReturnValueOnce(maybeSingleResult({ guest_name: 'Melissa', revoked: false, redeemed_at: null }))
        .mockReturnValueOnce(insertResult(null))
        .mockReturnValueOnce(updateResult());
      const { confirmInvite } = await import('@/app/actions/auth');
      const formData = new FormData();
      formData.set('token', 'melissa-abc123');

      await expect(confirmInvite(null, formData)).rejects.toThrow('NEXT_REDIRECT:/home');
      expect(mockSession.access).toBe(true);
      expect(mockSession.guestName).toBe('Melissa');
      expect(mockSession.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('changeGuestName', () => {
    it('does not allow changing a guest name without an authenticated session', async () => {
      const { changeGuestName } = await import('@/app/actions/auth');
      const formData = new FormData();
      formData.set('name', 'Tommaso');

      await expect(changeGuestName(formData)).resolves.toEqual({ error: 'Not authenticated.' });
      expect(mockSession.save).not.toHaveBeenCalled();
    });

    it('trims and stores authenticated guest name changes', async () => {
      mockSession.access = true;
      const { changeGuestName } = await import('@/app/actions/auth');
      const formData = new FormData();
      formData.set('name', '  Tommaso  ');

      await expect(changeGuestName(formData)).resolves.toEqual({ ok: true, guestName: 'Tommaso' });
      expect(mockSession.guestName).toBe('Tommaso');
      expect(mockSession.save).toHaveBeenCalledTimes(1);
    });
  });
});
