import { randomInt } from "node:crypto";

// Crockford-style alphabet: no 0/O, 1/I/L, U — easy to read aloud and type.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Tracking IDs look like SY-7K3M-Q9XD-2P: 10 random characters from a
 * 30-symbol alphabet (~49 bits) drawn from a CSPRNG. Guest lookups also
 * require the order's phone number and are rate-limited.
 */
export function generateTrackingId(): string {
  let s = "";
  for (let i = 0; i < 10; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `SY-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

export function normalizeTrackingId(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("SY") ? raw.slice(2) : raw;
  if (body.length !== 10 || [...body].some((c) => !ALPHABET.includes(c))) return null;
  return `SY-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}`;
}
