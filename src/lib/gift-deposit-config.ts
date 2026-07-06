import 'server-only';
import type { DepositDetail, DepositDestination, GiftDepositConfig } from './gift-deposit-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDetails(value: unknown): DepositDetail[] | null {
  if (!Array.isArray(value)) return null;

  const details = value
    .map((item) => {
      if (!isRecord(item) || typeof item.label !== 'string' || typeof item.value !== 'string') return null;
      const label = item.label.trim();
      const detailValue = item.value.trim();
      return label && detailValue ? { label, value: detailValue } : null;
    })
    .filter((item): item is DepositDetail => item !== null);

  return details.length > 0 ? details : null;
}

export function getGiftDepositConfig(): GiftDepositConfig | null {
  const raw = process.env.GIFT_DEPOSIT_OPTIONS_JSON?.trim();
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.beneficiary !== 'string' || typeof parsed.reason !== 'string') return null;
    if (!Array.isArray(parsed.destinations)) return null;

    const beneficiary = parsed.beneficiary.trim();
    const reason = parsed.reason.trim();
    if (!beneficiary || !reason) return null;

    const destinations = parsed.destinations
      .map((destination) => {
        if (!isRecord(destination) || typeof destination.id !== 'string' || typeof destination.label !== 'string') return null;
        const details = parseDetails(destination.details);
        if (!details) return null;

        const id = destination.id.trim();
        const label = destination.label.trim();
        return id && label ? { id, label, details } : null;
      })
      .filter((destination): destination is DepositDestination => destination !== null);

    return destinations.length > 0 ? { beneficiary, reason, destinations } : null;
  } catch {
    return null;
  }
}