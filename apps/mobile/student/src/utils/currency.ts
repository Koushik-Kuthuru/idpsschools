/**
 * Formats amounts in Indian Rupees with Indian numbering (lakhs/crores).
 * Examples: ₹1,000 | ₹10,000 | ₹1,00,000 | ₹10,00,000
 */
export function formatINR(amount: number, options?: { decimals?: boolean }): string {
  const value = Math.abs(amount);
  const [whole, fraction] = value.toFixed(options?.decimals ? 2 : 0).split('.');
  const formatted = formatIndianDigits(whole);
  const prefix = amount < 0 ? '-₹' : '₹';
  if (options?.decimals && fraction && Number(fraction) > 0) {
    return `${prefix}${formatted}.${fraction}`;
  }
  return `${prefix}${formatted}`;
}

function formatIndianDigits(digits: string): string {
  const n = digits.replace(/\D/g, '');
  if (n.length <= 3) return n;
  const last3 = n.slice(-3);
  let rest = n.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
}
