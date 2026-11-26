export const phoneRegex = /^01[3-9]\d{8}$/;

/**
 * Normalizes Bangladeshi mobile numbers into 11-digit `01XXXXXXXXX` format.
 * Handles `+8801XXXXXXXXX`, `8801XXXXXXXXX`, `008801XXXXXXXXX`, `1XXXXXXXXX`, and spaces/dashes.
 */
export function normalizeBdPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00880") && digits.length === 15) {
    return digits.slice(4);
  }
  if (digits.startsWith("880") && digits.length === 13) {
    return digits.slice(2);
  }
  if (digits.startsWith("1") && digits.length === 10) {
    return `0${digits}`;
  }
  return digits || raw.trim();
}

export function phoneToEmail(phone: string) {
  return `${normalizeBdPhone(phone)}@asikgame.app`;
}