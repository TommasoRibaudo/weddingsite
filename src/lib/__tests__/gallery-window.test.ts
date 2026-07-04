import { describe, expect, it, vi } from 'vitest';
import { galleryIsOpen } from '@/lib/gallery-window';
import { getWeddingLocalDate, isWeddingDay } from '@/lib/wedding-config';

vi.mock('@/lib/wedding-config', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/wedding-config')>();
  return {
    ...original,
    gallery: {
      opensAt: '2026-06-23T00:00:00-06:00',
      closesAt: '2026-08-10T23:59:59-06:00',
    },
  };
});

describe('galleryIsOpen', () => {
  it('returns false before the configured gallery window', () => {
    vi.setSystemTime(new Date('2026-06-22T23:59:59-06:00'));

    expect(galleryIsOpen()).toBe(false);
  });

  it('returns true inside the configured gallery window', () => {
    vi.setSystemTime(new Date('2026-06-23T00:00:00-06:00'));

    expect(galleryIsOpen()).toBe(true);
  });

  it('returns false after the configured gallery window', () => {
    vi.setSystemTime(new Date('2026-08-11T00:00:00-06:00'));

    expect(galleryIsOpen()).toBe(false);
  });
});

describe('wedding date helpers', () => {
  it('formats dates in the wedding timezone', () => {
    expect(getWeddingLocalDate(new Date('2026-08-08T05:59:00Z'))).toBe('2026-08-07');
    expect(getWeddingLocalDate(new Date('2026-08-08T06:00:00Z'))).toBe('2026-08-08');
  });

  it('detects the wedding day in Costa Rica local time', () => {
    expect(isWeddingDay(new Date('2026-08-08T12:00:00Z'))).toBe(true);
    expect(isWeddingDay(new Date('2026-08-09T06:00:00Z'))).toBe(false);
  });
});
