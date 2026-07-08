import zipcodes from 'zipcodes';

/**
 * Resolves a 2-letter US state code from a ZIP/ZIP+4 string. Used only when
 * `CustStateProv` doesn't match a known state/province code (e.g. the `RD`
 * anomaly), so a typo'd or garbage state field doesn't get discarded.
 */
export function resolveStateFromZip(zip: string | null | undefined): string | null {
  if (!zip) return null;
  const digitsOnly = zip.toString().trim().split('-')[0].replace(/\D/g, '');
  if (digitsOnly.length !== 5) return null;
  const info = zipcodes.lookup(digitsOnly);
  return info?.state ?? null;
}
