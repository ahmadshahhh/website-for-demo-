/**
 * Kuwait mobile numbers: 8 digits starting with 4, 5, 6 or 9 (landlines 2).
 * Stored normalised as 965XXXXXXXX. Accepts +965, 00965, spaces, dashes and
 * Arabic-Indic digits.
 */
export function normalizePhone(input: string): string | null {
  const ascii = input.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  let digits = ascii.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("965")) digits = digits.slice(3);
  if (!/^[24569]\d{7}$/.test(digits)) return null;
  return `965${digits}`;
}

export function formatPhone(normalized: string): string {
  const local = normalized.startsWith("965") ? normalized.slice(3) : normalized;
  return `+965 ${local.slice(0, 4)} ${local.slice(4)}`;
}

/** Masks all but the last 3 digits, e.g. +965 •••• •123. */
export function maskPhone(normalized: string): string {
  const local = normalized.startsWith("965") ? normalized.slice(3) : normalized;
  return `+965 •••• •${local.slice(-3)}`;
}
