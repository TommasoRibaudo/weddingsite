import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSession = {
  access: true,
  guestName: 'Guest One',
  isAdmin: false,
};

const revalidatePath = vi.fn();
const refresh = vi.fn();
const from = vi.fn();

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: { from },
}));

vi.mock('next/cache', () => ({
  revalidatePath,
  refresh,
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

function contributionDeleteResult(error: unknown = null) {
  const query = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({ error });
  return query;
}

describe('gift actions', () => {
  beforeEach(() => {
    mockSession.access = true;
    mockSession.guestName = 'Guest One';
    mockSession.isAdmin = false;
    from.mockReset();
    revalidatePath.mockReset();
    refresh.mockReset();
  });

  it('rejects gift contributions from unauthenticated guests', async () => {
    mockSession.access = false;
    const { contributeToGift } = await import('@/app/actions/gifts');

    await expect(contributeToGift('gift-1', 25)).resolves.toEqual({ error: 'Not authenticated.' });
    expect(from).not.toHaveBeenCalled();
  });

  it('validates gift contribution amounts before touching Supabase', async () => {
    const { contributeToGift } = await import('@/app/actions/gifts');

    await expect(contributeToGift('gift-1', Number.NaN)).resolves.toEqual({ error: 'invalid_amount' });
    await expect(contributeToGift('gift-1', 0)).resolves.toEqual({ error: 'invalid_amount' });
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
    expect(refresh).toHaveBeenCalled();
  });

  it('stores a valid group gift contribution and refreshes gifts', async () => {
    from
      .mockReturnValueOnce(giftSelectResult({ id: 'gift-1', price: 100, divideable: true }))
      .mockReturnValueOnce(insertResult());
    const { contributeToGift } = await import('@/app/actions/gifts');

    await expect(contributeToGift('gift-1', 30)).resolves.toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith('/gifts');
    expect(refresh).toHaveBeenCalled();
  });

  it('reports contribution withdrawal failures', async () => {
    from.mockReturnValueOnce(contributionDeleteResult({ message: 'delete failed' }));
    const { withdrawContribution } = await import('@/app/actions/gifts');

    await expect(withdrawContribution('gift-1')).resolves.toEqual({ error: 'Something went wrong. Please try again.' });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
