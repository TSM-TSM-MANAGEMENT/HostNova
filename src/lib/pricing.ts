import { PricingBreakdown, SubscriptionDiscount } from '../types/hostnova';

/**
 * Round to 2 decimal places accurately using epsilon adjustment.
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Single source of truth for HostNova subscription discount calculation.
 * Discounted Monthly Price = Base Monthly Price * (1 - Discount Percentage / 100)
 * Total Subscription Price = Discounted Monthly Price * Number of Months
 */
export function calculatePricing(
  baseMonthlyPrice: number,
  durationMonths: number,
  discountPercentage: number
): PricingBreakdown {
  const safeBase = Math.max(0, Number(baseMonthlyPrice) || 0);
  const safeMonths = Math.max(1, Math.round(Number(durationMonths) || 1));
  const safeDiscount = Math.min(80, Math.max(0, Number(discountPercentage) || 0));

  const discountedMonthlyExact = safeBase * (1 - safeDiscount / 100);
  const discountedMonthlyPrice = roundCurrency(discountedMonthlyExact);
  const originalTotal = roundCurrency(safeBase * safeMonths);
  const finalTotal = roundCurrency(discountedMonthlyExact * safeMonths);
  const discountAmount = roundCurrency(Math.max(0, originalTotal - finalTotal));

  return {
    baseMonthlyPrice: roundCurrency(safeBase),
    durationMonths: safeMonths,
    discountPercentage: safeDiscount,
    discountedMonthlyPrice,
    originalTotal,
    discountAmount,
    finalTotal,
  };
}

export function getDiscountForDuration(
  discounts: SubscriptionDiscount[],
  durationMonths: number
): SubscriptionDiscount {
  const found = discounts.find((d) => d.durationMonths === durationMonths && d.isActive);
  if (found) return found;
  const fallback = discounts.find((d) => d.isActive) || {
    id: 'dur_1m',
    durationMonths: 1,
    label: '1 Month',
    discountPercentage: 0,
    isActive: true,
  };
  return fallback;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function addMonthsIso(start: Date, months: number): string {
  const next = new Date(start.getTime());
  next.setMonth(next.getMonth() + months);
  return next.toISOString().split('T')[0];
}

function randomAlphaNum(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join('');
}

export function generateIdentifiers() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const suffix = randomAlphaNum(5);
  const year = new Date().getFullYear();

  return {
    orderDocId: `ord_${Date.now()}_${randomAlphaNum(6).toLowerCase()}`,
    orderNumber: `HN-ORD-${year}-${stamp}${suffix.slice(0, 3)}`,
    paymentDocId: `pay_${Date.now()}_${randomAlphaNum(6).toLowerCase()}`,
    transactionId: `HN-TXN-${stamp}${suffix}`,
    invoiceDocId: `inv_${Date.now()}_${randomAlphaNum(6).toLowerCase()}`,
    invoiceNumber: `HN-INV-${year}-${stamp}${suffix.slice(0, 3)}`,
    hostingDocId: `hst_${Date.now()}_${randomAlphaNum(6).toLowerCase()}`,
    hostingId: `HN-SRV-${stamp}${suffix.slice(0, 3)}`,
  };
}

export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) && trimmed.length <= 200;
}

export function validateDomainName(domain: string): { valid: boolean; normalized: string; error?: string } {
  const trimmed = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!trimmed) {
    return { valid: true, normalized: '' };
  }
  const domainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/;
  if (!domainRegex.test(trimmed) || trimmed.length > 253) {
    return {
      valid: false,
      normalized: trimmed,
      error: 'Enter a valid domain name (for example, example.com) or leave blank.',
    };
  }
  return { valid: true, normalized: trimmed };
}

export function validateGitHubRepoUrl(url: string): { valid: boolean; normalized: string; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: true, normalized: '' };
  }
  try {
    const parsed = new URL(trimmed);
    const repoPathRegex = /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\.git)?\/?$/;
    if (parsed.protocol !== 'https:' || (parsed.hostname !== 'github.com' && parsed.hostname !== 'www.github.com')) {
      return {
        valid: false,
        normalized: trimmed,
        error: 'GitHub repository URL must start with https://github.com/owner/repository.',
      };
    }
    if (!repoPathRegex.test(parsed.pathname) || trimmed.length > 300) {
      return {
        valid: false,
        normalized: trimmed,
        error: 'Enter a full HTTPS GitHub repository URL (https://github.com/owner/repository).',
      };
    }
    return { valid: true, normalized: `https://github.com${parsed.pathname.replace(/\/$/, '')}` };
  } catch {
    return {
      valid: false,
      normalized: trimmed,
      error: 'Enter a valid HTTPS GitHub repository URL (https://github.com/owner/repository).',
    };
  }
}
