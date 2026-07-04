import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSession = {
  access: true,
  guestName: 'Guest One',
  isAdmin: false,
};

const revalidatePath = vi.fn();
const from = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: { from },
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

function giftSelectResult(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data }),
  };
}
function insertResult(error: unknown = null) {
  return {
    insert: vi.fn().mockResolvedValue({ error }),
  };
}

describe('gift actions', () => {
  beforeEach(() => {
    mockSession.access = true;
    mockSession.guestName = 'Guest One';
    mockSession.isAdmin = false;
    from.mockReset();
    revalidatePath.mockReset();
  });

  it('rejects gift contributions from unauthenticated guests', async () => {
    mockSession.access = false;
    const { contributeToGift } = await import('@/app/actions/gifts');

    await expect(contributeToGift('gift-1', 25)).resolves.toEqual({ error: 'Not authenticated.' });
    expect(from).not.toHaveBeenCalled();
  });

  it('validates gift contribution amounts before touching Supabase', async () => {
    const { contributeToGift } = await import('@/app/actions/gifts');

    await expect(contributeToGift('gift-1', 0)).resolves.toEqual({ error: 'Invalid amount.' });
    expect(from).not.toHaveBeenCalled();
  });

  it('allows contributions above the remaining gift balance', async () => {
    from
      .mockReturnValueOnce(giftSelectResult({ id: 'gift-1', price: 100, divideable: true }))
      .mockReturnValueOnce(insertResult());
    const { contributeToGift } = await import('@/app/actions/gifts');

    await expect(contributeToGift('gift-1', 125)).resolves.toEqual({ ok: true });
    expect(from).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/gifts');
  });

  it('stores a valid group gift contribution and revalidates gifts', async () => {
    from
      .mockReturnValueOnce(giftSelectResult({ id: 'gift-1', price: 100, divideable: true }))
      .mockReturnValueOnce(insertResult());
    const { contributeToGift } = await import('@/app/actions/gifts');

    await expect(contributeToGift('gift-1', 30)).resolves.toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith('/gifts');
  });
});
